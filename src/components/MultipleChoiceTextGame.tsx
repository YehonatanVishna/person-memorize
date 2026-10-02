import React, { useEffect } from 'react';
import { Check, X, ArrowLeft } from 'lucide-react';
import type { Person } from '../types/person';
import type { RoundEvaluation, RoundStatus } from '../utils/gameEngine';

interface MultipleChoiceTextGameProps {
  person: Person;
  options: Person[];
  mode: 'name-to-id' | 'photo-to-id' | 'id-to-name';
  status: RoundStatus;
  lastEvaluation: RoundEvaluation | null;
  onSubmit: (answer: string) => void;
  onNext: () => void;
}

export const MultipleChoiceTextGame: React.FC<MultipleChoiceTextGameProps> = ({
  person,
  options,
  mode,
  status,
  lastEvaluation,
  onSubmit,
  onNext,
}) => {
  // Keyboard listener for 1, 2, 3, 4 and Enter/Space
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
        {/* Stimulus Prompt */}
        <div className="text-center mb-5 sm:mb-8 flex flex-col items-center">
          {mode === 'photo-to-id' ? (
            <>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-2">
                בחר את תעודת הזהות של האדם בתמונה:
              </span>
              <div className="w-32 h-32 sm:w-44 sm:h-44 max-h-[22dvh] max-w-[22dvh] aspect-square rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-inner mb-1">
                {person.photoUrl ? (
                  <img
                    src={person.photoUrl}
                    alt="אדם לזיהוי"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                    אין תמונה
                  </div>
                )}
              </div>
            </>
          ) : mode === 'id-to-name' ? (
            <>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                זהה את שמו של בעל תעודת הזהות:
              </span>
              <h2
                dir="ltr"
                className="text-2xl sm:text-4xl font-extrabold text-white font-mono tracking-widest leading-snug"
              >
                {person.id}
              </h2>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                זהה את תעודת הזהות של:
              </span>
              <h2
                dir="auto"
                className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug"
              >
                {person.name}
              </h2>
            </>
          )}
        </div>

        {/* Multiple Choice Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
          {options.map((opt, index) => {
            const isSelected = lastEvaluation?.userAnswer === opt.id || lastEvaluation?.userAnswer === opt.name;
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

            const optionLabel = mode === 'id-to-name' ? opt.name : opt.id;
            const isMonospace = mode !== 'id-to-name';

            return (
              <button
                key={opt.id}
                disabled={status === 'feedback'}
                onClick={() => onSubmit(opt.id)}
                className={`relative min-h-[50px] p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-right transition-all flex items-center justify-between group ${buttonStyle}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300 flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span
                    dir={isMonospace ? 'ltr' : 'auto'}
                    className={`text-base sm:text-lg font-bold tracking-wider truncate ${
                      isMonospace ? 'font-mono' : ''
                    }`}
                  >
                    {optionLabel}
                  </span>
                </div>

                {status === 'feedback' && (
                  <div className="shrink-0 mr-2">
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
