import React from "react";
import { EqualizerPreset, EQUALIZER_BANDS, ThemeConfig } from "../types";
import { Sliders, Zap, RotateCcw } from "lucide-react";

interface EqualizerProps {
  gains: number[]; // 7 numbers representing -12 to 12
  onGainChange: (bandIndex: number, value: number) => void;
  onApplyPreset: (preset: EqualizerPreset) => void;
  theme: ThemeConfig;
}

const PRESETS: EqualizerPreset[] = [
  { name: "Flat", gains: [0, 0, 0, 0, 0, 0, 0] },
  { name: "Bass Boost", gains: [9, 6, 2, 0, -1, -2, -3] },
  { name: "Treble Boost", gains: [-3, -2, -1, 1, 4, 7, 9] },
  { name: "Vocal Clear", gains: [-4, -1, 3, 6, 5, 2, -2] },
  { name: "Electronic", gains: [7, 5, -2, 1, 3, 5, 7] },
  { name: "Acoustic", gains: [3, 1, 2, 3, 3, 2, 2] },
  { name: "Cyber Scoop", gains: [6, -3, -5, -2, 4, 6, 8] }
];

export default function Equalizer({ gains, onGainChange, onApplyPreset, theme }: EqualizerProps) {
  
  // Group frequency bands into readable labels
  const getBandLabel = (freq: number) => {
    if (freq < 250) return "Bass";
    if (freq < 4000) return "Mid";
    return "Treble";
  };

  const getFreqString = (freq: number) => {
    return freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`;
  };

  const isPresetActive = (presetGains: number[]) => {
    return gains.every((v, i) => Math.abs(v - presetGains[i]) < 0.1);
  };

  return (
    <div className="w-full flex flex-col space-y-4" id="equalizer-container">
      {/* Equalizer Title & Presets bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3" id="equalizer-header">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4" style={{ color: theme.accentHex }} id="equalizer-icon" />
          <h3 className={`text-sm font-semibold tracking-wide ${theme.id === 'cyberpunk' ? 'text-yellow-300' : ''}`} id="equalizer-title">
            Professional 7-Band Parametric EQ
          </h3>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5" id="presets-container">
          {PRESETS.map((preset) => {
            const active = isPresetActive(preset.gains);
            return (
              <button
                key={preset.name}
                onClick={() => onApplyPreset(preset)}
                id={`preset-btn-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`text-[10px] px-2.5 py-1 rounded-md transition-all duration-300 ${
                  active
                    ? theme.id === 'immersive'
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.5)] border border-transparent"
                      : `${theme.equalizerColor} text-white font-semibold shadow-sm`
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vertical Slider Grid */}
      <div className="grid grid-cols-7 gap-2 md:gap-4 h-56 pt-2 bg-black/10 rounded-xl p-4 border border-white/5" id="sliders-grid">
        {EQUALIZER_BANDS.map((freq, index) => {
          const gain = gains[index];
          const label = getBandLabel(freq);
          
          return (
            <div key={freq} className="flex flex-col items-center h-full justify-between" id={`eq-band-${freq}`}>
              {/* dB Value Label */}
              <span className="text-[10px] font-mono font-medium tracking-tighter" style={{ color: gain > 0 ? theme.accentHex : undefined }}>
                {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}dB
              </span>

              {/* Slider Track with fill */}
              <div className="relative w-2 h-36 bg-white/10 rounded-full flex justify-center group cursor-pointer" id={`track-container-${freq}`}>
                {/* Visual reactive level line connecting sliders */}
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={gain}
                  onChange={(e) => onGainChange(index, parseFloat(e.target.value))}
                  orient="vertical" // standard for vertical inputs
                  style={{
                    WebkitAppearance: "slider-vertical",
                    writingMode: "bt-lr"
                  } as any}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id={`eq-slider-${freq}`}
                />

                {/* Styled slider track track fill */}
                <div 
                  className={`absolute bottom-0 w-full rounded-full transition-all duration-150 ${
                    theme.id === 'immersive' 
                      ? "bg-gradient-to-t from-purple-500 to-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]" 
                      : theme.equalizerColor
                  }`}
                  style={{ 
                    height: `${((gain + 12) / 24) * 100}%` 
                  }}
                  id={`eq-fill-${freq}`}
                />

                {/* Thumb Slider Indicator */}
                <div 
                  className="absolute w-4 h-4 rounded-full bg-white shadow-md border-2 pointer-events-none group-hover:scale-110 transition-transform flex items-center justify-center"
                  style={{ 
                    borderColor: theme.accentHex,
                    bottom: `calc(${((gain + 12) / 24) * 100}% - 8px)` 
                  }}
                  id={`eq-thumb-${freq}`}
                >
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.accentHex }} />
                </div>
              </div>

              {/* Frequency Text (e.g., 60Hz, 1kHz) */}
              <div className="text-center flex flex-col space-y-0.5" id={`freq-meta-${freq}`}>
                <span className="text-[10px] font-semibold font-mono tracking-tighter">
                  {getFreqString(freq)}
                </span>
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Technical equalizer descriptive stats */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-1" id="eq-footer">
        <div className="flex items-center space-x-1.5">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>EQ Output Range: ±12dB Gain</span>
        </div>
        <button 
          onClick={() => onApplyPreset({ name: "Flat", gains: [0, 0, 0, 0, 0, 0, 0] })}
          className="hover:text-white flex items-center space-x-1 transition-colors"
          id="reset-eq-btn"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset EQ</span>
        </button>
      </div>
    </div>
  );
}
