import React, { useState } from 'react';
import { Users, BookOpen, Download, Sparkles, Smartphone, Trophy, Volume2, VolumeX, RotateCw } from 'lucide-react';
import { generateSampleZipBlob } from '../services/demoData';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { getPlayerProfile } from '../services/playerProgress';
import { isSoundMuted, toggleSound } from '../utils/sound';

interface HeaderProps {
  peopleCount: number;
  onOpenUpload: () => void;
  onOpenDirectory: () => void;
  onLoadDemo: () => void;
  onGoHome: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  peopleCount,
  onOpenDirectory,
  onLoadDemo,
  onGoHome,
  onOpenProfile,
}) => {
  const { canInstall, promptInstall } = usePwaInstall();
  const [muted, setMuted] = useState(isSoundMuted());
  const profile = getPlayerProfile();

  const handleToggleSound = () => {
    const nextMuted = toggleSound();
    setMuted(nextMuted);
  };

  const handleForceRefresh = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const k of keys) await caches.delete(k);
    }
    window.location.reload();
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
      console.error('Failed to generate sample zip', err);
    }
  };

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.08] sticky top-0 z-40 pt-safe pl-safe pr-safe shadow-sm shadow-black/20">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        {/* Logo / Title */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 sm:gap-3 text-right group active:scale-[0.98] transition-all min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight truncate flex items-center gap-1.5">
              <span>שינון אנשים</span>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">מקומי</span>
            </h1>
            <p className="hidden sm:block text-xs text-slate-400 truncate">תרגול וזיהוי שמות, תמונות ותעודות זהות</p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Hard Reload / Clear Cache */}
          <button
            onClick={handleForceRefresh}
            className="p-2 min-h-[42px] min-w-[42px] rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center shrink-0 border border-slate-800"
            title="רענן גרסה ונקה מטמון (Hard Reload)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={handleToggleSound}
            className="p-2 min-h-[42px] min-w-[42px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center shrink-0 border border-slate-800"
            title={muted ? 'הפעל צלילים' : 'השתק צלילים'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Player Level & XP Badge */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[42px] rounded-xl bg-gradient-to-r from-amber-500/15 to-indigo-500/15 hover:from-amber-500/25 hover:to-indigo-500/25 active:scale-[0.96] border border-amber-500/30 text-xs font-bold text-amber-300 transition-all shadow-sm"
            title="צפה ברמה, ניקוד והישגים"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>רמה {profile.level}</span>
            <span className="hidden md:inline text-indigo-300 font-mono text-[11px]">({profile.totalXP} XP)</span>
          </button>

          {/* Install PWA Button (when installable) */}
          {canInstall && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[42px] rounded-xl bg-violet-600/20 hover:bg-violet-600/30 active:scale-[0.96] border border-violet-500/40 text-xs font-semibold text-violet-200 transition-all shadow-sm"
              title="התקן כאפליקציה למכשיר שלך"
            >
              <Smartphone className="w-3.5 h-3.5 text-violet-300" />
              <span className="hidden sm:inline">התקן</span>
            </button>
          )}

          {/* People Count Badge */}
          <button
            onClick={onOpenDirectory}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[42px] rounded-xl bg-slate-900/90 hover:bg-slate-850 active:scale-[0.96] border border-slate-800 text-xs font-medium text-slate-300 transition-all shadow-sm group hover:border-slate-700"
            title="צפה בספריית האנשים"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">{peopleCount} אנשים</span>
            <span className="sm:hidden font-mono font-bold text-slate-200">{peopleCount}</span>
          </button>

          {/* Quick Demo button if empty */}
          {peopleCount === 0 && (
            <button
              onClick={onLoadDemo}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 min-h-[42px] rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.96] border border-amber-500/30 text-xs font-semibold text-amber-300 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>טען הדגמה</span>
            </button>
          )}

          {/* Download Sample ZIP Template */}
          <button
            onClick={handleDownloadSample}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 min-h-[42px] rounded-xl bg-slate-900/60 hover:bg-slate-850 active:scale-[0.96] border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            title="הורד קובץ ZIP לדוגמה עם manifest"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">דוגמה</span>
          </button>
        </div>
      </div>
    </header>
  );
};
