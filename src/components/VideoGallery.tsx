import React from 'react';
import { Film, Download, Play, Clock, Sparkles } from 'lucide-react';
import { GeneratedVideoItem } from '../types';

interface VideoGalleryProps {
  videos: GeneratedVideoItem[];
  lang: 'bn' | 'en';
  onSelectVideo: (video: GeneratedVideoItem) => void;
}

export const VideoGallery: React.FC<VideoGalleryProps> = ({
  videos,
  lang,
  onSelectVideo,
}) => {
  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-extrabold text-white">
            {lang === 'bn' ? 'জেনারেট করা ভিডিও গ্যালারি' : 'Generated Videos Gallery'}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {videos.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {videos.map((vid) => (
          <div
            key={vid.id}
            className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-amber-500/60 transition-all flex flex-col justify-between"
          >
            {/* Video / Thumbnail */}
            <div className="relative aspect-video w-full bg-black overflow-hidden">
              {vid.videoBlobUrl ? (
                <video
                  src={vid.videoBlobUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  muted
                  playsInline
                  onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                  onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                />
              ) : (
                <img
                  src={vid.sourceImage || '/presets/shafin_vs_nafis.jpg'}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              )}

              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-900/90 text-white border border-slate-700 backdrop-blur-sm">
                  {vid.aspectRatio}
                </span>
              </div>
            </div>

            {/* Meta */}
            <div className="p-3 space-y-2">
              <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-tight">
                {vid.prompt}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {new Date(vid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-amber-400 font-semibold truncate max-w-[120px]">
                  {vid.model.replace('veo-3.1-', '')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onSelectVideo(vid)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <Play className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'প্লে করুন' : 'Play'}</span>
                </button>
                {vid.videoBlobUrl && (
                  <a
                    href={vid.videoBlobUrl}
                    download={`veo_${vid.id}.mp4`}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center"
                    title="Download MP4"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
