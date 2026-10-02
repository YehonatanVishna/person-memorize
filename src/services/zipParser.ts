import JSZip from 'jszip';
import Papa from 'papaparse';
import type { ManifestItem, StoredPerson } from '../types/person';

export interface ParseZipResult {
  people: StoredPerson[];
  manifestFileName: string;
  warnings: string[];
}

/**
 * Common manifest filenames in order of preference.
 */
const MANIFEST_NAMES = [
  'people.json',
  'manifest.json',
  'data.json',
  'roster.json',
  'people.csv',
  'manifest.csv',
  'data.csv',
  'roster.csv',
];

/**
 * Determine MIME type from file extension.
 */
function getMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

/**
 * Normalize manifest object keys (supports English & Hebrew column aliases).
 */
function normalizeManifestRow(row: Record<string, any>): ManifestItem | null {
  const keys = Object.keys(row);
  let id: string = '';
  let name: string = '';
  let photo: string = '';

  for (const rawKey of keys) {
    const key = rawKey.trim().toLowerCase();
    const value = String(row[rawKey] ?? '').trim();

    if (['id', 'identifier', 'tz', 'תז', 'ת.ז', 'תעודת זהות'].includes(key)) {
      id = value;
    } else if (['name', 'fullname', 'full_name', 'שם', 'שם מלא'].includes(key)) {
      name = value;
    } else if (['photo', 'image', 'picture', 'file', 'avatar', 'img', 'תמונה'].includes(key)) {
      photo = value;
    }
  }

  if (!name && !id && !photo) return null;

  return {
    id: id || '',
    name: name || '',
    photo: photo || '',
  };
}

/**
 * Parse a ZIP file containing a manifest file (JSON or CSV) and corresponding photos.
 */
export async function parseZipArchive(file: File | Blob): Promise<ParseZipResult> {
  const zip = await JSZip.loadAsync(file);
  const warnings: string[] = [];

  // 1. Locate manifest file
  let manifestEntry: JSZip.JSZipObject | null = null;
  let manifestFileName = '';

  // Look for known manifest names
  for (const name of MANIFEST_NAMES) {
    const entry = zip.file(name) || zip.file(new RegExp(`(^|/)${name}$`, 'i'))[0];
    if (entry) {
      manifestEntry = entry;
      manifestFileName = entry.name;
      break;
    }
  }

  // If not found, look for any .json or .csv in the archive root
  if (!manifestEntry) {
    const allFiles = Object.keys(zip.files).filter((k) => !zip.files[k].dir);
    const jsonOrCsv = allFiles.find((f) => f.toLowerCase().endsWith('.json') || f.toLowerCase().endsWith('.csv'));
    if (jsonOrCsv) {
      manifestEntry = zip.file(jsonOrCsv);
      manifestFileName = jsonOrCsv;
    }
  }

  if (!manifestEntry) {
    throw new Error(
      'לא נמצא קובץ נתונים (Manifest) בתוך קובץ ה-ZIP. יש לכלול קובץ people.json או people.csv המכיל את השדות id, name, photo.'
    );
  }

  const manifestContent = await manifestEntry.async('string');
  const items: ManifestItem[] = [];

  // 2. Parse Manifest content (JSON or CSV)
  if (manifestFileName.toLowerCase().endsWith('.json')) {
    try {
      const parsed = JSON.parse(manifestContent);
      const rawList = Array.isArray(parsed) ? parsed : parsed.people || parsed.data || [];
      for (const item of rawList) {
        const normalized = normalizeManifestRow(item);
        if (normalized) items.push(normalized);
      }
    } catch (err: any) {
      throw new Error(`שגיאה בפענוח קובץ ה-JSON (${manifestFileName}): ${err.message}`);
    }
  } else {
    // CSV format
    const parsedCsv = Papa.parse<Record<string, any>>(manifestContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsedCsv.errors && parsedCsv.errors.length > 0) {
      warnings.push(`אזהרות CSV: ${parsedCsv.errors.map((e) => e.message).join(', ')}`);
    }

    for (const row of parsedCsv.data) {
      const normalized = normalizeManifestRow(row);
      if (normalized) items.push(normalized);
    }
  }

  if (items.length === 0) {
    throw new Error('קובץ ה-Manifest ריק או שאינו מכיל רשומות תקינות.');
  }

  // 3. Map images and build StoredPerson records
  const people: StoredPerson[] = [];
  const allZipFiles = Object.keys(zip.files).filter((k) => !zip.files[k].dir);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNum = i + 1;

    if (!item.name) {
      warnings.push(`שורה ${rowNum}: חסר שם עבור רשומה זו, דולג.`);
      continue;
    }

    const id = item.id ? String(item.id).trim() : `gen_${Date.now()}_${i}`;

    // Find photo in ZIP
    let photoEntry: JSZip.JSZipObject | null = null;

    if (item.photo) {
      const targetPhoto = item.photo.trim().replace(/^(\.\/|\/)/, '');
      const photoBasename = targetPhoto.split('/').pop()?.toLowerCase();

      // 1. Try exact path
      photoEntry = zip.file(targetPhoto);

      // 2. Try case-insensitive matching by basename
      if (!photoEntry && photoBasename) {
        const matched = allZipFiles.find((f) => f.split('/').pop()?.toLowerCase() === photoBasename);
        if (matched) {
          photoEntry = zip.file(matched);
        }
      }
    }

    if (!photoEntry) {
      warnings.push(`שורה ${rowNum} (${item.name}): לא נמצאה תמונה "${item.photo}" בארכיון.`);
      continue;
    }

    const mime = getMimeType(photoEntry.name);
    const arrayBuffer = await photoEntry.async('arraybuffer');
    const photoBlob = new Blob([arrayBuffer], { type: mime });

    people.push({
      id,
      name: item.name.trim(),
      photoBlob,
      createdAt: Date.now(),
    });
  }

  if (people.length === 0) {
    throw new Error('לא נמצאו רשומות עם תמונות תואמות בתוך קובץ ה-ZIP.');
  }

  return {
    people,
    manifestFileName,
    warnings,
  };
}
