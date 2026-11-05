import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, X, ArrowLeft, Star, Zap, Flame } from 'lucide-react';
import type { Person } from '../types/person';
import { getNumberFromKeyEvent, type RoundEvaluation, type RoundStatus } from '../utils/gameEngine';
import { LifelineBar } from './LifelineBar';

interface MultipleChoicePhotoGameProps {
  person: Person;
  options: Person[];
  mode: 'name-to-photo' | 'id-to-photo';
  status: RoundStatus;
  lastEvaluation: RoundEvaluation | null;
  lifelines?: { fiftyFifty: number; hint: number };
  activeHint?: string | null;
  onFiftyFifty?: () => void;
  onHint?: () => void;
  onSubmit: (answer: string) => void;
  onNext: () => void;
}

export const MultipleChoicePhotoGame: React.FC<MultipleChoicePhotoGameProps> = ({
  person,
  options,
  mode,
  status,
  lastEvaluation,
  lifelines,
  activeHint,
  onFiftyFifty,
  onHint,
  onSubmit,
  onNext,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const keyCaptureRef = useRef<HTMLInputElement>(null);
  const [activeKeyIndex, setActiveKeyIndex] = useState<number | null>(null);

  // Keep the hidden readOnly input focused so keyboard extensions (like Vimium)
  // treat the quiz as an active input target and pass 1-9 keystrokes directly to the page.
  useLayoutEffect(() => {
    keyCaptureRef.current?.focus({ preventScroll: true });
  }, [person.id, status]);

  // Robust keyboard listener across all browsers, operating systems, and keyboard layouts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        target !== keyCaptureRef.current &&
        ((target.tagName === 'INPUT' && !(target as HTMLInputElement).readOnly) ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (status === 'pending') {
        const num = getNumberFromKeyEvent(e);
        if (num !== null && num >= 1 && num <= options.length) {
          e.preventDefault();
          e.stopPropagation();
          setActiveKeyIndex(num - 1);
          onSubmit(options[num - 1].id);
        }
      } else if (
        status === 'feedback' &&
        (e.key === 'Enter' ||
          e.key === ' ' ||
          e.code === 'Enter' ||
          e.code === 'NumpadEnter' ||
          e.code === 'Space' ||
          getNumberFromKeyEvent(e) !== null)
      ) {
        e.preventDefault();
        e.stopPropagation();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [status, options, onSubmit, onNext]);

  return (
    <div
      ref={containerRef}
      onClick={() => keyCaptureRef.current?.focus({ preventScroll: true })}
      className="max-w-2xl mx-auto w-full outline-none focus:outline-none"
      dir="rtl"
    >
      <input
        ref={keyCaptureRef}
        type="text"
        readOnly
        inputMode="none"
        autoComplete="off"
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore="true"
        aria-hidden="true"
        tabIndex={-1}
        value=""
        onChange={() => {}}
        onBlur={() => {
          requestAnimationFrame(() => {
            const active = document.activeElement as HTMLElement | null;
            if (
              !active ||
              active === document.body ||
              active === document.documentElement ||
              containerRef.current?.contains(active)
            ) {
              keyCaptureRef.current?.focus({ preventScroll: true });
            }
          });
        }}
        className="sr-only"
      />
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl relative">
        {/* Floating Reward Pill on Correct Answer */}
        {status === 'feedback' && lastEvaluation?.isCorrect && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 animate-pop flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25">
            <Star className="w-3.5 h-3.5 fill-white" />
            <span>+{lastEvaluation.pointsAwarded || 100} XP</span>
            {lastEvaluation.speedBonus && lastEvaluation.speedBonus > 0 && (
              <span className="flex items-center gap-0.5 text-amber-200">
                <Zap className="w-3 h-3 fill-amber-300" />
                <span>מהירות!</span>
              </span>
            )}
            {lastEvaluation.streakMultiplier && lastEvaluation.streakMultiplier > 1 && (
              <span className="flex items-center gap-0.5 text-orange-200">
                <Flame className="w-3 h-3 fill-orange-300" />
                <span>x{lastEvaluation.streakMultiplier}</span>
              </span>
            )}
          </div>
        )}

        {/* Stimulus */}
        <div className="text-center mb-3 sm:mb-5">
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

        {/* Lifeline Bar */}
        {lifelines && onFiftyFifty && onHint && (
          <LifelineBar
            allowFiftyFifty={options.length >= 3}
            fiftyFiftyRemaining={lifelines.fiftyFifty}
            hintRemaining={lifelines.hint}
            activeHint={activeHint || null}
            onFiftyFifty={onFiftyFifty}
            onHint={onHint}
            disabled={status !== 'pending'}
          />
        )}

        {/* 2x2 Photo Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
          {options.map((opt, index) => {
            const isSelected = lastEvaluation?.userAnswer === opt.name || lastEvaluation?.userAnswer === opt.id;
            const isCorrectTarget = opt.id === person.id;
            const isKeyActive = activeKeyIndex === index;

            let cardBorder = 'border-slate-800 hover:border-slate-600 hover:shadow-lg active:scale-[0.98]';

            if (isKeyActive && status === 'pending') {
              cardBorder = 'border-indigo-500 ring-2 ring-indigo-500/50 scale-[0.98] shadow-indigo-500/30 shadow-lg';
            } else if (status === 'feedback') {
              if (isCorrectTarget) {
                cardBorder = 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-500/20 shadow-lg';
              } else if (isSelected && !lastEvaluation?.isCorrect) {
                cardBorder = 'border-rose-500 ring-2 ring-rose-500/50 opacity-80 animate-shake';
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

                {/* Status Indicator Icon */}
                {status === 'feedback' && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center transition-all animate-fade-in">
                    {isCorrectTarget ? (
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/30">
                        <Check className="w-7 h-7 stroke-[3]" />
                      </div>
                    ) : isSelected ? (
                      <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/30">
                        <X className="w-7 h-7 stroke-[3]" />
                      </div>
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Bottom Actions */}
        {status === 'feedback' && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between animate-fade-in">
            <span className="text-xs text-slate-400 font-medium">
              הקש <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">Enter</kbd> או המשך
            </span>
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/25"
            >
              <span>לשאלה הבאה</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
