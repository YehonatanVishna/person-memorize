import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Flame, RotateCcw, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { GameSummary } from '../types/person';

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
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore in case canvas is unavailable
      }
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
    <div className="max-w-2xl mx-auto py-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Header / Score Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 text-indigo-400 mb-3 shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
            {getScoreHeadline()}
          </h2>
          <p className="text-slate-400 text-sm">
            סיימת את סבב התרגול בהצלחה
          </p>

          <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300 my-4 tracking-tight">
            {summary.scorePercentage}%
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">
              {summary.correctCount}/{summary.totalQuestions}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">תשובות נכונות</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">
              {summary.highestStreak}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">רצף שיא</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <Clock className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">
              {formatDuration(summary.durationSeconds)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">זמן כולל</div>
          </div>
        </div>

        {/* Mistakes Review Section */}
        {summary.mistakes.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>שאלות לחזרה ({summary.mistakes.length}):</span>
              </h3>
              <button
                onClick={onRetryMistakes}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                תרגל שאלות אלו עכשיו ←
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {summary.mistakes.map((mistake, idx) => (
                <div
                  key={`${mistake.person.id}-${idx}`}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                    <img
                      src={mistake.person.photoUrl}
                      alt={mistake.person.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-right min-w-0">
                    <div className="font-bold text-sm text-white truncate" dir="auto">
                      {mistake.person.name}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      ת"ז: {mistake.person.id}
                    </div>
                  </div>

                  {/* Comparison */}
                  <div className="text-left text-xs shrink-0">
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
          <div className="mb-8 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-center text-sm font-medium">
            ללא טעויות כלל! זיכרון פנומנלי 🏆
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {summary.mistakes.length > 0 && (
            <button
              onClick={onRetryMistakes}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>תרגל טעויות בלבד ({summary.mistakes.length})</span>
            </button>
          )}

          <button
            onClick={onPlayAgain}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>סבב חדש</span>
          </button>

          <button
            onClick={onGoHome}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-transparent hover:bg-slate-850 text-slate-400 hover:text-slate-200 font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <span>חזרה לתפריט</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
