import React from 'react';
import { Users, Upload, BookOpen, Download, Sparkles, Smartphone } from 'lucide-react';
import { generateSampleZipBlob } from '../services/demoData';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface HeaderProps {
  peopleCount: number;
  onOpenUpload: () => void;
  onOpenDirectory: () => void;
  onLoadDemo: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  peopleCount,
  onOpenUpload,
  onOpenDirectory,
  onLoadDemo,
  onGoHome,
}) => {
  const { canInstall, promptInstall } = usePwaInstall();
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
      console.error('Failed to generate sample zip', err);
    }
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 pt-safe pl-safe pr-safe">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        {/* Logo / Title */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 sm:gap-3 text-right group active:scale-[0.98] transition-transform min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight truncate">
              שינון אנשים <span className="hidden sm:inline-block text-xs font-normal text-indigo-400 bg-indigo-950/70 border border-indigo-800/50 px-2 py-0.5 rounded-full ml-1">מקומי</span>
            </h1>
            <p className="hidden sm:block text-xs text-slate-400 truncate">תרגול שמות, תמונות ותעודות זהות</p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Install PWA Button (when installable) */}
          {canInstall && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[44px] rounded-xl bg-violet-600/30 hover:bg-violet-600/50 active:scale-[0.96] border border-violet-500/50 text-xs font-semibold text-violet-200 transition-all shadow-md shadow-violet-600/20"
              title="התקן כאפליקציה למכשיר שלך"
            >
              <Smartphone className="w-3.5 h-3.5 text-violet-300" />
              <span className="hidden sm:inline">התקן אפליקציה</span>
              <span className="sm:hidden">התקן</span>
            </button>
          )}

          {/* People Count Badge */}
          <button
            onClick={onOpenDirectory}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-[0.96] border border-slate-700/60 text-xs font-medium text-slate-300 transition-all"
            title="צפה בספריית האנשים"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">{peopleCount} אנשים</span>
            <span className="sm:hidden font-mono font-bold text-slate-200">{peopleCount}</span>
          </button>

          {/* Quick Demo button if empty */}
          {peopleCount === 0 && (
            <button
              onClick={onLoadDemo}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.96] border border-amber-500/30 text-xs font-medium text-amber-300 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>טען הדגמה</span>
            </button>
          )}

          {/* Download Sample ZIP Template */}
          <button
            onClick={handleDownloadSample}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-slate-800/60 hover:bg-slate-800 active:scale-[0.96] border border-slate-700/40 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            title="הורד קובץ ZIP לדוגמה עם manifest"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>הורד ZIP לדוגמה</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.96] text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">העלאת ZIP</span>
            <span className="sm:hidden">העלאה</span>
          </button>
        </div>
      </div>
    </header>
  );
};
