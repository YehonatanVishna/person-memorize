import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { parseZipArchive } from './zipParser';

describe('ZIP Manifest Parser', () => {
  it('parses valid JSON manifest with photos', async () => {
    const zip = new JSZip();
    const manifest = [
      { id: '101', name: 'ישראל ישראלי', photo: 'israel.png' },
      { id: '102', name: 'שרה כהן', photo: 'sarah.jpg' },
    ];
    zip.file('people.json', JSON.stringify(manifest));
    zip.file('israel.png', new Uint8Array([1, 2, 3]));
    zip.file('sarah.jpg', new Uint8Array([4, 5, 6]));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const result = await parseZipArchive(zipBlob);

    expect(result.people).toHaveLength(2);
    expect(result.manifestFileName).toBe('people.json');
    expect(result.people[0].name).toBe('ישראל ישראלי');
    expect(result.people[0].id).toBe('101');
    expect(result.people[1].name).toBe('שרה כהן');
    expect(result.warnings).toHaveLength(0);
  });

  it('parses CSV manifest correctly', async () => {
    const zip = new JSZip();
    const csvContent = 'id,name,photo\n201,נועה לוי,noa.jpg\n202,איתי כהן,itay.png';
    zip.file('manifest.csv', csvContent);
    zip.file('noa.jpg', new Uint8Array([10, 20]));
    zip.file('itay.png', new Uint8Array([30, 40]));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const result = await parseZipArchive(zipBlob);

    expect(result.people).toHaveLength(2);
    expect(result.people[0].name).toBe('נועה לוי');
    expect(result.people[0].id).toBe('201');
    expect(result.people[1].name).toBe('איתי כהן');
    expect(result.people[1].id).toBe('202');
  });

  it('throws error when manifest is missing', async () => {
    const zip = new JSZip();
    zip.file('random.txt', 'hello');
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    await expect(parseZipArchive(zipBlob)).rejects.toThrow(/לא נמצא קובץ נתונים/);
  });

  it('collects warning when photo is missing from archive', async () => {
    const zip = new JSZip();
    const manifest = [
      { id: '301', name: 'דניאל', photo: 'daniel.png' },
      { id: '302', name: 'תמר', photo: 'missing.png' },
    ];
    zip.file('data.json', JSON.stringify(manifest));
    zip.file('daniel.png', new Uint8Array([1, 2]));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const result = await parseZipArchive(zipBlob);

    expect(result.people).toHaveLength(1);
    expect(result.people[0].name).toBe('דניאל');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('missing.png');
  });
});
