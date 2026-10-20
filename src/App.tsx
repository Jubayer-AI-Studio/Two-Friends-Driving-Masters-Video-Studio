import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { StoryVisualizer } from './components/StoryVisualizer';
import { VeoVideoStudio } from './components/VeoVideoStudio';
import { CharacterCard } from './components/CharacterCard';
import { VideoGallery } from './components/VideoGallery';
import { CHARACTERS } from './data/storyData';
import { StoryScene, CharacterStats, GeneratedVideoItem } from './types';
import { Film, Sparkles, Trophy, Play, Flame, Zap } from 'lucide-react';
import { SoundEngine } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<'story' | 'studio' | 'characters'>('studio');
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [selectedSceneForStudio, setSelectedSceneForStudio] = useState<StoryScene | null>(null);
  const [selectedCharacterForStudio, setSelectedCharacterForStudio] = useState<CharacterStats | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideoItem[]>([]);

  // Callback when user wants to animate a specific scene
  const handleSelectSceneForVideo = (scene: StoryScene) => {
    setSelectedSceneForStudio(scene);
    setSelectedCharacterForStudio(null);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Callback when user wants to generate video for a character
  const handleSelectCharacterForVideo = (character: CharacterStats) => {
    setSelectedCharacterForStudio(character);
    setSelectedSceneForStudio(null);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoCreated = (video: GeneratedVideoItem) => {
    setGeneratedVideos((prev) => [video, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* HUD Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        generatedCount={generatedVideos.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Story Intro Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-r from-red-950/60 via-slate-900 to-blue-950/60 p-6 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {lang === 'bn' ? 'অরিজিনাল স্টোরি' : 'Original Story'}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {lang === 'bn' ? 'শাফিন (স্পিড) ও নাফিস (ড্রিফট)' : 'Shafin (Speed) & Nafis (Drift)'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {lang === 'bn'
                  ? 'অনেক বছর আগে দুই বন্ধু ছিল... আজ তারা ড্রাইভিং মাস্টার্স!'
                  : 'Two Childhood Friends... Today Legendary Driving Masters!'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {lang === 'bn'
                  ? 'শৈশবের বন্ধুত্ব, তুচ্ছ ঝগড়ায় আলাদা হয়ে যাওয়ার পর প্রত্যেকেই হয়ে উঠেছিল সেরা ড্রাইভার। আজ তারা মুখোমুখি ট্র্যাকে! যেকোনো ছবি আপলোড করুন অথবা এই দৃশ্যগুলো দিয়ে Veo 3.1 মডেল দিয়ে হাই-স্পিড ভিডিও তৈরি করুন।'
                  : 'Separated by a heated quarrel in childhood, each mastered their own craft—Shafin the Speed Master and Nafis the Drift King. Animate their epic rivalry into cinematic videos with Veo 3.1!'}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0 w-full md:w-auto">
              <button
                id="btn-hero-generator"
                onClick={() => {
                  if (soundEnabled) SoundEngine.playBeep(true);
                  setActiveTab('studio');
                }}
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 transition-all hover:scale-102"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{lang === 'bn' ? 'ভিডিও জেনারেটর খুলুন' : 'Open Video Studio'}</span>
              </button>

              <button
                id="btn-hero-story"
                onClick={() => {
                  if (soundEnabled) SoundEngine.playBeep(false);
                  setActiveTab('story');
                }}
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <Film className="w-4 h-4 text-red-400" />
                <span>{lang === 'bn' ? 'সম্পূর্ণ গল্প দেখুন' : 'View Story Chapters'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Contents */}
        {activeTab === 'studio' && (
          <section id="section-studio" className="space-y-6">
            <VeoVideoStudio
              lang={lang}
              soundEnabled={soundEnabled}
              onVideoCreated={handleVideoCreated}
              selectedPresetScene={selectedSceneForStudio}
              selectedCharacter={selectedCharacterForStudio}
            />
          </section>
        )}

        {activeTab === 'story' && (
          <section id="section-story" className="space-y-6">
            <StoryVisualizer
              lang={lang}
              onSelectSceneForVideo={handleSelectSceneForVideo}
              soundEnabled={soundEnabled}
            />
          </section>
        )}

        {activeTab === 'characters' && (
          <section id="section-characters" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">
                  {lang === 'bn' ? 'ড্রাইভিং মাস্টার্স প্রোফাইল' : 'Driving Masters Profiles'}
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === 'bn'
                    ? 'শাফিন (স্পিড মাস্টার - লাল গাড়ি) বনাম নাফিস (ড্রিফট কিং - নীল গাড়ি)'
                    : 'Shafin (Speed Master - Red GT) vs Nafis (Drift King - Blue Cobalt)'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CharacterCard
                character={CHARACTERS.shafin}
                lang={lang}
                onSelectForVideo={handleSelectCharacterForVideo}
                soundEnabled={soundEnabled}
              />
              <CharacterCard
                character={CHARACTERS.nafis}
                lang={lang}
                onSelectForVideo={handleSelectCharacterForVideo}
                soundEnabled={soundEnabled}
              />
            </div>
          </section>
        )}

        {/* Video Gallery Section (if videos generated) */}
        <VideoGallery
          videos={generatedVideos}
          lang={lang}
          onSelectVideo={(video) => {
            setSelectedSceneForStudio(null);
            setSelectedCharacterForStudio(null);
            setActiveTab('studio');
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {lang === 'bn'
              ? 'শাফিন ও নাফিস: ড্রাইভিং মাস্টার্স - Veo 3.1 ভিডিও জেনারেটর'
              : 'Shafin & Nafis: Driving Masters - Veo 3.1 AI Video Generation Studio'}
          </span>
          <span className="text-slate-600">
            Powered by Google AI Studio & Veo Video Models
          </span>
        </div>
      </footer>
    </div>
  );
}
