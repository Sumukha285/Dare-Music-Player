import React, { useEffect, useRef } from "react";
import { Caption, ThemeConfig } from "../types";
import { Sparkles, MessageSquareCode, Music } from "lucide-react";

interface CaptionPlayerProps {
  captions: Caption[];
  currentTime: number;
  onGenerateAiCaptions: () => Promise<void>;
  isGenerating: boolean;
  trackTitle: string;
  provider: string;
  theme: ThemeConfig;
}

export default function CaptionPlayer({
  captions,
  currentTime,
  onGenerateAiCaptions,
  isGenerating,
  trackTitle,
  provider,
  theme
}: CaptionPlayerProps) {
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Find the index of the currently active caption
  let activeIndex = -1;
  for (let i = 0; i < captions.length; i++) {
    if (currentTime >= captions[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smooth scroll active caption line to center of container
  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const el = activeLineRef.current;
      
      const elTop = el.offsetTop;
      const elHeight = el.offsetHeight;
      const containerHeight = container.offsetHeight;
      
      container.scrollTo({
        top: elTop - containerHeight / 2 + elHeight / 2,
        behavior: "smooth"
      });
    }
  }, [activeIndex]);

  const activeCaptionText = activeIndex >= 0 ? captions[activeIndex].text : "🎵 Preparing soundscape...";

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col space-y-4" id="captions-widget">
      {/* Live Active Subtitle Display */}
      <div 
        className={`rounded-2xl p-6 border flex flex-col justify-center items-center text-center min-h-[110px] shadow-inner relative overflow-hidden ${
          theme.id === 'immersive' 
            ? "bg-white/[0.02] border-white/10 backdrop-blur-xl" 
            : "bg-black/25 border-white/5"
        }`}
        id="active-subtitle-panel"
      >
        {/* Dynamic decorative visual ripple matching theme accent */}
        <div 
          className="absolute inset-0 bg-radial from-transparent to-transparent opacity-10 pointer-events-none transition-all duration-500" 
          style={{ backgroundImage: `radial-gradient(circle, ${theme.accentHex}1a 0%, transparent 70%)` }}
        />
        
        <div className="absolute top-3 left-4 flex items-center gap-2">
          {theme.id === 'immersive' ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-[8px] uppercase tracking-widest text-white/40 font-mono">Live Captions Engine v2.4</span>
            </>
          ) : (
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono flex items-center gap-1">
              <Music className="w-2.5 h-2.5" /> Live Auto Caption
            </span>
          )}
        </div>
        
        <p 
          className={`text-base md:text-lg font-medium px-4 leading-relaxed transition-all duration-300 mt-4 ${
            theme.id === 'immersive'
              ? activeIndex >= 0 
                ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 font-bold" 
                : "text-white/40 italic font-medium"
              : activeIndex >= 0 
                ? theme.textPrimary 
                : "text-slate-400 italic"
          }`}
          id="active-subtitle-text"
        >
          {activeCaptionText}
        </p>
      </div>

      {/* Sync Lyric Timeline view */}
      <div className="flex items-center justify-between" id="subtitle-meta-bar">
        <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <MessageSquareCode className="w-3.5 h-3.5" style={{ color: theme.accentHex }} />
          Lyrics Scroll-Deck
        </h4>
        
        {/* Caption engine state provider info */}
        <span className="text-[9px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">
          Source: {provider === 'gemini' ? "🤖 Gemini AI" : (provider === 'fallback' || provider === 'fallback-on-error') ? "📝 Local Synth" : "💽 Track Presets"}
        </span>
      </div>

      <div 
        ref={scrollContainerRef}
        className="h-44 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent rounded-xl bg-black/15 border border-white/5 p-4 space-y-3 relative"
        id="scroll-lyrics-container"
      >
        {captions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
            <p className="text-xs italic">No subtitles available for this audio file.</p>
          </div>
        ) : (
          captions.map((caption, idx) => {
            const isActive = idx === activeIndex;
            const isPassed = idx < activeIndex;
            
            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                id={`lyric-line-${idx}`}
                className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? "bg-white/5 border border-white/10 shadow-sm scale-[1.02]" 
                    : "opacity-40"
                }`}
              >
                {/* Timestamp */}
                <span className={`text-[10px] font-mono mt-0.5 min-w-[34px] ${isActive ? "font-bold" : "text-slate-500"}`} style={{ color: isActive ? theme.accentHex : undefined }}>
                  {formatTime(caption.time)}
                </span>
                
                {/* Lyric content */}
                <p className={`text-xs leading-relaxed ${isActive ? "font-semibold text-white" : isPassed ? "text-slate-400" : "text-slate-500"}`}>
                  {caption.text}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Trigger AI Captain Generator Option */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center" id="ai-generator-panel">
        <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed" id="caption-explanation">
          Playing a custom uploaded track? Let Gemini analyze the song details and structure professional-grade captions.
        </p>
        
        <button
          onClick={onGenerateAiCaptions}
          disabled={isGenerating}
          id="generate-ai-captions-btn"
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 disabled:opacity-50 select-none ${
            theme.id === 'cyberpunk' 
              ? "bg-yellow-300 text-black border border-black hover:bg-yellow-200"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-900/20"
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Gemini is composing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Re-compose AI Captions</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
