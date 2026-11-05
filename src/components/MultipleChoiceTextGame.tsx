import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, X, ArrowLeft, Zap, Flame, Star } from 'lucide-react';
import type { Person } from '../types/person';
import { getNumberFromKeyEvent, type RoundEvaluation, type RoundStatus } from '../utils/gameEngine';
import { LifelineBar } from './LifelineBar';

interface MultipleChoiceTextGameProps {
  person: Person;
  options: Person[];
  mode: 'name-to-id' | 'photo-to-id' | 'id-to-name';
  status: RoundStatus;
  lastEvaluation: RoundEvaluation | null;
  lifelines?: { fiftyFifty: number; hint: number };
  activeHint?: string | null;
  onFiftyFifty?: () => void;
  onHint?: () => void;
  onSubmit: (answer: string) => void;
  onNext: () => void;
}

export const MultipleChoiceTextGame: React.FC<MultipleChoiceTextGameProps> = ({
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

      // Don't intercept if another real editable input or textarea has focus
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
      className="max-w-xl mx-auto w-full outline-none focus:outline-none"
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

        {/* Stimulus Prompt */}
        <div className="text-center mb-4 sm:mb-6 flex flex-col items-center">
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

        {/* Multiple Choice Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
          {options.map((opt, index) => {
            const isSelected = lastEvaluation?.userAnswer === opt.id || lastEvaluation?.userAnswer === opt.name;
            const isCorrectTarget = opt.id === person.id;
            const isKeyActive = activeKeyIndex === index;

            let buttonStyle = 'bg-slate-950/80 border-slate-800 hover:border-slate-700 active:scale-[0.98] text-slate-200 hover:bg-slate-900/60 shadow-sm';

            if (isKeyActive && status === 'pending') {
              buttonStyle = 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/50 scale-[0.98] text-white';
            } else if (status === 'feedback') {
              if (isCorrectTarget) {
                buttonStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50';
              } else if (isSelected && !lastEvaluation?.isCorrect) {
                buttonStyle = 'bg-rose-950/40 border-rose-500 text-rose-300 line-through ring-1 ring-rose-500/50 animate-shake';
              } else {
                buttonStyle = 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-40';
              }
            }

            const optionLabel = mode === 'id-to-name' ? opt.name : opt.id;
            const isMonospace = mode !== 'id-to-name';

            return (
              <button
                key={opt.id}
                disabled={status === 'feedback'}
                onClick={() => onSubmit(opt.id)}
                className={`relative min-h-[54px] p-3.5 sm:p-4 rounded-2xl border text-right transition-all flex items-center justify-between group ${buttonStyle}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono font-bold text-slate-300 flex items-center justify-center shrink-0 group-hover:border-indigo-500/50 group-hover:text-indigo-300 shadow-inner transition-colors">
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
