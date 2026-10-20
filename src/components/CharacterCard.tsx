import React from 'react';
import { Zap, Gauge, Compass, Flame, Play, Volume2 } from 'lucide-react';
import { CharacterStats } from '../types';
import { SoundEngine } from '../utils/audio';

interface CharacterCardProps {
  character: CharacterStats;
  lang: 'bn' | 'en';
  onSelectForVideo: (character: CharacterStats) => void;
  soundEnabled: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  lang,
  onSelectForVideo,
  soundEnabled,
}) => {
  const isRed = character.color === 'red';

  const handleTestDriveSFX = () => {
    if (!soundEnabled) return;
    if (isRed) {
      SoundEngine.playEngineRev();
      setTimeout(() => SoundEngine.playNitroBlast(), 500);
    } else {
      SoundEngine.playEngineRev();
      setTimeout(() => SoundEngine.playTireScreech(), 400);
    }
  };

  return (
    <div
      id={`character-card-${character.name.toLowerCase()}`}
      className={`relative rounded-2xl overflow-hidden border backdrop-blur-xl transition-all duration-300 ${
        isRed
          ? 'bg-gradient-to-b from-red-950/40 via-slate-950/80 to-slate-950 border-red-800/40 hover:border-red-500/80 shadow-lg shadow-red-950/30'
          : 'bg-gradient-to-b from-blue-950/40 via-slate-950/80 to-slate-950 border-blue-800/40 hover:border-blue-500/80 shadow-lg shadow-blue-950/30'
      }`}
    >
      {/* Header Tag */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/80">
        <div>
          <span
            className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded ${
              isRed ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}
          >
            {isRed ? 'PLAYER 1' : 'PLAYER 2'}
          </span>
          <h3 className="text-2xl font-black tracking-tight text-white mt-1">
            {character.name}
          </h3>
          <p
            className={`text-xs font-bold tracking-wider ${
              isRed ? 'text-red-400' : 'text-blue-400'
            }`}
          >
            {lang === 'bn' ? character.titleBn : character.title}
          </p>
        </div>

        <button
          onClick={handleTestDriveSFX}
          title={lang === 'bn' ? 'ইঞ্জিন সাউন্ড টেস্ট' : 'Engine SFX Test'}
          className={`p-2.5 rounded-xl border transition-all ${
            isRed
              ? 'bg-red-950/80 border-red-600/50 text-red-300 hover:bg-red-900'
              : 'bg-blue-950/80 border-blue-600/50 text-blue-300 hover:bg-blue-900'
          }`}
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Image Preview */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900 group">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 drop-shadow-md flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isRed ? 'bg-red-500 shadow-red-500 shadow-sm' : 'bg-blue-500 shadow-blue-500 shadow-sm'}`} />
            {character.carName}
          </span>
        </div>
      </div>

      {/* Content & Bio */}
      <div className="p-4 sm:p-5 space-y-4">
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed min-h-[44px]">
          {lang === 'bn' ? character.bioBn : character.bioEn}
        </p>

        {/* Stats Grid */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Gauge className={`w-3.5 h-3.5 ${isRed ? 'text-red-400' : 'text-blue-400'}`} />
                {lang === 'bn' ? 'টপ স্পিড (Top Speed)' : 'Top Speed'}
              </span>
              <span className="text-white">{character.topSpeed}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isRed ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${character.topSpeed}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Zap className={`w-3.5 h-3.5 ${isRed ? 'text-red-400' : 'text-blue-400'}`} />
                {lang === 'bn' ? 'অ্যাক্সিলারেশন (Acceleration)' : 'Acceleration'}
              </span>
              <span className="text-white">{character.acceleration}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isRed ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${character.acceleration}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Compass className={`w-3.5 h-3.5 ${isRed ? 'text-red-400' : 'text-blue-400'}`} />
                {lang === 'bn' ? 'হ্যান্ডলিং ও ড্রিফট (Handling)' : 'Handling'}
              </span>
              <span className="text-white">{character.handling}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isRed ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${character.handling}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Flame className={`w-3.5 h-3.5 ${isRed ? 'text-red-400' : 'text-blue-400'}`} />
                {lang === 'bn' ? 'নাইট্রো পাওয়ার (Nitro Power)' : 'Nitro'}
              </span>
              <span className="text-white">{character.nitro}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isRed ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${character.nitro}%` }}
              />
            </div>
          </div>
        </div>

        {/* Special Move Box */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <span className="font-bold text-slate-400 block mb-0.5">
            {lang === 'bn' ? 'বিশেষ চাল (Special Ability):' : 'Special Ability:'}
          </span>
          <span className={isRed ? 'text-red-300 font-semibold' : 'text-blue-300 font-semibold'}>
            {lang === 'bn' ? character.specialMoveBn : character.specialMoveEn}
          </span>
        </div>

        {/* Action Button */}
        <button
          id={`btn-select-character-${character.name.toLowerCase()}`}
          onClick={() => {
            if (soundEnabled) SoundEngine.playBeep(true);
            onSelectForVideo(character);
          }}
          className={`w-full py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            isRed
              ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-red-950/50'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-950/50'
          }`}
        >
          <Play className="w-4 h-4 fill-white" />
          <span>
            {lang === 'bn'
              ? `${character.name}-এর ভিডিও জেনারেট করুন`
              : `Generate ${character.name}'s Video`}
          </span>
        </button>
      </div>
    </div>
  );
};
