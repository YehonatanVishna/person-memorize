import React, { useEffect } from 'react';
import { Trophy, Clock, Flame, RotateCcw, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { GameSummary } from '../types/person';
import { triggerCompletionConfetti } from '../utils/confetti';

interface GameSummaryModalProps {
  summary: GameSummary;
  onPlayAgain: () => void;
  onRetryMistakes: () => void;
  onGoHome: () => void;
}

export const GameSummaryModal: React.FC<GameSummaryModalProps> = ({
  summary,
  onPlayAgain,
  onRetryMistakes,
  onGoHome,
}) => {
  useEffect(() => {
    if (summary.scorePercentage >= 80) {
      triggerCompletionConfetti();
    }
  }, [summary.scorePercentage]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} שניות`;
    return `${mins} דק' ו-${secs} שנ'`;
  };

  const getScoreHeadline = () => {
    if (summary.scorePercentage === 100) return 'ציון מושלם! 🎯';
    if (summary.scorePercentage >= 80) return 'עבודה מעולה! 🌟';
    if (summary.scorePercentage >= 60) return 'תוצאה יפה מאוד! 👍';
    return 'המשך לתרגל, השיפור יגיע! 💪';
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-2 sm:py-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl">
        {/* Header / Score Banner */}
        <div className="text-center mb-5 sm:mb-8">
          <div className="inline-flex p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 text-indigo-400 mb-2 sm:mb-3 shadow-inner">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-1">
            {getScoreHeadline()}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            סיימת את סבב התרגול בהצלחה
          </p>

          <div className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300 my-2 sm:my-4 tracking-tight">
            {summary.scorePercentage}%
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-8">
          <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-base sm:text-xl font-bold text-white">
              {summary.correctCount}/{summary.totalQuestions}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">תשובות נכונות</div>
          </div>

          <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-base sm:text-xl font-bold text-white">
              {summary.highestStreak}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">רצף שיא</div>
          </div>

          <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 mx-auto mb-1" />
            <div className="text-base sm:text-xl font-bold text-white truncate">
              {formatDuration(summary.durationSeconds)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">זמן כולל</div>
          </div>
        </div>

        {/* Mistakes Review Section */}
        {summary.mistakes.length > 0 ? (
          <div className="mb-5 sm:mb-8">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>שאלות לחזרה ({summary.mistakes.length}):</span>
              </h3>
              <button
                onClick={onRetryMistakes}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 active:scale-[0.96] hover:underline"
              >
                תרגל שאלות אלו עכשיו ←
              </button>
            </div>

            <div className="space-y-2 max-h-56 sm:max-h-60 overflow-y-auto pr-1">
              {summary.mistakes.map((mistake, idx) => (
                <div
                  key={`${mistake.person.id}-${idx}`}
                  className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 sm:gap-3"
                >
                  {/* Thumbnail */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                    <img
                      src={mistake.person.photoUrl}
                      alt={mistake.person.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-right min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-white truncate" dir="auto">
                      {mistake.person.name}
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-400 font-mono">
                      ת"ז: {mistake.person.id}
                    </div>
                  </div>

                  {/* Comparison */}
                  <div className="text-left text-[11px] sm:text-xs shrink-0">
                    <div className="text-rose-400 font-medium">
                      ענית: {mistake.userAnswer || '(דלג)'}
                    </div>
                    <div className="text-emerald-400 font-semibold">
                      נכון: {mistake.correctAnswer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-5 sm:mb-8 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-center text-xs sm:text-sm font-medium">
            ללא טעויות כלל! זיכרון פנומנלי 🏆
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          {summary.mistakes.length > 0 && (
            <button
              onClick={onRetryMistakes}
              className="w-full sm:flex-1 min-h-[46px] py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>תרגל טעויות בלבד ({summary.mistakes.length})</span>
            </button>
          )}

          <button
            onClick={onPlayAgain}
            className="w-full sm:flex-1 min-h-[46px] py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-[0.98] border border-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>סבב חדש</span>
          </button>

          <button
            onClick={onGoHome}
            className="w-full sm:w-auto min-h-[46px] py-3 px-4 rounded-xl bg-transparent hover:bg-slate-850 active:scale-[0.98] text-slate-400 hover:text-slate-200 font-medium text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>חזרה לתפריט</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
