import React, { useState } from 'react';
import { ArrowRight, Flame, Trophy, Shuffle, Volume2, VolumeX } from 'lucide-react';
import type { ConcreteGameMode, GameMode } from '../types/person';
import { isSoundMuted, toggleSound } from '../utils/sound';

interface GameHeaderProps {
  mode: GameMode;
  currentMode?: ConcreteGameMode;
  currentIndex: number;
  totalQuestions: number;
  score: number;
  streak: number;
  onExit: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  mode,
  currentMode,
  currentIndex,
  totalQuestions,
  score,
  streak,
  onExit,
}) => {
  const [muted, setMuted] = useState(isSoundMuted());

  const handleToggleSound = () => {
    const nextMuted = toggleSound();
    setMuted(nextMuted);
  };

  const getSpecificTitle = (m: ConcreteGameMode | 'flashcards') => {
    switch (m) {
      case 'photo-to-name':
        return 'זהה את השם המלא';
      case 'photo-to-first-name':
        return 'זהה את השם הפרטי';
      case 'name-to-photo':
        return 'בחר תמונה לפי שם';
      case 'name-to-id':
        return 'בחר ת"ז לפי שם';
      case 'photo-to-id':
        return 'בחר ת"ז מתמונה';
      case 'id-to-photo':
        return 'בחר תמונה מת"ז';
      case 'id-to-name':
        return 'בחר שם מת"ז';
      case 'photo-to-id-type':
        return 'הקלד ת"ז מתמונה';
      case 'flashcards':
        return 'כרטיסיות זיכרון';
    }
  };

  const progressPercent = Math.min(100, Math.round(((currentIndex + 1) / totalQuestions) * 100));

  const getMultiplier = () => {
    if (streak >= 10) return 'x2.5';
    if (streak >= 5) return 'x2.0';
    if (streak >= 3) return 'x1.5';
    return null;
  };

  const multiplier = getMultiplier();

  return (
    <div className="w-full max-w-3xl mx-auto mb-6" dir="rtl">
      {/* Top row */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-4 mb-2.5 sm:mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={onExit}
            className="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 active:scale-[0.96] transition-all min-h-[42px] min-w-[42px] py-2 px-2.5 sm:px-3 rounded-xl hover:bg-slate-800 shrink-0"
            title="חזרה לתפריט הראשי"
          >
            <ArrowRight className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">חזרה</span>
          </button>

          <button
            onClick={handleToggleSound}
            className="p-2 min-h-[42px] min-w-[42px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center shrink-0"
            title={muted ? 'הפעל צלילים' : 'השתק צלילים'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5 min-w-0 justify-center">
          {mode === 'mix' && (
            <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold shrink-0">
              <Shuffle className="w-3 h-3 text-cyan-400" />
              <span>מעורב</span>
            </span>
          )}
          <span className="text-xs sm:text-sm font-bold text-slate-200 tracking-wide truncate text-center">
            {mode === 'mix' && currentMode ? getSpecificTitle(currentMode) : getSpecificTitle(mode as ConcreteGameMode | 'flashcards')}
          </span>
        </div>

        {/* Stats: Score & Streak */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {streak > 1 && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold animate-pop shadow-sm ${
              streak >= 5
                ? 'bg-gradient-to-r from-amber-500/25 to-rose-500/25 border-amber-500/50 text-amber-300 shadow-amber-500/20'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }`}>
              <Flame className={`w-3.5 h-3.5 shrink-0 ${streak >= 5 ? 'text-rose-400 fill-rose-400 animate-pulse' : 'text-amber-500 fill-amber-500'}`} />
              <span>{streak}</span>
              {multiplier && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-200 font-mono">
                  {multiplier}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{score}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium px-0.5">
        <span>שאלה {currentIndex + 1} מתוך {totalQuestions}</span>
        <span className="font-mono text-indigo-300">{progressPercent}%</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800/80 overflow-hidden p-0.5 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
