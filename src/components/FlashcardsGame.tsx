import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Check, X, RotateCw, ArrowLeftRight, Eye, CreditCard, User, Sparkles } from 'lucide-react';
import type { Person } from '../types/person';
import type { FlashcardFrontSide } from '../hooks/useFlashcardsEngine';
import { getNumberFromKeyEvent } from '../utils/gameEngine';

interface FlashcardsGameProps {
  person: Person;
  isFlipped: boolean;
  frontSide: FlashcardFrontSide;
  onFlip: () => void;
  onToggleFrontSide: () => void;
  onGrade: (known: boolean) => void;
}

export const FlashcardsGame: React.FC<FlashcardsGameProps> = ({
  person,
  isFlipped,
  frontSide,
  onFlip,
  onToggleFrontSide,
  onGrade,
}) => {
  const keyCaptureRef = useRef<HTMLInputElement>(null);

  // Keep a hidden read-only <input> focused so browser extensions like Vimium
  // automatically enter InsertMode and pass 1/2/Space/Enter directly to the page.
  useLayoutEffect(() => {
    keyCaptureRef.current?.focus({ preventScroll: true });
  }, [person.id, isFlipped]);

  // Keyboard shortcuts: Space/Enter to flip, 1/2 to grade once flipped
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;
      // Don't capture shortcuts if another input/textarea has explicit focus
      if (
        (e.target instanceof HTMLInputElement && e.target !== keyCaptureRef.current) ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        e.stopPropagation();
        onFlip();
      } else if (isFlipped) {
        const num = getNumberFromKeyEvent(e);
        if (num === 1 || e.key === '1' || e.key === 'ArrowRight') {
          e.preventDefault();
          e.stopPropagation();
          onGrade(true);
        } else if (num === 2 || e.key === '2' || e.key === 'ArrowLeft') {
          e.preventDefault();
          e.stopPropagation();
          onGrade(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keydown', handleKeyDown, false);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [isFlipped, onFlip, onGrade]);

  const isFrontPhoto = frontSide === 'photo';

  return (
    <div
      className="max-w-md mx-auto w-full"
      dir="rtl"
      onClick={() => keyCaptureRef.current?.focus({ preventScroll: true })}
    >
      {/* Hidden read-only input that keeps Vimium / keyboard-nav extensions in InsertMode so 1-2 & Space keys pass through */}
      <input
        ref={keyCaptureRef}
        type="text"
        readOnly
        inputMode="none"
        autoComplete="off"
        data-1p-ignore="true"
        data-lpignore="true"
        aria-hidden="true"
        tabIndex={-1}
        value=""
        onChange={() => {}}
        onBlur={() => {
          requestAnimationFrame(() => {
            if (
              document.activeElement === document.body ||
              document.activeElement === document.documentElement ||
              document.activeElement === null
            ) {
              keyCaptureRef.current?.focus({ preventScroll: true });
            }
          });
        }}
        className="sr-only pointer-events-none"
      />
      {/* Direction Toggle Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs text-slate-400 font-medium">כיוון כרטיסייה:</span>
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleFrontSide();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-indigo-300 transition-all active:scale-[0.97] shadow-sm"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {frontSide === 'photo' ? 'תמונה מקדימה ← פרטים מאחורה' : 'שם ות"ז מקדימה ← תמונה מאחורה'}
          </span>
        </button>
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000 w-full min-h-[380px] sm:min-h-[420px]">
        <div
          onClick={onFlip}
          role="button"
          tabIndex={0}
          aria-label="הפוך כרטיסייה"
          className={`relative w-full h-full min-h-[380px] sm:min-h-[420px] transition-transform duration-500 preserve-3d cursor-pointer select-none ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT FACE */}
          <div
            aria-hidden={isFlipped}
            className={`absolute inset-0 backface-hidden rotate-y-0 rounded-3xl p-5 sm:p-7 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center justify-between overflow-hidden group hover:border-slate-700 transition-[opacity,border-color] duration-200 ${
              isFlipped ? 'opacity-0 pointer-events-none z-0' : 'opacity-100 z-10'
            }`}
          >
            {/* Ambient top light */}
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-20 bg-indigo-500/10 blur-xl pointer-events-none rounded-full"></div>

            {/* Top Indicator */}
            <div className="w-full flex items-center justify-between relative z-10">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-slate-800/80 border-slate-700 text-slate-300">
                צד קדמי (שאלה)
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1.5 group-hover:text-indigo-300 transition-colors">
                <RotateCw className="w-3.5 h-3.5" />
                <span>לחץ להיפוך</span>
              </span>
            </div>

            {/* Front Content */}
            <div className="my-auto w-full flex flex-col items-center text-center relative z-10 py-3">
              {isFrontPhoto ? (
                <div className="w-44 h-44 sm:w-56 sm:h-56 max-h-[30dvh] max-w-[30dvh] aspect-square rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-inner flex items-center justify-center group-hover:scale-[1.02] transition-transform">
                  {person.photoUrl ? (
                    <img
                      src={person.photoUrl}
                      alt="תמונת כרטיסייה"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-500 text-sm">אין תמונה זמינה</div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 w-full">
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>שם מלא</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" dir="auto">
                      {person.name}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                      <span>תעודת זהות</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-indigo-300 tracking-widest" dir="ltr">
                      {person.id}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Hint */}
            <div className="w-full pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500 relative z-10 border-t border-slate-800/60">
              <span>הקש</span>
              <kbd className="kbd-badge">Space</kbd>
              <span>כדי לחשוף תשובה</span>
            </div>
          </div>

          {/* BACK FACE (Rotated 180deg) */}
          <div
            aria-hidden={!isFlipped}
            className={`absolute inset-0 backface-hidden rotate-y-180 rounded-3xl p-5 sm:p-7 bg-gradient-to-b from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/50 shadow-2xl shadow-indigo-500/10 flex flex-col items-center justify-between overflow-hidden transition-opacity duration-200 ${
              isFlipped ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            {/* Ambient glow */}
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-20 bg-indigo-500/20 blur-xl pointer-events-none rounded-full"></div>

            {/* Top Indicator */}
            <div className="w-full flex items-center justify-between relative z-10">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-indigo-500/25 border-indigo-500/40 text-indigo-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                <span>צד אחורי (תשובה)</span>
              </span>
              <span className="text-xs text-indigo-300 flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 rotate-180" />
                <span>הפוך חזרה</span>
              </span>
            </div>

            {/* Back Content (Reveals all details) */}
            <div className="my-auto w-full flex flex-col items-center text-center relative z-10 py-2">
              {/* Photo Thumbnail */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 aspect-square rounded-2xl overflow-hidden border-2 border-indigo-500/50 bg-slate-950 shadow-lg shadow-indigo-500/20 mb-3 flex items-center justify-center">
                {person.photoUrl ? (
                  <img
                    src={person.photoUrl}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-500 text-xs">אין תמונה</div>
                )}
              </div>

              {/* Full Details */}
              <div className="space-y-1">
                <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight" dir="auto">
                  {person.name}
                </h4>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-950/70 border border-indigo-800/60 text-indigo-200 font-mono text-sm tracking-wider" dir="ltr">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{person.id}</span>
                </div>
              </div>
            </div>

            {/* Bottom Grading Hint */}
            <div className="w-full pt-2 flex items-center justify-center gap-2 text-xs text-slate-400 relative z-10 border-t border-slate-800/60">
              <span>דרג את תשובתך למטה:</span>
              <div className="flex items-center gap-1">
                <kbd className="kbd-badge">1</kbd>
                <span>ידעתי</span>
                <span className="text-slate-600">/</span>
                <kbd className="kbd-badge">2</kbd>
                <span>לא ידעתי</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Below Card */}
      <div className="mt-4">
        {!isFlipped ? (
          <button
            type="button"
            onClick={onFlip}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 ring-1 ring-white/15"
          >
            <Eye className="w-4 h-4" />
            <span>חשוף תשובה</span>
            <kbd className="kbd-badge bg-indigo-700/70 text-white border-white/20">Space</kbd>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 animate-fade-up">
            <button
              type="button"
              onClick={() => onGrade(true)}
              className="min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 ring-1 ring-white/15"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>ידעתי!</span>
              <kbd className="kbd-badge bg-emerald-700/70 text-white border-white/20">1</kbd>
            </button>

            <button
              type="button"
              onClick={() => onGrade(false)}
              className="min-h-[48px] py-3 px-4 rounded-xl bg-rose-600/90 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 ring-1 ring-white/15"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>לא ידעתי</span>
              <kbd className="kbd-badge bg-rose-700/70 text-white border-white/20">2</kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
