import React from 'react';
import { ArrowRight, Flame, Trophy } from 'lucide-react';
import type { GameMode } from '../types/person';

interface GameHeaderProps {
  mode: GameMode;
  currentIndex: number;
  totalQuestions: number;
  score: number;
  streak: number;
  onExit: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  mode,
  currentIndex,
  totalQuestions,
  score,
  streak,
  onExit,
}) => {
  const getModeTitle = () => {
    switch (mode) {
      case 'photo-to-name':
        return 'זהה את השם';
      case 'name-to-id':
        return 'בחר תעודת זהות';
      case 'name-to-photo':
        return 'בחר את התמונה';
    }
  };

  const progressPercent = Math.min(100, Math.round(((currentIndex + 1) / totalQuestions) * 100));

  return (
    <div className="w-full max-w-3xl mx-auto mb-6" dir="rtl">
      {/* Top row */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה לתפריט</span>
        </button>

        <span className="text-sm font-bold text-slate-200 tracking-wide">
          {getModeTitle()}
        </span>

        {/* Stats: Score & Streak */}
        <div className="flex items-center gap-3">
          {streak > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{streak} ברצף</span>
            </div>
          )}

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-indigo-400" />
            <span>{score} נקודות</span>
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
