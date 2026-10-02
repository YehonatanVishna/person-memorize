import React from 'react';
import { Users, Upload, BookOpen, Download, Sparkles } from 'lucide-react';
import { generateSampleZipBlob } from '../services/demoData';

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
    <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Title */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 text-right group hover:opacity-90 transition-opacity"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
              שינון אנשים <span className="text-xs font-normal text-indigo-400 bg-indigo-950/70 border border-indigo-800/50 px-2 py-0.5 rounded-full ml-1">מקומי</span>
            </h1>
            <p className="text-xs text-slate-400">תרגול שמות, תמונות ותעודות זהות</p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* People Count Badge */}
          <button
            onClick={onOpenDirectory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-xs font-medium text-slate-300 transition-colors"
            title="צפה בספריית האנשים"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>{peopleCount} אנשים</span>
          </button>

          {/* Quick Demo button if empty */}
          {peopleCount === 0 && (
            <button
              onClick={onLoadDemo}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium text-amber-300 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>טען נתוני הדגמה</span>
            </button>
          )}

          {/* Download Sample ZIP Template */}
          <button
            onClick={handleDownloadSample}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            title="הורד קובץ ZIP לדוגמה עם manifest"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>הורד ZIP לדוגמה</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/30"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>העלאת ZIP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
