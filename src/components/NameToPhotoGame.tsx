import React, { useEffect } from 'react';
import { Check, X, ArrowLeft } from 'lucide-react';
import type { Person } from '../types/person';
import type { RoundEvaluation, RoundStatus } from '../utils/gameEngine';

interface NameToPhotoGameProps {
  person: Person;
  options: Person[];
  status: RoundStatus;
  lastEvaluation: RoundEvaluation | null;
  onSubmit: (answer: string) => void;
  onNext: () => void;
}

export const NameToPhotoGame: React.FC<NameToPhotoGameProps> = ({
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
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Name Stimulus */}
        <div className="text-center mb-6">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
            בחר את התמונה של:
          </span>
          <h2
            dir="auto"
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight"
          >
            {person.name}
          </h2>
        </div>

        {/* 2x2 Photo Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {options.map((opt, index) => {
            const isSelected = lastEvaluation?.userAnswer === opt.id;
            const isCorrectTarget = opt.id === person.id;

            let cardBorder = 'border-slate-800 hover:border-slate-600 hover:shadow-lg';

            if (status === 'feedback') {
              if (isCorrectTarget) {
                cardBorder = 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-500/20 shadow-lg';
              } else if (isSelected && !lastEvaluation?.isCorrect) {
                cardBorder = 'border-rose-500 ring-2 ring-rose-500/50 opacity-80';
              } else {
                cardBorder = 'border-slate-900 opacity-40';
              }
            }

            return (
              <button
                key={opt.id}
                disabled={status === 'feedback'}
                onClick={() => onSubmit(opt.id)}
                className={`group relative rounded-2xl overflow-hidden border-2 bg-slate-950 transition-all aspect-square flex flex-col items-center justify-center ${cardBorder}`}
              >
                {/* Photo */}
                {opt.photoUrl ? (
                  <img
                    src={opt.photoUrl}
                    alt="אפשרות בחירה"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="text-slate-500 text-xs">אין תמונה</div>
                )}

                {/* Number Badge */}
                <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 text-xs font-mono font-bold text-white flex items-center justify-center shadow-md">
                  {index + 1}
                </div>

                {/* Feedback Indicator Overlay */}
                {status === 'feedback' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {isCorrectTarget && (
                      <div className="w-12 h-12 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-xl animate-bounce">
                        <Check className="w-7 h-7 stroke-[3]" />
                      </div>
                    )}
                    {isSelected && !lastEvaluation?.isCorrect && (
                      <div className="w-12 h-12 rounded-full bg-rose-500/90 text-white flex items-center justify-center shadow-xl">
                        <X className="w-7 h-7 stroke-[3]" />
                      </div>
                    )}
                  </div>
                )}

                {/* In feedback state: show correct person's name on distractors if selected */}
                {status === 'feedback' && (
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-sm py-1 px-2 text-center">
                    <span className="text-[11px] font-semibold text-slate-300 truncate block">
                      {opt.name}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Bottom Bar */}
        {status === 'feedback' && (
          <div className="pt-2">
            <button
              onClick={onNext}
              autoFocus
              className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
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
