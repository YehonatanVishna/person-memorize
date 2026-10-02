import React, { useRef, useState } from 'react';
import { X, Upload, FileArchive, AlertCircle, CheckCircle, Download, Sparkles, Loader2 } from 'lucide-react';
import { parseZipArchive } from '../services/zipParser';
import { generateSampleZipBlob } from '../services/demoData';
import type { StoredPerson } from '../types/person';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePeople: (people: StoredPerson[], replace: boolean) => Promise<void>;
  onLoadDemo: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSavePeople,
  onLoadDemo,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ count: number; warnings: string[] } | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setErrorMsg('יש לבחור קובץ בארכיון מסוג ZIP בלבד.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      const result = await parseZipArchive(file);
      await onSavePeople(result.people, replaceExisting);
      setSuccessInfo({
        count: result.people.length,
        warnings: result.warnings,
      });
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'שגיאה בעיבוד קובץ ה-ZIP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const blob = await generateSampleZipBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_people.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[90dvh] pb-safe sm:pb-8">
        {/* Mobile handle indicator */}
        <div className="w-12 h-1 bg-slate-700/60 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-[0.96] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-right mb-5 sm:mb-6 pr-1">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <FileArchive className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
            <span>העלאת קובץ ZIP</span>
          </h3>
          <p className="text-slate-400 text-xs">
            טען קובץ ZIP עם פרטי האנשים ותמונותיהם ישירות לדפדפן (ללא שרת)
          </p>
        </div>

        {/* Drag and Drop Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center mb-4 sm:mb-5 active:scale-[0.99] ${
            isDragging
              ? 'border-indigo-500 bg-indigo-950/30'
              : 'border-slate-700 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-950'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessFile(e.target.files[0]);
              }
            }}
          />

          {isLoading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-200">מעבד קובץ ZIP ותמונות...</p>
              <p className="text-xs text-slate-400 mt-1">מחלץ קבצים ושומר ב-IndexedDB</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/70 border border-indigo-800/40 text-indigo-400 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                גרור לכאן את קובץ ה-ZIP או לחץ לבחירה
              </p>
              <p className="text-xs text-slate-500">
                קובץ ארכיון המכיל manifest ותמונות
              </p>
            </>
          )}
        </div>

        {/* Upload Mode Switch (Replace vs Append) */}
        <div className="flex items-center justify-between mb-5 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <span className="text-slate-300 font-medium">אופן הטעינה:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReplaceExisting(true)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                replaceExisting
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              החלף הכל
            </button>
            <button
              type="button"
              onClick={() => setReplaceExisting(false)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                !replaceExisting
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              הוסף לקיימים
            </button>
          </div>
        </div>

        {/* Status / Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 mb-4 text-right">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {successInfo && (
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2 mb-4 text-right">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">נטענו בהצלחה {successInfo.count} אנשים!</div>
              {successInfo.warnings.length > 0 && (
                <div className="text-[11px] text-amber-300 mt-1">
                  הערות: {successInfo.warnings.slice(0, 3).join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Format Explanation & Quick Actions */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs mb-5 text-right space-y-1.5 leading-relaxed">
          <div className="font-semibold text-slate-300">מבנה הקובץ הנדרש:</div>
          <div>
            1. קובץ <code className="text-indigo-300">people.json</code> או <code className="text-indigo-300">people.csv</code> עם עמודות/שדות:
            <code className="text-slate-200 mr-1">id, name, photo</code>
          </div>
          <div>
            2. קובצי התמונות התואמים בפורמט JPG, PNG, WEBP או SVG.
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleDownloadSample}
            className="min-h-[40px] px-2 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 active:scale-[0.96] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>הורד ZIP לדוגמה</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onLoadDemo();
              onClose();
            }}
            className="min-h-[40px] px-2 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 active:scale-[0.96] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>טען 8 פרופילי דמו</span>
          </button>
        </div>
      </div>
    </div>
  );
};
