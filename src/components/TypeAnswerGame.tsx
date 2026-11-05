import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft, Star, Zap, Flame } from 'lucide-react';
import type { Person } from '../types/person';
import type { RoundEvaluation, RoundStatus } from '../utils/gameEngine';
import { LifelineBar } from './LifelineBar';

interface TypeAnswerGameProps {
  person: Person;
  mode: 'photo-to-name' | 'photo-to-first-name' | 'photo-to-id-type';
  status: RoundStatus;
  lastEvaluation: RoundEvaluation | null;
  lifelines?: { fiftyFifty: number; hint: number };
  activeHint?: string | null;
  onHint?: () => void;
  onSubmit: (answer: string) => void;
  onNext: () => void;
}

export const TypeAnswerGame: React.FC<TypeAnswerGameProps> = ({
  person,
  mode,
  status,
  lastEvaluation,
  lifelines,
  activeHint,
  onHint,
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
  }, [person.id, mode]);

  // Keyboard shortcut: any key during feedback advances immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === 'feedback') {
        e.preventDefault();
        e.stopPropagation();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [status, onNext]);

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
      onSubmit(mode === 'photo-to-id-type' ? '000000000' : 'לא ידוע');
    }
  };

  const isNumericMode = mode === 'photo-to-id-type';
  const isFirstNameMode = mode === 'photo-to-first-name';

  const isFeedback = status === 'feedback';
  const isCorrect = lastEvaluation?.isCorrect;

  return (
    <div className="max-w-md mx-auto w-full" dir="rtl">
      <div
        className={`bg-slate-900/90 backdrop-blur-md border rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col items-center transition-all duration-300 relative ${
          isFeedback
            ? isCorrect
              ? 'border-emerald-500/50 shadow-emerald-500/10'
              : 'border-rose-500/50 shadow-rose-500/10 animate-shake'
            : 'border-slate-800'
        }`}
      >
        {/* Floating Reward Pill on Correct Answer */}
        {isFeedback && isCorrect && (
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

        {/* Photo Container */}
        <div className="relative mb-3 sm:mb-5 group">
          <div
            className={`w-36 h-36 sm:w-52 sm:h-52 max-h-[26dvh] max-w-[26dvh] aspect-square rounded-2xl overflow-hidden border-2 bg-slate-950 shadow-inner flex items-center justify-center transition-all ${
              isFeedback
                ? isCorrect
                  ? 'border-emerald-500 ring-4 ring-emerald-500/20'
                  : 'border-rose-500 ring-4 ring-rose-500/20'
                : 'border-slate-700/80 group-hover:border-slate-600'
            }`}
          >
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

        {/* Lifeline Bar (Hint only in typing mode) */}
        {lifelines && onHint && (
          <LifelineBar
            allowFiftyFifty={false}
            fiftyFiftyRemaining={0}
            hintRemaining={lifelines.hint}
            activeHint={activeHint || null}
            onFiftyFifty={() => {}}
            onHint={onHint}
            disabled={status !== 'pending'}
          />
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-right">
              {isNumericMode
                ? 'מה מספר תעודת הזהות של האדם בתמונה?'
                : isFirstNameMode
                ? 'מה שמו הפרטי בלבד של האדם בתמונה?'
                : 'מה שמו המלא של האדם בתמונה?'}
            </label>
            <input
              ref={inputRef}
              type="text"
              dir={isNumericMode ? 'ltr' : 'auto'}
              inputMode={isNumericMode ? 'numeric' : 'text'}
              value={inputVal}
              readOnly={status === 'feedback'}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                isNumericMode
                  ? 'הקלד כאן תעודת זהות...'
                  : isFirstNameMode
                  ? 'הקלד כאן שם פרטי בלבד...'
                  : 'הקלד כאן את השם...'
              }
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="go"
              className={`w-full min-h-[48px] px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950 border text-slate-100 placeholder:text-slate-500 text-base font-medium focus:outline-none transition-all shadow-inner ${
                isNumericMode ? 'font-mono text-center tracking-widest text-lg' : ''
              } ${
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
              className={`w-full p-3.5 sm:p-4 rounded-xl mb-3.5 sm:mb-4 border flex items-start gap-2.5 sm:gap-3 transition-all animate-pop ${
                lastEvaluation.isCorrect
                  ? lastEvaluation.isTypo
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {lastEvaluation.isCorrect ? (
                  lastEvaluation.isTypo ? (
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
              </div>

              <div className="text-right text-xs sm:text-sm flex-1">
                {lastEvaluation.isCorrect ? (
                  lastEvaluation.isTypo ? (
                    <div>
                      <p className="font-bold mb-0.5">נכון! (עם שגיאת הקלדה קלה)</p>
                      <p className="opacity-90">הכתיב המדויק הוא: <strong className="font-semibold text-white">{lastEvaluation.correctAnswer}</strong></p>
                    </div>
                  ) : (
                    <p className="font-bold">כל הכבוד! תשובה מדויקת לחלוטין 🎯</p>
                  )
                ) : (
                  <div>
                    <p className="font-bold mb-0.5">טעות</p>
                    <p className="opacity-90">
                      התשובה הנכונה: <strong className="font-semibold text-white" dir={isNumericMode ? 'ltr' : 'auto'}>{lastEvaluation.correctAnswer}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          {status === 'pending' ? (
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/25 min-h-[46px]"
              >
                בדיקת תשובה
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="py-3 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs font-semibold active:scale-[0.98] transition-all min-h-[46px]"
              >
                דלג / לא יודע
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 min-h-[46px]"
            >
              <span>לשאלה הבאה</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
