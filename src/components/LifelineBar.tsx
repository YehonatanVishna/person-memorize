import React from 'react';
import { HelpCircle, Sparkles, Lightbulb } from 'lucide-react';

interface LifelineBarProps {
  allowFiftyFifty?: boolean;
  fiftyFiftyRemaining: number;
  hintRemaining: number;
  activeHint: string | null;
  onFiftyFifty: () => void;
  onHint: () => void;
  disabled?: boolean;
}

export const LifelineBar: React.FC<LifelineBarProps> = ({
  allowFiftyFifty = true,
  fiftyFiftyRemaining,
  hintRemaining,
  activeHint,
  onFiftyFifty,
  onHint,
  disabled = false,
}) => {
  return (
    <div className="w-full mb-4 sm:mb-5" dir="rtl">
      {/* Active Clue Banner */}
      {activeHint && (
        <div className="mb-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-pop shadow-md shadow-amber-500/10">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <span className="leading-snug">{activeHint}</span>
        </div>
      )}

      {/* Lifeline buttons */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {allowFiftyFifty && (
          <button
            type="button"
            onClick={onFiftyFifty}
            disabled={disabled || fiftyFiftyRemaining <= 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-[0.96] min-h-[42px] ${
              fiftyFiftyRemaining > 0 && !disabled
                ? 'bg-slate-950/80 hover:bg-slate-900 border-indigo-500/40 text-indigo-300 hover:border-indigo-400 hover:shadow-sm hover:shadow-indigo-500/20'
                : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
            }`}
            title="חצי-חצי: מסיר שתי אפשרויות שגויות"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>50:50</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                fiftyFiftyRemaining > 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-600'
              }`}
            >
              {fiftyFiftyRemaining}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onHint}
          disabled={disabled || hintRemaining <= 0 || Boolean(activeHint)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-[0.96] min-h-[42px] ${
            hintRemaining > 0 && !disabled && !activeHint
              ? 'bg-slate-950/80 hover:bg-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:shadow-sm hover:shadow-amber-500/20'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
          }`}
          title="רמז: חושף אות ראשונה או ספרות מזהות"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>רמז</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              hintRemaining > 0 && !activeHint
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-slate-800 text-slate-600'
            }`}
          >
            {activeHint ? 'פעיל' : hintRemaining}
          </span>
        </button>
      </div>
    </div>
  );
};
