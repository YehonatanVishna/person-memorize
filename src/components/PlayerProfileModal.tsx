import React from 'react';
import { X, Trophy, Zap, Award, Target, Flame, Crown, BookOpen, Shuffle, Sparkles, Star } from 'lucide-react';
import { ACHIEVEMENTS, getPlayerProfile, type AchievementDef } from '../services/playerProgress';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getAchievementIcon = (name: AchievementDef['iconName']) => {
  switch (name) {
    case 'Award':
      return <Award className="w-5 h-5" />;
    case 'Target':
      return <Target className="w-5 h-5" />;
    case 'Zap':
      return <Zap className="w-5 h-5" />;
    case 'Flame':
      return <Flame className="w-5 h-5" />;
    case 'Crown':
      return <Crown className="w-5 h-5" />;
    case 'BookOpen':
      return <BookOpen className="w-5 h-5" />;
    case 'Shuffle':
      return <Shuffle className="w-5 h-5" />;
    case 'Sparkles':
      return <Sparkles className="w-5 h-5" />;
  }
};

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const profile = getPlayerProfile();
  const unlockedCount = Object.keys(profile.unlockedAchievements).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      dir="rtl"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>פרופיל שחקן והישגים</span>
              </h2>
              <p className="text-xs text-slate-400">התקדמות אישית, צבירת XP ותגים</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Level & Rank Card */}
          <div className="relative rounded-2xl p-5 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-inner overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-sm">
                  {profile.level}
                </span>
                <div>
                  <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    דרגת שחקן
                  </div>
                  <h3 className="text-xl font-black text-white">{profile.levelTitle}</h3>
                </div>
              </div>
              <div className="text-left font-mono text-sm font-bold text-amber-400 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{profile.totalXP} XP</span>
              </div>
            </div>

            {/* XP progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>התקדמות לרמה הבאה</span>
                <span className="font-mono text-indigo-300">{profile.progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${profile.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">משחקים שהושלמו</span>
              <span className="text-lg font-black text-white font-mono">{profile.gamesPlayed}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">תשובות נכונות</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{profile.totalCorrect}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">שיא רצף אישי</span>
              <span className="text-lg font-black text-amber-400 font-mono flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                {profile.highestStreakEver}
              </span>
            </div>
          </div>

          {/* Achievements Section */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>הישגים ותגים</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium font-mono">
                  {unlockedCount} / {ACHIEVEMENTS.length}
                </span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = Boolean(profile.unlockedAchievements[ach.id]);
                return (
                  <div
                    key={ach.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      isUnlocked
                        ? 'bg-slate-800/60 border-amber-500/30 text-white shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/50 text-slate-500 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isUnlocked
                          ? `bg-gradient-to-tr ${ach.badgeColor} text-white shadow-md shadow-indigo-500/20`
                          : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      {getAchievementIcon(ach.iconName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                          {ach.title}
                        </span>
                        {isUnlocked && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded font-semibold shrink-0">
                            נפתח!
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {ach.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-sm font-semibold text-white transition-all shadow-sm"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
