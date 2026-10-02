import React, { useRef, useState } from 'react';
import { X, Search, Trash2, Download, BookOpen, Edit3, Camera, Check, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import type { Person, StoredPerson } from '../types/person';

interface PeopleDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onDeletePerson: (id: string) => Promise<void>;
  onUpdatePerson: (oldId: string, updated: StoredPerson) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export const PeopleDirectoryModal: React.FC<PeopleDirectoryModalProps> = ({
  isOpen,
  onClose,
  people,
  onDeletePerson,
  onUpdatePerson,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Edit Person State
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editId, setEditId] = useState('');
  const [editPhotoBlob, setEditPhotoBlob] = useState<Blob | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = (p: Person) => {
    if (editPhotoBlob && editPhotoPreview && editPhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(editPhotoPreview);
    }
    setEditingPersonId(p.id);
    setEditName(p.name);
    setEditId(p.id);
    setEditPhotoBlob(null);
    setEditPhotoPreview(p.photoUrl);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    if (editPhotoBlob && editPhotoPreview && editPhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(editPhotoPreview);
    }
    setEditingPersonId(null);
    setEditName('');
    setEditId('');
    setEditPhotoBlob(null);
    setEditPhotoPreview(null);
    setEditError(null);
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('יש לבחור קובץ תמונה תקין (JPG, PNG, WebP וכד\')');
      return;
    }

    if (editPhotoBlob && editPhotoPreview && editPhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(editPhotoPreview);
    }

    const preview = URL.createObjectURL(file);
    setEditPhotoBlob(file);
    setEditPhotoPreview(preview);
    setEditError(null);
  };

  const handleSaveEdit = async (originalPerson: Person) => {
    const trimmedName = editName.trim();
    const trimmedId = editId.trim();

    if (!trimmedName) {
      setEditError('יש להזין שם מלא');
      return;
    }

    if (!trimmedId) {
      setEditError('יש להזין מספר תעודת זהות');
      return;
    }

    // Check duplicate ID if ID changed
    if (trimmedId !== originalPerson.id) {
      const exists = people.some((p) => p.id === trimmedId);
      if (exists) {
        setEditError('מספר תעודת זהות זה כבר שייך לאדם אחר במאגר');
        return;
      }
    }

    setIsSavingEdit(true);
    try {
      const finalBlob = editPhotoBlob || originalPerson.photoBlob;
      await onUpdatePerson(originalPerson.id, {
        id: trimmedId,
        name: trimmedName,
        photoBlob: finalBlob,
        createdAt: originalPerson.createdAt ?? 0,
      });
      handleCancelEdit();
    } catch (err: any) {
      setEditError(err.message || 'שגיאה בשמירת השינויים');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleModalClose = () => {
    handleCancelEdit();
    onClose();
  };

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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleModalClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col max-h-[90dvh] pb-safe sm:pb-8">
        {/* Mobile handle indicator */}
        <div className="w-12 h-1 bg-slate-700/60 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={handleModalClose}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-[0.96] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-right mb-4 sm:mb-6 pr-1">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
            <span>ספריית אנשים ({people.length})</span>
          </h3>
          <p className="text-slate-400 text-xs">
            צפה בכל הפרופילים השמורים במאגר המקומי של הדפדפן, ערוך או מחק
          </p>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 mb-4">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם או מספר תעודת זהות..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-base sm:text-xs min-h-[42px] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportZip}
              disabled={isExporting || people.length === 0}
              className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-[0.96] text-slate-300 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
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
                  className="px-2.5 py-1.5 min-h-[40px] rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-[0.96] text-white text-xs font-bold transition-all"
                >
                  בטוח? מחק!
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-1.5 min-h-[40px] rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-slate-200 active:scale-[0.96]"
                >
                  ביטול
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={people.length === 0}
                className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-rose-950/40 hover:bg-rose-950/60 active:scale-[0.96] border border-rose-900/60 text-rose-300 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>מחק הכל</span>
              </button>
            )}
          </div>
        </div>

        {/* People List */}
        <div className="flex-1 overflow-y-auto pl-2 pr-1 space-y-2.5">
          {filteredPeople.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              {people.length === 0
                ? 'המאגר ריק. העלה קובץ ZIP או טען נתוני דמו כדי להתחיל.'
                : 'לא נמצאו תוצאות התואמות לחיפוש.'}
            </div>
          ) : (
            filteredPeople.map((p) => {
              const isEditing = editingPersonId === p.id;

              if (isEditing) {
                return (
                  <form
                    key={p.id}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveEdit(p);
                    }}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border-2 border-indigo-500/80 shadow-xl space-y-3 animate-in fade-in duration-150"
                  >
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                      {/* Photo with Change button */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-indigo-500/60 bg-slate-900 shadow-inner group">
                          <img
                            src={editPhotoPreview || p.photoUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-indigo-200 text-[11px] font-semibold transition-colors border border-slate-700/60"
                        >
                          <Camera className="w-3 h-3" />
                          <span>שנה תמונה</span>
                        </button>
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoSelected}
                        />
                      </div>

                      {/* Inputs */}
                      <div className="flex-1 w-full space-y-2.5 text-right">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            שם מלא:
                          </label>
                          <input
                            type="text"
                            dir="auto"
                            value={editName}
                            disabled={isSavingEdit}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="הזן שם מלא..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            מספר תעודת זהות:
                          </label>
                          <input
                            type="text"
                            value={editId}
                            disabled={isSavingEdit}
                            onChange={(e) => setEditId(e.target.value)}
                            placeholder="הזן תעודת זהות..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Validation error if any */}
                    {editError && (
                      <div className="text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60 text-right">
                        {editError}
                      </div>
                    )}

                    {/* Actions: Save / Cancel */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        disabled={isSavingEdit}
                        onClick={handleCancelEdit}
                        className="px-3.5 py-1.5 min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-[0.96] text-slate-300 text-xs font-semibold transition-all"
                      >
                        ביטול
                      </button>

                      <button
                        type="submit"
                        disabled={isSavingEdit}
                        className="px-4 py-1.5 min-h-[38px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.96] text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {isSavingEdit ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>{isSavingEdit ? 'שומר...' : 'שמור שינויים'}</span>
                      </button>
                    </div>
                  </form>
                );
              }

              return (
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

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(p)}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/30 active:scale-[0.94] transition-all"
                      title="ערוך פרטי אדם זה"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeletePerson(p.id)}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 active:scale-[0.94] transition-all"
                      title="מחק אדם זה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
