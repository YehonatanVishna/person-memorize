import React, { useEffect } from 'react';
import { Check, X, ArrowLeft } from 'lucide-react';
import type { Person } from '../types/person';
import type { RoundEvaluation, RoundStatus } from '../utils/gameEngine';

interface NameToIdGameProps {
  person: Person;
  options: Person[];
  status: RoundStatus;
  lastEvaluation: RoundEvaluation | null;
  onSubmit: (answer: string) => void;
  onNext: () => void;
}

export const NameToIdGame: React.FC<NameToIdGameProps> = ({
  person,
  options,
  status,
  lastEvaluation,
  onSubmit,
  onNext,
}) => {
  // Keyboard listener for 1, 2, 3, 4 and Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === 'pending') {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= options.length) {
          onSubmit(options[num - 1].id);
        }
      } else if (status === 'feedback' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, options, onSubmit, onNext]);

  return (
    <div className="max-w-xl mx-auto w-full" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl">
        {/* Name Stimulus Prompt */}
        <div className="text-center mb-5 sm:mb-8">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
            זהה את תעודת הזהות של:
          </span>
          <h2
            dir="auto"
            className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug"
          >
            {person.name}
          </h2>
        </div>

        {/* Multiple Choice Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
          {options.map((opt, index) => {
            const isSelected = lastEvaluation?.userAnswer === opt.id;
            const isCorrectTarget = opt.id === person.id;

            let buttonStyle = 'bg-slate-950 border-slate-800 hover:border-slate-700 active:scale-[0.98] text-slate-200';

            if (status === 'feedback') {
              if (isCorrectTarget) {
                buttonStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10';
              } else if (isSelected && !lastEvaluation?.isCorrect) {
                buttonStyle = 'bg-rose-950/40 border-rose-500 text-rose-300 line-through';
              } else {
                buttonStyle = 'bg-slate-950/50 border-slate-900 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={opt.id}
                disabled={status === 'feedback'}
                onClick={() => onSubmit(opt.id)}
                className={`relative min-h-[50px] p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-right transition-all flex items-center justify-between group ${buttonStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300 flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold tracking-wider">
                    {opt.id}
                  </span>
                </div>

                {status === 'feedback' && (
                  <div className="shrink-0">
                    {isCorrectTarget ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : isSelected ? (
                      <X className="w-5 h-5 text-rose-400" />
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback action */}
        {status === 'feedback' && (
          <div className="pt-2">
            <button
              onClick={onNext}
              autoFocus
              className="w-full min-h-[46px] py-3 sm:py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-white active:scale-[0.98] text-slate-900 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>המשך לשאלה הבאה (Enter)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
