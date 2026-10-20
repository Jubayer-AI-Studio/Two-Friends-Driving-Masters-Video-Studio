import React, { useState } from 'react';
import { Play, Sparkles, ChevronLeft, ChevronRight, Volume2, Film, CheckCircle } from 'lucide-react';
import { STORY_SCENES } from '../data/storyData';
import { StoryScene } from '../types';
import { SoundEngine } from '../utils/audio';

interface StoryVisualizerProps {
  lang: 'bn' | 'en';
  onSelectSceneForVideo: (scene: StoryScene) => void;
  soundEnabled: boolean;
}

export const StoryVisualizer: React.FC<StoryVisualizerProps> = ({
  lang,
  onSelectSceneForVideo,
  soundEnabled,
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [isNarrating, setIsNarrating] = useState<boolean>(false);

  const activeScene = STORY_SCENES[currentSceneIndex];

  const handleNext = () => {
    if (soundEnabled) SoundEngine.playBeep(false);
    setCurrentSceneIndex((prev) => (prev + 1) % STORY_SCENES.length);
  };

  const handlePrev = () => {
    if (soundEnabled) SoundEngine.playBeep(false);
    setCurrentSceneIndex((prev) => (prev - 1 + STORY_SCENES.length) % STORY_SCENES.length);
  };

  const handleVoiceNarration = async () => {
    if (!activeScene.dialogue) return;
    try {
      setIsNarrating(true);
      if (soundEnabled) SoundEngine.playBeep(false);

      const textToNarrate =
        lang === 'bn' ? activeScene.dialogue.textBn : activeScene.dialogue.textEn;

      const res = await fetch('/api/generate-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToNarrate,
          voice: activeScene.dialogue.speaker === 'Shafin' ? 'Fenrir' : activeScene.dialogue.speaker === 'Nafis' ? 'Puck' : 'Zephyr',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.base64Audio) {
          await SoundEngine.playPcmAudio(data.base64Audio, data.sampleRate || 24000);
        }
      }
    } catch (e) {
      console.error('Narration error:', e);
    } finally {
      setIsNarrating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Chapter Navigation Timeline */}
      <div className="flex items-center justify-between overflow-x-auto py-2 gap-2 scrollbar-thin">
        {STORY_SCENES.map((scene, idx) => {
          const isSelected = idx === currentSceneIndex;
          return (
            <button
              key={scene.id}
              onClick={() => {
                if (soundEnabled) SoundEngine.playBeep(false);
                setCurrentSceneIndex(idx);
              }}
              className={`flex-1 min-w-[140px] text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-red-950/80 to-blue-950/80 border-amber-500/80 shadow-md shadow-amber-950/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {lang === 'bn' ? `অধ্যায় 0${scene.chapterNumber}` : `CH 0${scene.chapterNumber}`}
                </span>
                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <p
                className={`text-xs font-bold line-clamp-1 ${
                  isSelected ? 'text-white' : 'text-slate-300'
                }`}
              >
                {lang === 'bn' ? scene.titleBn : scene.titleEn}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Cinematic Visualizer Stage */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Dynamic Image & Stage Area */}
        <div className="relative aspect-video sm:aspect-[21/9] w-full overflow-hidden bg-slate-950">
          <img
            src={activeScene.imagePath}
            alt={activeScene.titleEn}
            className="w-full h-full object-cover transform hover:scale-102 transition-transform duration-700"
          />

          {/* Cinematic Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />

          {/* Action Badge & Tag */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600/90 text-white shadow-lg shadow-red-950/50 backdrop-blur-sm">
              {activeScene.actionTag}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/90 text-slate-300 border border-slate-700 backdrop-blur-sm">
              {lang === 'bn' ? `অধ্যায় ${activeScene.chapterNumber} / ${STORY_SCENES.length}` : `Chapter ${activeScene.chapterNumber} of ${STORY_SCENES.length}`}
            </span>
          </div>

          {/* Quick Scene Controls (Prev / Next) */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md transition-all shadow-xl hover:scale-110"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md transition-all shadow-xl hover:scale-110"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Overlay Text & Subtitles */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6">
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-lg mb-2">
              {lang === 'bn' ? activeScene.titleBn : activeScene.titleEn}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-3xl drop-shadow-md leading-relaxed">
              {lang === 'bn' ? activeScene.descriptionBn : activeScene.descriptionEn}
            </p>
          </div>
        </div>

        {/* Bottom Dialogue & Video Action Bar */}
        <div className="p-4 sm:p-6 bg-slate-900/90 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Dialogue Box */}
          {activeScene.dialogue && (
            <div className="flex-1 flex items-start gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 w-full md:w-auto">
              <button
                onClick={handleVoiceNarration}
                disabled={isNarrating}
                className={`p-2 rounded-lg border shrink-0 transition-all ${
                  isNarrating
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title="Play Voice Narration (TTS)"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                  {activeScene.dialogue.speaker === 'Narrator'
                    ? (lang === 'bn' ? 'ভাষ্যকার (Narrator)' : 'Narrator')
                    : `${activeScene.dialogue.speaker}`}
                </span>
                <p className="text-xs sm:text-sm text-slate-200 italic mt-0.5">
                  "{lang === 'bn' ? activeScene.dialogue.textBn : activeScene.dialogue.textEn}"
                </p>
              </div>
            </div>
          )}

          {/* Action to Animate in Veo Studio */}
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <button
              id="btn-animate-scene"
              onClick={() => {
                if (soundEnabled) SoundEngine.playBeep(true);
                onSelectSceneForVideo(activeScene);
              }}
              className="w-full md:w-auto px-5 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white shadow-xl shadow-purple-950/50 flex items-center justify-center gap-2 transition-all hover:scale-102"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {lang === 'bn' ? 'এই দৃশ্যটির Veo ভিডিও তৈরি করুন' : 'Animate This Scene with Veo'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
