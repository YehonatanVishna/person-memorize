import JSZip from 'jszip';
import { StoredPerson } from '../types/person';

/**
 * Creates an SVG avatar Blob with initials and styling.
 */
function createAvatarBlob(name: string, bgGradientStart: string, bgGradientEnd: string): Blob {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGradientStart}" />
          <stop offset="100%" stop-color="${bgGradientEnd}" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.25" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" rx="40" />
      <circle cx="150" cy="115" r="55" fill="rgba(255,255,255,0.2)" />
      <path d="M70 260 C70 190, 230 190, 230 260" fill="rgba(255,255,255,0.2)" />
      <text x="150" y="165" font-family="system-ui, -apple-system, sans-serif" font-size="70" font-weight="bold" fill="#ffffff" text-anchor="middle" filter="url(#shadow)">
        ${initials}
      </text>
    </svg>
  `;

  return new Blob([svg], { type: 'image/svg+xml' });
}

export interface DemoItem {
  id: string;
  name: string;
  photoFilename: string;
  colorStart: string;
  colorEnd: string;
}

export const SAMPLE_PEOPLE_RAW: DemoItem[] = [
  { id: '208192345', name: 'ישראל ישראלי', photoFilename: 'israel.svg', colorStart: '#3b82f6', colorEnd: '#1d4ed8' },
  { id: '312847561', name: 'נועה לוי', photoFilename: 'noa.svg', colorStart: '#ec4899', colorEnd: '#be185d' },
  { id: '207564893', name: 'איתי כהן', photoFilename: 'itay.svg', colorStart: '#10b981', colorEnd: '#047857' },
  { id: '319284712', name: 'מאיה אברהם', photoFilename: 'maya.svg', colorStart: '#8b5cf6', colorEnd: '#6d28d9' },
  { id: '206748392', name: 'דניאל פרידמן', photoFilename: 'daniel.svg', colorStart: '#f59e0b', colorEnd: '#b45309' },
  { id: '324859610', name: 'תמר מזרחי', photoFilename: 'tamar.svg', colorStart: '#06b6d4', colorEnd: '#0e7490' },
  { id: '215984732', name: 'יונתן גולדשטיין', photoFilename: 'yonatan.svg', colorStart: '#6366f1', colorEnd: '#4338ca' },
  { id: '318765439', name: 'שירה דוד', photoFilename: 'shira.svg', colorStart: '#14b8a6', colorEnd: '#0f766e' },
];

/**
 * Returns mock demo records ready to be stored in IndexedDB.
 */
export function getDemoStoredPeople(): StoredPerson[] {
  return SAMPLE_PEOPLE_RAW.map((item) => ({
    id: item.id,
    name: item.name,
    photoBlob: createAvatarBlob(item.name, item.colorStart, item.colorEnd),
    createdAt: Date.now(),
  }));
}

/**
 * Generates a downloadable ZIP containing `people.json` manifest and images.
 */
export async function generateSampleZipBlob(): Promise<Blob> {
  const zip = new JSZip();

  const manifest = SAMPLE_PEOPLE_RAW.map((item) => ({
    id: item.id,
    name: item.name,
    photo: item.photoFilename,
  }));

  zip.file('people.json', JSON.stringify(manifest, null, 2));

  for (const item of SAMPLE_PEOPLE_RAW) {
    const blob = createAvatarBlob(item.name, item.colorStart, item.colorEnd);
    zip.file(item.photoFilename, blob);
  }

  return await zip.generateAsync({ type: 'blob' });
}
