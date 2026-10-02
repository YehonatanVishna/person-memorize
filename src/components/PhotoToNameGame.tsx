import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import type { Person } from '../types/person';
import type { RoundEvaluation, RoundStatus } from '../utils/gameEngine';

interface PhotoToNameGameProps {
  person: Person;
  status: RoundStatus;
  lastEvaluation: RoundEvaluation | null;
  onSubmit: (answer: string) => void;
  onNext: () => void;
}

export const PhotoToNameGame: React.FC<PhotoToNameGameProps> = ({
  person,
  status,
  lastEvaluation,
  onSubmit,
  onNext,
}) => {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount and whenever new person appears
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [person.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'pending') {
      if (!inputVal.trim()) return;
      onSubmit(inputVal);
    } else if (status === 'feedback') {
      onNext();
    }
  };

  const handleSkip = () => {
    if (status === 'pending') {
      onSubmit('לא ידוע');
    }
  };

  return (
    <div className="max-w-md mx-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Photo Container */}
        <div className="relative mb-6 group">
          <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-inner flex items-center justify-center">
            {person.photoUrl ? (
              <img
                src={person.photoUrl}
                alt="אדם לזיהוי"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="text-slate-500 text-sm">אין תמונה זמינה</div>
            )}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-400 mb-2 text-right">
              מה שמו המלא של האדם בתמונה?
            </label>
            <input
              ref={inputRef}
              type="text"
              dir="auto"
              value={inputVal}
              disabled={status === 'feedback'}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="הקלד כאן את השם..."
              className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-slate-100 placeholder:text-slate-500 text-base font-medium focus:outline-none transition-all ${
                status === 'feedback'
                  ? lastEvaluation?.isCorrect
                    ? lastEvaluation.isTypo
                      ? 'border-amber-500/70 bg-amber-950/20'
                      : 'border-emerald-500/70 bg-emerald-950/20'
                    : 'border-rose-500/70 bg-rose-950/20'
                  : 'border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
          </div>

          {/* Feedback Display */}
          {status === 'feedback' && lastEvaluation && (
            <div
              className={`w-full p-4 rounded-xl mb-4 border flex items-start gap-3 transition-all ${
                lastEvaluation.isCorrect
                  ? lastEvaluation.isTypo
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}
            >
              {lastEvaluation.isCorrect ? (
                lastEvaluation.isTypo ? (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}

              <div className="text-right">
                <div className="font-bold text-sm">
                  {lastEvaluation.isCorrect
                    ? lastEvaluation.isTypo
                      ? 'נכון! (זוהתה שגיאת הקלדה קלה)'
                      : 'כל הכבוד! תשובה מדויקת'
                    : 'תשובה שגויה'}
                </div>
                {!lastEvaluation.isCorrect && (
                  <div className="text-xs mt-1 text-rose-300">
                    השם הנכון הוא:{' '}
                    <span className="font-bold text-white text-sm underline decoration-rose-500">
                      {lastEvaluation.correctAnswer}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            {status === 'pending' ? (
              <>
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>בדוק תשובה</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
                >
                  לא יודע
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onNext}
                autoFocus
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>המשך לשאלה הבאה</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
