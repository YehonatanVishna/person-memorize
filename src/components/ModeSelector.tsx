import type { GameMode, GameSettings } from '../types/person';
import {
  Camera,
  CreditCard,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Check,
  Shuffle,
  Binary,
  Layers,
  UserCheck,
  KeyRound,
} from 'lucide-react';

interface ModeSelectorProps {
  peopleCount: number;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onStartMode: (mode: GameMode) => void;
  onOpenUpload: () => void;
  onLoadDemo: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  peopleCount,
  settings,
  onUpdateSettings,
  onStartMode,
  onOpenUpload,
  onLoadDemo,
}) => {
  const modes: {
    id: GameMode;
    title: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
    color: string;
    accentBg: string;
    borderHover: string;
    featured?: boolean;
  }[] = [
    {
      id: 'mix',
      title: 'סבב מעורב (כל המצבים)',
      description: 'האתגר האולטימטיבי! כל שאלה נבחרת בסבב ממצב משחק שונה - זיהוי תמונה, בחירת ת"ז, כתיבה ועוד.',
      badge: 'אתגר משולב 🎲',
      icon: <Shuffle className="w-7 h-7 text-cyan-400" />,
      color: 'from-cyan-500/25 via-indigo-500/15 to-purple-500/10',
      accentBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
      borderHover: 'hover:border-cyan-400/60 hover:shadow-cyan-500/10 ring-1 ring-cyan-500/20',
      featured: true,
    },
    {
      id: 'photo-to-name',
      title: 'תמונה ← כתיבת שם',
      description: 'מוצגת תמונה, ועליך להקליד במדויק את שמו המלא של האדם (כולל תמיכה בשגיאות הקלדה קלות).',
      badge: 'הקלדה חופשית',
      icon: <Camera className="w-7 h-7 text-indigo-400" />,
      color: 'from-indigo-500/20 to-blue-500/10',
      accentBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
      borderHover: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
    },
    {
      id: 'name-to-photo',
      title: 'שם ← בחירת תמונה',
      description: 'מוצג שם האדם, ועליך לזהות ולבחור את תמונתו הנכונה מתוך 4 תמונות אפשריות.',
      badge: 'זיהוי חזותי',
      icon: <ImageIcon className="w-7 h-7 text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-500/10',
      accentBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      borderHover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    },
    {
      id: 'name-to-id',
      title: 'שם ← בחירת ת"ז',
      description: 'מוצג שם האדם, ועליך לבחור את מספר תעודת הזהות המתאימה מתוך 4 אפשרויות (קיצורי 1-4).',
      badge: 'בחירה מרובה',
      icon: <CreditCard className="w-7 h-7 text-violet-400" />,
      color: 'from-violet-500/20 to-purple-500/10',
      accentBg: 'bg-violet-500/10 border-violet-500/30 text-violet-300',
      borderHover: 'hover:border-violet-500/50 hover:shadow-violet-500/10',
    },
    {
      id: 'photo-to-id',
      title: 'תמונה ← בחירת ת"ז',
      description: 'מוצגת תמונה, ועליך לבחור את מספר תעודת הזהות של האדם מתוך 4 אפשרויות.',
      badge: 'בחירה מרובה',
      icon: <Binary className="w-7 h-7 text-amber-400" />,
      color: 'from-amber-500/20 to-orange-500/10',
      accentBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      borderHover: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
    },
    {
      id: 'id-to-photo',
      title: 'ת"ז ← בחירת תמונה',
      description: 'מוצג מספר תעודת זהות, ועליך לבחור את תמונתו של בעל התעודה מתוך רשת של 4 תמונות.',
      badge: 'זיהוי חזותי',
      icon: <Layers className="w-7 h-7 text-teal-400" />,
      color: 'from-teal-500/20 to-cyan-500/10',
      accentBg: 'bg-teal-500/10 border-teal-500/30 text-teal-300',
      borderHover: 'hover:border-teal-500/50 hover:shadow-teal-500/10',
    },
    {
      id: 'id-to-name',
      title: 'ת"ז ← בחירת שם',
      description: 'מוצג מספר תעודת זהות, ועליך לבחור את השם המלא המתאים מתוך 4 אפשרויות.',
      badge: 'בחירה מרובה',
      icon: <UserCheck className="w-7 h-7 text-sky-400" />,
      color: 'from-sky-500/20 to-blue-500/10',
      accentBg: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
      borderHover: 'hover:border-sky-500/50 hover:shadow-sky-500/10',
    },
    {
      id: 'photo-to-id-type',
      title: 'תמונה ← הקלדת ת"ז',
      description: 'מוצגת תמונה, ועליך להקליד במדויק את מספר תעודת הזהות של האדם במקלדת נומרית.',
      badge: 'הקלדת מספרים',
      icon: <KeyRound className="w-7 h-7 text-rose-400" />,
      color: 'from-rose-500/20 to-pink-500/10',
      accentBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      borderHover: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
    },
  ];

  if (peopleCount === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
          <Upload className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">טרם נטענו אנשים למערכת</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
          העלה קובץ ZIP המכיל קובץ נתונים (<code>people.json</code> או <code>people.csv</code>) עם התמונות המתאימות, או התחל מיד עם נתוני הדגמה.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenUpload}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>העלאת קובץ ZIP</span>
          </button>
          <button
            onClick={onLoadDemo}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>טען 8 פרופילי הדגמה</span>
          </button>
        </div>
      </div>
    );
  }

  const roundSizeOptions = [
    { label: '5 שאלות', value: 5 },
    { label: '10 שאלות', value: 10 },
    { label: '20 שאלות', value: 20 },
    { label: `הכל (${peopleCount})`, value: -1 },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full py-2 sm:py-4" dir="rtl">
      {/* Title & Welcome */}
      <div className="text-center mb-5 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1.5 sm:mb-2">
          בחר מצב תרגול
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          מאגר הפרופילים מכיל <span className="font-semibold text-indigo-300">{peopleCount} אנשים</span>. בחר את אופן המשחק והתאם את ההגדרות.
        </p>
      </div>

      {/* Settings Bar */}
      <div className="mb-5 sm:mb-8 p-3 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Question Count */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
          <span className="text-xs font-medium text-slate-400 shrink-0">אורך סבב:</span>
          <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-lg border border-slate-800 flex-1 sm:flex-initial gap-1">
            {roundSizeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdateSettings({ questionCount: opt.value })}
                className={`min-h-[40px] flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold active:scale-[0.96] transition-all flex items-center justify-center ${
                  settings.questionCount === opt.value
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Typo Tolerance Toggle */}
        <label className="flex items-center justify-between sm:justify-end gap-3 cursor-pointer text-xs select-none p-2 rounded-xl hover:bg-slate-800/40 active:scale-[0.99] min-h-[44px] transition-all">
          <input
            type="checkbox"
            checked={settings.allowTypo}
            onChange={(e) => onUpdateSettings({ allowTypo: e.target.checked })}
            className="sr-only"
          />
          <span className="text-slate-300 font-medium">
            סובלנות לשגיאות הקלדה קלות (Levenshtein)
          </span>
          <div
            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
              settings.allowTypo ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                settings.allowTypo ? '-translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </label>
      </div>

      {/* Game Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {modes.map((mode) => (
          <div
            key={mode.id}
            onClick={() => onStartMode(mode.id)}
            className={`cursor-pointer rounded-2xl bg-gradient-to-b ${mode.color} bg-slate-900 border ${
              mode.featured ? 'border-cyan-500/50 shadow-cyan-500/5' : 'border-slate-800'
            } p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] hover:shadow-xl ${mode.borderHover} group`}
          >
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/80 border border-slate-800 group-hover:scale-110 transition-transform">
                  {mode.icon}
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${mode.accentBg}`}>
                  {mode.badge}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2 group-hover:text-indigo-300 transition-colors">
                {mode.title}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4 sm:mb-6">
                {mode.description}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartMode(mode.id);
              }}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-800 group-hover:bg-indigo-600 active:scale-[0.98] text-slate-200 group-hover:text-white font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>התחל משחק</span>
              <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
