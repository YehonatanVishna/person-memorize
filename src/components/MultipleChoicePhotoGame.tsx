import React, { useEffect } from 'react';
import { Check, X, ArrowLeft } from 'lucide-react';
import type { Person } from '../types/person';
import type { RoundEvaluation, RoundStatus } from '../utils/gameEngine';

interface MultipleChoicePhotoGameProps {
  person: Person;
  options: Person[];
  mode: 'name-to-photo' | 'id-to-photo';
  status: RoundStatus;
  lastEvaluation: RoundEvaluation | null;
  onSubmit: (answer: string) => void;
  onNext: () => void;
}

export const MultipleChoicePhotoGame: React.FC<MultipleChoicePhotoGameProps> = ({
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
    <div className="max-w-2xl mx-auto w-full" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl">
        {/* Stimulus */}
        <div className="text-center mb-4 sm:mb-6">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
            {mode === 'id-to-photo'
              ? 'בחר את התמונה של בעל תעודת הזהות:'
              : 'בחר את התמונה של:'}
          </span>
          <h2
            dir={mode === 'id-to-photo' ? 'ltr' : 'auto'}
            className={`text-2xl sm:text-4xl font-extrabold text-white tracking-tight ${
              mode === 'id-to-photo' ? 'font-mono tracking-widest' : ''
            }`}
          >
            {mode === 'id-to-photo' ? person.id : person.name}
          </h2>
        </div>

        {/* 2x2 Photo Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
          {options.map((opt, index) => {
            const isSelected = lastEvaluation?.userAnswer === opt.name || lastEvaluation?.userAnswer === opt.id;
            const isCorrectTarget = opt.id === person.id;

            let cardBorder = 'border-slate-800 hover:border-slate-600 hover:shadow-lg active:scale-[0.98]';

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
                className={`group relative rounded-xl sm:rounded-2xl overflow-hidden border-2 bg-slate-950 transition-all aspect-square flex flex-col items-center justify-center ${cardBorder}`}
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
                <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 text-[10px] sm:text-xs font-mono font-bold text-white flex items-center justify-center shadow-md">
                  {index + 1}
                </div>

                {/* Feedback Indicator Overlay */}
                {status === 'feedback' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {isCorrectTarget && (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-xl animate-bounce">
                        <Check className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" />
                      </div>
                    )}
                    {isSelected && !lastEvaluation?.isCorrect && (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-500/90 text-white flex items-center justify-center shadow-xl">
                        <X className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" />
                      </div>
                    )}
                  </div>
                )}

                {/* In feedback state: show correct person's name & ID on distractors if selected */}
                {status === 'feedback' && (
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-sm py-1 px-2 text-center">
                    <span className="text-[11px] font-semibold text-slate-300 truncate block">
                      {opt.name} ({opt.id})
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
