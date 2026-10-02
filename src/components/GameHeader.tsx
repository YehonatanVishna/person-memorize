import React from 'react';
import { ArrowRight, Flame, Trophy, Shuffle } from 'lucide-react';
import type { ConcreteGameMode, GameMode } from '../types/person';

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
  const getSpecificTitle = (m: ConcreteGameMode) => {
    switch (m) {
      case 'photo-to-name':
        return 'זהה את השם';
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
    }
  };

  const progressPercent = Math.min(100, Math.round(((currentIndex + 1) / totalQuestions) * 100));

  return (
    <div className="w-full max-w-3xl mx-auto mb-6" dir="rtl">
      {/* Top row */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2.5 sm:mb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 active:scale-[0.96] transition-all min-h-[44px] min-w-[44px] py-2 px-3 rounded-xl hover:bg-slate-800 shrink-0"
        >
          <ArrowRight className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">חזרה לתפריט</span>
          <span className="sm:hidden">חזרה</span>
        </button>

        <div className="flex items-center gap-1.5 min-w-0 justify-center">
          {mode === 'mix' && (
            <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold shrink-0">
              <Shuffle className="w-3 h-3 text-cyan-400" />
              <span>מעורב</span>
            </span>
          )}
          <span className="text-xs sm:text-sm font-bold text-slate-200 tracking-wide truncate text-center">
            {mode === 'mix' && currentMode ? getSpecificTitle(currentMode) : getSpecificTitle(mode as ConcreteGameMode)}
          </span>
        </div>

        {/* Stats: Score & Streak */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {streak > 1 && (
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span>{streak}<span className="hidden sm:inline"> ברצף</span></span>
            </div>
          )}

          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{score}<span className="hidden sm:inline"> נקודות</span></span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
        <span>שאלה {currentIndex + 1} מתוך {totalQuestions}</span>
        <span>{progressPercent}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
