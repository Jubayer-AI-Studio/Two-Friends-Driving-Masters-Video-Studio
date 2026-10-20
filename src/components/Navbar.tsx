import React from 'react';
import { Film, Sparkles, Trophy, Volume2, VolumeX, Globe } from 'lucide-react';
import { SoundEngine } from '../utils/audio';

interface NavbarProps {
  activeTab: 'story' | 'studio' | 'characters';
  setActiveTab: (tab: 'story' | 'studio' | 'characters') => void;
  lang: 'bn' | 'en';
  setLang: (lang: 'bn' | 'en') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  generatedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  soundEnabled,
  setSoundEnabled,
  generatedCount,
}) => {
  const handleTabSwitch = (tab: 'story' | 'studio' | 'characters') => {
    if (soundEnabled) SoundEngine.playBeep(false);
    setActiveTab(tab);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 via-purple-600 to-blue-600 p-[1.5px] shadow-lg shadow-red-950/50">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-400 text-base tracking-tighter">
              2M
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-red-400 via-amber-300 to-blue-400 bg-clip-text text-transparent">
                {lang === 'bn' ? 'দুই বন্ধু: ড্রাইভিং মাস্টার্স' : 'Two Friends: Driving Masters'}
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-950/80 border border-red-500/40 text-red-300 uppercase tracking-wider">
                Veo 3.1
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400">
              {lang === 'bn' ? 'শাফিন (স্পিড) ও নাফিস (ড্রিফট) - সিনেমেটিক ভিডিও স্টুডিও' : 'Shafin (Speed) & Nafis (Drift) AI Cinematic Studio'}
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            id="nav-tab-studio"
            onClick={() => handleTabSwitch('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'studio'
                ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white shadow-md shadow-red-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{lang === 'bn' ? 'ভিডিও জেনারেটর' : 'Veo Studio'}</span>
            {generatedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-slate-950/80 text-amber-400 rounded-full font-bold">
                {generatedCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-story"
            onClick={() => handleTabSwitch('story')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'story'
                ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white shadow-md shadow-red-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Film className="w-4 h-4 text-red-400" />
            <span>{lang === 'bn' ? 'গল্পের দৃশ্যসমূহ' : 'Story Chapters'}</span>
          </button>

          <button
            id="nav-tab-characters"
            onClick={() => handleTabSwitch('characters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'characters'
                ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white shadow-md shadow-red-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4 text-blue-400" />
            <span>{lang === 'bn' ? 'চরিত্র প্রোফাইল' : 'Characters'}</span>
          </button>
        </nav>

        {/* Right Tools: Sound & Language */}
        <div className="flex items-center space-x-2">
          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Language Switcher */}
          <button
            id="btn-toggle-lang"
            onClick={() => {
              if (soundEnabled) SoundEngine.playBeep(false);
              setLang(lang === 'bn' ? 'en' : 'bn');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
