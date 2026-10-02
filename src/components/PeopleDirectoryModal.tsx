import { useState } from 'react';
import { X, Search, Trash2, Download, BookOpen } from 'lucide-react';
import JSZip from 'jszip';
import type { Person } from '../types/person';

interface PeopleDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onDeletePerson: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export const PeopleDirectoryModal: React.FC<PeopleDirectoryModalProps> = ({
  isOpen,
  onClose,
  people,
  onDeletePerson,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const filteredPeople = people.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportZip = async () => {
    if (people.length === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const manifest = people.map((p, idx) => {
        const ext = p.photoBlob.type.includes('png') ? 'png' : p.photoBlob.type.includes('svg') ? 'svg' : 'jpg';
        return {
          id: p.id,
          name: p.name,
          photo: `photo_${idx + 1}.${ext}`,
        };
      });

      zip.file('people.json', JSON.stringify(manifest, null, 2));

      people.forEach((p, idx) => {
        const ext = p.photoBlob.type.includes('png') ? 'png' : p.photoBlob.type.includes('svg') ? 'svg' : 'jpg';
        zip.file(`photo_${idx + 1}.${ext}`, p.photoBlob);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exported_roster_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" dir="rtl">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-right mb-6">
          <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>ספריית אנשים ({people.length})</span>
          </h3>
          <p className="text-slate-400 text-xs">
            צפה בכל הפרופילים השמורים במאגר המקומי של הדפדפן
          </p>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם או מספר תעודת זהות..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportZip}
              disabled={isExporting || people.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
              title="ייצא את כל האנשים והתמונות לקובץ ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ייצוא ל-ZIP</span>
            </button>

            {confirmClear ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={async () => {
                    await onClearAll();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                >
                  בטוח? מחק!
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-slate-200"
                >
                  ביטול
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={people.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/60 text-rose-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>מחק הכל</span>
              </button>
            )}
          </div>
        </div>

        {/* People List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          {filteredPeople.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              {people.length === 0
                ? 'המאגר ריק. העלה קובץ ZIP או טען נתוני דמו כדי להתחיל.'
                : 'לא נמצאו תוצאות התואמות לחיפוש.'}
            </div>
          ) : (
            filteredPeople.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="font-bold text-sm text-slate-200 truncate" dir="auto">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      ת"ז: {p.id}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeletePerson(p.id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors opacity-70 group-hover:opacity-100"
                  title="מחק אדם זה"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
