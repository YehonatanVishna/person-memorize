import React, { useEffect } from 'react';
import { Check, X, RotateCw, ArrowLeftRight, Eye, CreditCard, User } from 'lucide-react';
import type { Person } from '../types/person';
import type { FlashcardFrontSide } from '../hooks/useFlashcardsEngine';

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
  // Keyboard shortcuts: Space/Enter to flip, 1/2 to grade once flipped
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onFlip();
      } else if (isFlipped) {
        if (e.key === '1' || e.key === 'ArrowRight') {
          e.preventDefault();
          onGrade(true);
        } else if (e.key === '2' || e.key === 'ArrowLeft') {
          e.preventDefault();
          onGrade(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, onFlip, onGrade]);

  const showPhotoSide = (frontSide === 'photo' && !isFlipped) || (frontSide === 'details' && isFlipped);

  return (
    <div className="max-w-md mx-auto w-full" dir="rtl">
      {/* Direction Toggle Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs text-slate-400 font-medium">כיוון כרטיסייה:</span>
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleFrontSide();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-indigo-300 transition-all active:scale-[0.97]"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {frontSide === 'photo' ? 'תמונה מקדימה ← פרטים מאחורה' : 'שם ות"ז מקדימה ← תמונה מאחורה'}
          </span>
        </button>
      </div>

      {/* Interactive Flashcard */}
      <div
        onClick={onFlip}
        role="button"
        tabIndex={0}
        aria-label="הפוך כרטיסייה"
        className={`cursor-pointer select-none rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border transition-all duration-300 min-h-[320px] sm:min-h-[370px] flex flex-col items-center justify-between relative overflow-hidden group ${
          isFlipped
            ? 'bg-gradient-to-b from-indigo-950/50 to-slate-900 border-indigo-500/50 shadow-indigo-500/10'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Top Badge (Front / Back indicator) */}
        <div className="w-full flex items-center justify-between">
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              isFlipped
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isFlipped ? 'צד אחורי (תשובה)' : 'צד קדמי (שאלה)'}
          </span>

          <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
            <RotateCw className={`w-3.5 h-3.5 transition-transform duration-300 ${isFlipped ? 'rotate-180 text-indigo-400' : ''}`} />
            <span>לחץ להיפוך</span>
          </span>
        </div>

        {/* Center Card Content */}
        {showPhotoSide ? (
          <div className="my-4 flex flex-col items-center text-center w-full">
            <div className="w-44 h-44 sm:w-56 sm:h-56 max-h-[28dvh] max-w-[28dvh] aspect-square rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-inner flex items-center justify-center mb-3">
              {person.photoUrl ? (
                <img
                  src={person.photoUrl}
                  alt="תמונת כרטיסייה"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="text-slate-500 text-sm">אין תמונה זמינה</div>
              )}
            </div>
            {isFlipped && (
              <div className="mt-1">
                <div className="text-lg sm:text-xl font-bold text-white" dir="auto">
                  {person.name}
                </div>
                <div className="text-xs font-mono text-indigo-300" dir="ltr">
                  {person.id}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="my-4 flex flex-col items-center justify-center text-center w-full gap-4">
            {isFlipped && person.photoUrl && (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-indigo-500/40 bg-slate-950 shadow-md">
                <img
                  src={person.photoUrl}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-3 w-full">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>שם מלא</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" dir="auto">
                  {person.name}
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>תעודת זהות</span>
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-indigo-300 tracking-widest" dir="ltr">
                  {person.id}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Hint */}
        <div className="text-xs text-slate-500 text-center">
          {isFlipped
            ? 'דרג למטה אם ידעת את התשובה כדי לעבור לכרטיסייה הבאה'
            : 'נסה להיזכר בפרטים ולחץ על הכרטיסייה (או רווח) כדי לחשוף'}
        </div>
      </div>

      {/* Action Buttons Below Card */}
      <div className="mt-4">
        {!isFlipped ? (
          <button
            type="button"
            onClick={onFlip}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>חשוף תשובה (Space)</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onGrade(true)}
              className="min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>ידעתי! (1)</span>
            </button>

            <button
              type="button"
              onClick={() => onGrade(false)}
              className="min-h-[48px] py-3 px-4 rounded-xl bg-rose-600/90 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>לא ידעתי (2)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
