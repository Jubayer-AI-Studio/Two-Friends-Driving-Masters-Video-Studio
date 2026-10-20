import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Play,
  Film,
  Layers,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wand2,
  Maximize2,
  Radio,
  Clock,
  Tv,
  Smartphone,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { AspectRatio, VeoModel, StoryScene, GeneratedVideoItem, CharacterStats } from '../types';
import { STORY_SCENES } from '../data/storyData';
import { SoundEngine } from '../utils/audio';

interface VeoVideoStudioProps {
  lang: 'bn' | 'en';
  soundEnabled: boolean;
  onVideoCreated: (video: GeneratedVideoItem) => void;
  selectedPresetScene?: StoryScene | null;
  selectedCharacter?: CharacterStats | null;
}

export const VeoVideoStudio: React.FC<VeoVideoStudioProps> = ({
  lang,
  soundEnabled,
  onVideoCreated,
  selectedPresetScene,
  selectedCharacter,
}) => {
  // Input State
  const [selectedImage, setSelectedImage] = useState<{
    type: 'preset' | 'upload';
    url: string;
    name: string;
    base64?: string;
  }>({
    type: 'preset',
    url: '/presets/shafin_vs_nafis.jpg',
    name: 'Shafin vs Nafis (Main Story)',
  });

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [model, setModel] = useState<VeoModel>('veo-3.1-fast-generate-preview');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [promptText, setPromptText] = useState<string>(
    'Cinematic 4k action camera panning around Shafin in red racing suit and Nafis in blue racing suit as red and blue neon lights reflect on their sleek sports cars, dynamic lighting, high-speed adrenaline racing movie style.'
  );

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('idle');
  const [currentOperationName, setCurrentOperationName] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeGeneratedVideo, setActiveGeneratedVideo] = useState<GeneratedVideoItem | null>(null);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);

  // Sync preset if passed from outer component
  useEffect(() => {
    if (selectedPresetScene) {
      setSelectedImage({
        type: 'preset',
        url: selectedPresetScene.imagePath,
        name: lang === 'bn' ? selectedPresetScene.titleBn : selectedPresetScene.titleEn,
      });
      setPromptText(selectedPresetScene.defaultPrompt);
      setAspectRatio(selectedPresetScene.suggestedAspectRatio);
    }
  }, [selectedPresetScene, lang]);

  useEffect(() => {
    if (selectedCharacter) {
      setSelectedImage({
        type: 'preset',
        url: selectedCharacter.avatar,
        name: `${selectedCharacter.name} - ${selectedCharacter.title}`,
      });
      setPromptText(
        selectedCharacter.color === 'red'
          ? 'Cinematic shot of young champion Shafin roaring down the track in his crimson red supercar, nitro flames blasting from the exhaust pipes in high speed motion blur.'
          : 'Cinematic slow-motion shot of young champion Nafis power-sliding his electric blue sports car around a sharp turn at midnight with smoking tires and neon blue underglow.'
      );
    }
  }, [selectedCharacter]);

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage({
        type: 'upload',
        url: base64,
        name: file.name,
        base64: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  // Enhance prompt with Gemini
  const handleEnhancePrompt = async () => {
    try {
      setIsEnhancingPrompt(true);
      if (soundEnabled) SoundEngine.playBeep(false);

      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenePrompt: promptText,
          customNotes: `Current focus: ${selectedImage.name}`,
          language: lang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const suggested =
          aspectRatio === '9:16' ? data.veoPrompt9x16 || data.veoPrompt16x9 : data.veoPrompt16x9 || data.veoPrompt9x16;
        if (suggested) {
          setPromptText(suggested);
        }
      }
    } catch (err) {
      console.error('Enhance prompt failed:', err);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Start Video Generation
  const handleStartGeneration = async () => {
    if (!promptText.trim()) {
      setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে প্রম্পট লিখুন' : 'Please provide a video prompt');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setElapsedSeconds(0);
      setGenerationStep('submitting');

      if (soundEnabled) {
        SoundEngine.playBeep(true);
        SoundEngine.playEngineRev();
      }

      // Start elapsed timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      const payload: any = {
        prompt: promptText,
        aspectRatio,
        model,
        resolution,
      };

      if (selectedImage.type === 'upload' && selectedImage.base64) {
        payload.imageBase64 = selectedImage.base64;
      } else if (selectedImage.type === 'preset') {
        payload.presetImagePath = selectedImage.url;
      }

      const startRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!startRes.ok) {
        const errData = await startRes.json();
        throw new Error(errData.error || 'Failed to initialize Veo generation');
      }

      const startData = await startRes.json();
      const opName = startData.operationName;
      setCurrentOperationName(opName);
      setGenerationStep('synthesizing');

      // Begin polling
      await pollVideoStatus(opName);
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(err?.message || 'Video generation failed. Please check your Gemini API key or try again.');
      setIsGenerating(false);
      setGenerationStep('error');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Poll video status loop
  const pollVideoStatus = async (operationName: string) => {
    const pollInterval = 6000; // 6 seconds
    let attempts = 0;
    const maxAttempts = 60; // 6 minutes max

    const check = async () => {
      attempts++;
      try {
        const statusRes = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });

        if (!statusRes.ok) {
          throw new Error('Failed to verify status');
        }

        const statusData = await statusRes.json();

        if (statusData.error) {
          throw new Error(statusData.error.message || 'Error occurred during Veo synthesis');
        }

        if (statusData.done) {
          setGenerationStep('downloading');
          // Fetch the final video stream
          await downloadCompletedVideo(operationName);
          return;
        }

        // Update reassuring progress message based on time
        if (attempts > 3 && attempts <= 8) {
          setGenerationStep('rendering_physics');
        } else if (attempts > 8) {
          setGenerationStep('finalizing_frames');
        }

        if (attempts < maxAttempts) {
          setTimeout(check, pollInterval);
        } else {
          throw new Error('Video generation timed out. Please try again with Veo Fast model.');
        }
      } catch (e: any) {
        setErrorMessage(e?.message || 'Error during polling');
        setIsGenerating(false);
        setGenerationStep('error');
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    setTimeout(check, pollInterval);
  };

  // Download completed video
  const downloadCompletedVideo = async (operationName: string) => {
    try {
      const dlRes = await fetch('/api/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName }),
      });

      if (!dlRes.ok) {
        throw new Error('Failed to retrieve video stream');
      }

      const blob = await dlRes.blob();
      const videoBlobUrl = URL.createObjectURL(blob);

      const newVideoItem: GeneratedVideoItem = {
        id: `video-${Date.now()}`,
        timestamp: Date.now(),
        operationName,
        prompt: promptText,
        aspectRatio,
        model,
        sourceImage: selectedImage.url,
        sourceImageName: selectedImage.name,
        videoBlobUrl,
        downloadUrl: videoBlobUrl,
        status: 'ready',
      };

      setActiveGeneratedVideo(newVideoItem);
      onVideoCreated(newVideoItem);
      setIsGenerating(false);
      setGenerationStep('ready');

      if (soundEnabled) {
        SoundEngine.playNitroBlast();
      }

      if (timerRef.current) clearInterval(timerRef.current);
    } catch (e: any) {
      console.error('Download error:', e);
      setErrorMessage('Failed to load video file: ' + e?.message);
      setIsGenerating(false);
      setGenerationStep('error');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Step feedback messages
  const getStepMessage = () => {
    switch (generationStep) {
      case 'submitting':
        return lang === 'bn'
          ? 'Veo সার্ভারে ইমেজ ও মোশন প্রম্পট পাঠানো হচ্ছে...'
          : 'Initializing request and transmitting motion choreography to Veo 3.1...';
      case 'synthesizing':
        return lang === 'bn'
          ? 'Veo AI মডেল মোশন ফ্রেম এবং হাই-স্পিড ক্যামেরার আলো তৈরি করছে...'
          : 'Synthesizing dynamic motion vectors, camera trajectory, and particle physics...';
      case 'rendering_physics':
        return lang === 'bn'
          ? 'নাইট্রো আগুন, ড্রিফট ধোঁয়া এবং গাড়ির প্রতিফলন রেন্ডার হচ্ছে...'
          : 'Rendering realistic neon reflections, exhaust nitro flames, and asphalt drift physics...';
      case 'finalizing_frames':
        return lang === 'bn'
          ? 'এইচডি কোয়ালিটিতে ফাইনাল ভিডিও ফ্রেম এনকোড করা হচ্ছে...'
          : 'Encoding high-definition video frames into streaming MP4...';
      case 'downloading':
        return lang === 'bn'
          ? 'ভিডিও তৈরি সম্পন্ন! লোড করা হচ্ছে...'
          : 'Generation complete! Fetching and buffering video player...';
      default:
        return lang === 'bn'
          ? 'ভিডিও জেনারেশন প্রক্রিয়াধীন...'
          : 'Veo video generation in progress...';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Form: Image, Aspect Ratio, Prompt & Settings (7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Source Image Selector */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-400" />
              <span>{lang === 'bn' ? '১. সোর্স ছবি নির্বাচন করুন' : '1. Select Source Image'}</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              {lang === 'bn' ? 'আপলোড করুন বা প্রিসেট ছবি বাছুন' : 'Upload photo or choose scene'}
            </span>
          </div>

          {/* Preset Scene Thumbnails */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {STORY_SCENES.map((scene) => {
              const isSelected = selectedImage.url === scene.imagePath;
              return (
                <button
                  key={scene.id}
                  onClick={() => {
                    if (soundEnabled) SoundEngine.playBeep(false);
                    setSelectedImage({
                      type: 'preset',
                      url: scene.imagePath,
                      name: lang === 'bn' ? scene.titleBn : scene.titleEn,
                    });
                    setPromptText(scene.defaultPrompt);
                  }}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group ${
                    isSelected
                      ? 'border-amber-400 scale-102 shadow-md shadow-amber-950/50 ring-2 ring-amber-400/30'
                      : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={scene.imagePath} alt={scene.titleEn} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40" />
                  <span className="absolute bottom-1 left-1 right-1 text-[9px] font-bold text-white truncate drop-shadow-md">
                    {lang === 'bn' ? scene.titleBn : scene.titleEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Drag and Drop / Custom File Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-slate-700 hover:border-red-500/80 bg-slate-950/60 hover:bg-slate-950 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-red-400">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-200">
                  {lang === 'bn' ? 'নিজের কোনো ছবি আপলোড করতে এখানে ক্লিক করুন' : 'Click or Drag & Drop your own image'}
                </p>
                <p className="text-[10px] text-slate-400">PNG, JPG, WEBP (Any aspect ratio)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Aspect Ratio & Video Settings */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-400" />
              <span>{lang === 'bn' ? '২. অ্যাসপেক্ট রেশিও ও ফরম্যাট' : '2. Aspect Ratio & Video Format'}</span>
            </h3>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              Veo 3.1 Certified
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 16:9 Landscape */}
            <button
              id="ratio-16-9"
              onClick={() => {
                if (soundEnabled) SoundEngine.playBeep(false);
                setAspectRatio('16:9');
              }}
              className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all ${
                aspectRatio === '16:9'
                  ? 'bg-gradient-to-r from-red-950/80 to-slate-900 border-red-500 text-white shadow-md shadow-red-950/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-red-400">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black block text-white">16:9 Landscape</span>
                <span className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'ইউটিউব, টিভি, ল্যান্ডস্কেপ' : 'YouTube, Cinema, Desktop'}
                </span>
              </div>
            </button>

            {/* 9:16 Portrait */}
            <button
              id="ratio-9-16"
              onClick={() => {
                if (soundEnabled) SoundEngine.playBeep(false);
                setAspectRatio('9:16');
              }}
              className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all ${
                aspectRatio === '9:16'
                  ? 'bg-gradient-to-r from-blue-950/80 to-slate-900 border-blue-500 text-white shadow-md shadow-blue-950/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-blue-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black block text-white">9:16 Portrait</span>
                <span className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'টিকটক, রিলস, শর্টস' : 'TikTok, Shorts, Reels'}
                </span>
              </div>
            </button>
          </div>

          {/* Model & Quality Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">
                {lang === 'bn' ? 'Veo মডেল:' : 'Veo Model:'}
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as VeoModel)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs font-semibold rounded-xl p-2.5 focus:border-red-500 focus:outline-none"
              >
                <option value="veo-3.1-fast-generate-preview">veo-3.1-fast-generate-preview (Fastest)</option>
                <option value="veo-3.1-lite-generate-preview">veo-3.1-lite-generate-preview (Balanced)</option>
                <option value="veo-3.1-generate-preview">veo-3.1-generate-preview (Ultra 4K)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">
                {lang === 'bn' ? 'রেজোলিউশন:' : 'Resolution:'}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResolution('720p')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    resolution === '720p'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  720p HD
                </button>
                <button
                  type="button"
                  onClick={() => setResolution('1080p')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    resolution === '1080p'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  1080p Full HD
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Prompt & AI Enhancer */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{lang === 'bn' ? '৩. সিনেমেটিক মোশন প্রম্পট' : '3. Cinematic Motion Prompt'}</span>
            </h3>
            <button
              onClick={handleEnhancePrompt}
              disabled={isEnhancingPrompt}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all disabled:opacity-50"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'AI দিয়ে প্রম্পট নিখুঁত করুন' : 'AI Enhance Prompt'}</span>
            </button>
          </div>

          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
            placeholder={
              lang === 'bn'
                ? 'ভিডিওতে ক্যামেরা এবং চরিত্রের কী কী নড়াচড়া হবে তা লিখুন...'
                : 'Describe dynamic racing motion, camera sweeps, nitro glow, drift angles...'
            }
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
          />

          {/* Prompt Quick Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              'FPV Drone Chase',
              'Nitro Exhaust Flames',
              'Midnight Neon Reflections',
              'Apex 90° Power Drift',
              'Slow-Motion Finish Line',
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setPromptText((prev) => `${prev.trim()}, ${tag}`)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div>
          {errorMessage && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            id="btn-generate-veo-video"
            onClick={handleStartGeneration}
            disabled={isGenerating}
            className={`w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-2xl ${
              isGenerating
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white shadow-purple-950/60 hover:scale-101'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                <span>{lang === 'bn' ? 'Veo ভিডিও রেন্ডার হচ্ছে...' : 'Generating Video with Veo 3.1...'}</span>
              </>
            ) : (
              <>
                <Flame className="w-5 h-5 text-amber-300" />
                <span>
                  {lang === 'bn'
                    ? 'Veo AI ভিডিও তৈরি করুন (Generate Video)'
                    : 'Generate Veo Cinematic Video'}
                </span>
                <ChevronRight className="w-5 h-5 text-white/80" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Canvas: Live Monitor / Video Output / Reassuring Loading Stage (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Radio className={`w-4 h-4 ${isGenerating ? 'text-green-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{lang === 'bn' ? 'ভিডিও স্টুডিও মনিটর' : 'Studio Monitor'}</span>
            </h3>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                isGenerating
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : activeGeneratedVideo
                  ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isGenerating ? 'RENDERING' : activeGeneratedVideo ? 'OUTPUT READY' : 'PREVIEW'}
            </span>
          </div>

          {/* Video / Loading / Source Display Area */}
          <div
            className={`relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center transition-all ${
              aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[520px] mx-auto' : 'aspect-video w-full'
            }`}
          >
            {/* 1. If Video is Ready */}
            {activeGeneratedVideo?.videoBlobUrl ? (
              <div className="relative w-full h-full group bg-black flex items-center justify-center">
                <video
                  ref={videoPlayerRef}
                  src={activeGeneratedVideo.videoBlobUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            ) : isGenerating ? (
              /* 2. Reassuring Loading Animation & Live Progress */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                {/* Background Source Image Blurred */}
                <img
                  src={selectedImage.url}
                  alt="Rendering"
                  className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110"
                />
                <div className="absolute inset-0 bg-slate-950/80" />

                {/* Animated Engine Speedometer / Spinner */}
                <div className="relative z-10 space-y-4 max-w-xs">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-red-500/20 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-r-blue-500 border-b-amber-400 border-l-transparent animate-spin" />
                    <div className="w-full h-full flex items-center justify-center">
                      <Flame className="w-8 h-8 text-amber-400 animate-bounce" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white">{getStepMessage()}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {lang === 'bn'
                        ? 'Veo মডেল ভিডিও তৈরি করতে ১-২ মিনিট সময় নিতে পারে।'
                        : 'Veo generates realistic physics and lighting. This takes approx 1-2 mins.'}
                    </p>
                  </div>

                  {/* Stopwatch Counter */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono font-bold text-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {Math.floor(elapsedSeconds / 60)}:
                      {(elapsedSeconds % 60).toString().padStart(2, '0')}s
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* 3. Static Preview of selected image */
              <div className="relative w-full h-full group">
                <img
                  src={selectedImage.url}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-white drop-shadow truncate">
                    {selectedImage.name}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-700">
                    {aspectRatio}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Video Actions when ready */}
          {activeGeneratedVideo?.videoBlobUrl && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-2">
                <a
                  href={activeGeneratedVideo.videoBlobUrl}
                  download={`driving_masters_${Date.now()}.mp4`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ভিডিও ডাউনলোড করুন (MP4)' : 'Download MP4'}</span>
                </a>

                <button
                  onClick={() => {
                    setActiveGeneratedVideo(null);
                    setGenerationStep('idle');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'নতুন তৈরি করুন' : 'New'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Model:</span>
                  <span className="text-slate-300 font-mono">{activeGeneratedVideo.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Aspect Ratio:</span>
                  <span className="text-slate-300 font-mono">{activeGeneratedVideo.aspectRatio}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
