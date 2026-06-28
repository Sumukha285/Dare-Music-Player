import React from "react";
import { ThemeConfig } from "../types";
import { 
  Radio, 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  Activity, 
  HelpCircle,
  Sparkles,
  Waves
} from "lucide-react";

interface EffectsRackProps {
  echoEnabled: boolean;
  echoFeedback: number;
  echoTime: number;
  reverbEnabled: boolean;
  reverbMix: number;
  reverbDecay: number;
  theme: ThemeConfig;
  onUpdateEcho: (enabled: boolean, feedback: number, time: number) => void;
  onUpdateReverb: (enabled: boolean, mix: number, decay: number) => void;
}

export default function EffectsRack({
  echoEnabled,
  echoFeedback,
  echoTime,
  reverbEnabled,
  reverbMix,
  reverbDecay,
  theme,
  onUpdateEcho,
  onUpdateReverb
}: EffectsRackProps) {

  // Standard premium effects templates
  const applyEffectPreset = (type: "echo" | "reverb" | "all-off" | "space" | "cathedral" | "dub") => {
    if (type === "all-off") {
      onUpdateEcho(false, 0.3, 0.35);
      onUpdateReverb(false, 0.3, 2.5);
    } else if (type === "space") {
      onUpdateEcho(true, 0.6, 0.5);
      onUpdateReverb(true, 0.45, 3.5);
    } else if (type === "cathedral") {
      onUpdateEcho(false, 0.3, 0.35);
      onUpdateReverb(true, 0.65, 4.8);
    } else if (type === "dub") {
      onUpdateEcho(true, 0.75, 0.65);
      onUpdateReverb(true, 0.25, 1.5);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-5" id="effects-rack-panel">
      
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5" id="effects-header-row">
        <div className="flex items-center space-x-2" id="effects-title">
          <Waves className="w-4 h-4" style={{ color: theme.accentHex }} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Spatial Effects Processor
          </h3>
        </div>
        <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
          Web Audio FX Core
        </span>
      </div>

      {/* Preset quick pills */}
      <div className="flex flex-wrap items-center gap-1.5" id="effects-presets-row">
        <span className="text-[10px] font-mono text-slate-500 mr-1">Presets:</span>
        <button
          onClick={() => applyEffectPreset("all-off")}
          className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/5"
          id="fx-preset-dry"
        >
          Dry (Flat)
        </button>
        <button
          onClick={() => applyEffectPreset("space")}
          className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/5 flex items-center gap-1"
          id="fx-preset-space"
        >
          <Sparkles className="w-2.5 h-2.5 text-purple-400" /> Space Echo
        </button>
        <button
          onClick={() => applyEffectPreset("cathedral")}
          className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/5"
          id="fx-preset-cathedral"
        >
          ⛪ Cathedral Reverb
        </button>
        <button
          onClick={() => applyEffectPreset("dub")}
          className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/5"
          id="fx-preset-dub"
        >
          📻 Dub Echo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="fx-grids-container">
        
        {/* ECHO / FEEDBACK DELAY RACK */}
        <div 
          className="bg-black/20 rounded-2xl p-4 border border-white/5 flex flex-col space-y-3.5 relative overflow-hidden"
          id="echo-fx-card"
        >
          <div className="flex items-center justify-between" id="echo-fx-header">
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${echoEnabled ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`} />
              <span className="text-xs font-bold text-slate-200">Echo Delay</span>
            </div>

            <button
              onClick={() => onUpdateEcho(!echoEnabled, echoFeedback, echoTime)}
              className="text-slate-400 hover:text-white transition-all cursor-pointer"
              id="echo-toggle-btn"
            >
              {echoEnabled ? (
                <ToggleRight className="w-8 h-8 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* Slider 1: Feedback level / Wet Mix */}
          <div className="flex flex-col space-y-1.5" id="echo-feedback-control">
            <div className="flex justify-between text-[10px] font-mono" id="echo-feedback-text">
              <span className="text-slate-400">Feedback Intensity</span>
              <span className="text-slate-300" style={{ color: echoEnabled ? theme.accentHex : undefined }}>
                {Math.round(echoFeedback * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="85"
              value={Math.round(echoFeedback * 100)}
              disabled={!echoEnabled}
              onChange={(e) => onUpdateEcho(echoEnabled, parseFloat(e.target.value) / 100, echoTime)}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-current disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: echoEnabled ? theme.accentHex : "#475569" }}
              id="echo-feedback-slider"
            />
          </div>

          {/* Slider 2: Delay Time */}
          <div className="flex flex-col space-y-1.5" id="echo-time-control">
            <div className="flex justify-between text-[10px] font-mono" id="echo-time-text">
              <span className="text-slate-400">Delay Interval</span>
              <span className="text-slate-300" style={{ color: echoEnabled ? theme.accentHex : undefined }}>
                {echoTime.toFixed(2)}s
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={Math.round(echoTime * 100)}
              disabled={!echoEnabled}
              onChange={(e) => onUpdateEcho(echoEnabled, echoFeedback, parseFloat(e.target.value) / 100)}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-current disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: echoEnabled ? theme.accentHex : "#475569" }}
              id="echo-time-slider"
            />
          </div>
        </div>

        {/* REVERB / SPACE SIMULATOR RACK */}
        <div 
          className="bg-black/20 rounded-2xl p-4 border border-white/5 flex flex-col space-y-3.5 relative overflow-hidden"
          id="reverb-fx-card"
        >
          <div className="flex items-center justify-between" id="reverb-fx-header">
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${reverbEnabled ? "bg-purple-500 animate-ping" : "bg-slate-600"}`} />
              <span className="text-xs font-bold text-slate-200">Reverb Acoustics</span>
            </div>

            <button
              onClick={() => onUpdateReverb(!reverbEnabled, reverbMix, reverbDecay)}
              className="text-slate-400 hover:text-white transition-all cursor-pointer"
              id="reverb-toggle-btn"
            >
              {reverbEnabled ? (
                <ToggleRight className="w-8 h-8 text-purple-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* Slider 1: Reverb Wet Mix */}
          <div className="flex flex-col space-y-1.5" id="reverb-mix-control">
            <div className="flex justify-between text-[10px] font-mono" id="reverb-mix-text">
              <span className="text-slate-400">Ambience Mix</span>
              <span className="text-slate-300" style={{ color: reverbEnabled ? theme.accentHex : undefined }}>
                {Math.round(reverbMix * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={Math.round(reverbMix * 100)}
              disabled={!reverbEnabled}
              onChange={(e) => onUpdateReverb(reverbEnabled, parseFloat(e.target.value) / 100, reverbDecay)}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-current disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: reverbEnabled ? theme.accentHex : "#475569" }}
              id="reverb-mix-slider"
            />
          </div>

          {/* Slider 2: Decay duration */}
          <div className="flex flex-col space-y-1.5" id="reverb-decay-control">
            <div className="flex justify-between text-[10px] font-mono" id="reverb-decay-text">
              <span className="text-slate-400">Decay Time</span>
              <span className="text-slate-300" style={{ color: reverbEnabled ? theme.accentHex : undefined }}>
                {reverbDecay.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={Math.round(reverbDecay * 10)}
              disabled={!reverbEnabled}
              onChange={(e) => onUpdateReverb(reverbEnabled, reverbMix, parseFloat(e.target.value) / 10)}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-current disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: reverbEnabled ? theme.accentHex : "#475569" }}
              id="reverb-decay-slider"
            />
          </div>
        </div>

      </div>

    </div>
  );
}
