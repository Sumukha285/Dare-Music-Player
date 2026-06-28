import React from "react";
import { ThemeConfig, ThemeId } from "../types";
import { THEMES } from "../utils/themes";
import { Palette, Check } from "lucide-react";

interface ThemeSelectorProps {
  currentThemeId: ThemeId;
  onThemeSelect: (themeId: ThemeId) => void;
  activeThemeConfig: ThemeConfig;
}

export default function ThemeSelector({ currentThemeId, onThemeSelect, activeThemeConfig }: ThemeSelectorProps) {
  return (
    <div className="flex flex-col space-y-3" id="theme-selector-panel">
      <div className="flex items-center space-x-2 pb-1 border-b border-white/5" id="theme-selector-header">
        <Palette className="w-4 h-4" style={{ color: activeThemeConfig.accentHex }} id="palette-icon" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400" id="theme-selector-title">
          Choose Player Aesthetic Theme
        </h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" id="themes-grid">
        {THEMES.map((theme) => {
          const isActive = theme.id === currentThemeId;
          
          return (
            <button
              key={theme.id}
              onClick={() => onThemeSelect(theme.id)}
              id={`theme-btn-${theme.id}`}
              className={`flex items-center justify-between p-2.5 rounded-xl text-left border cursor-pointer select-none transition-all duration-300 ${
                isActive
                  ? "bg-white/10 shadow-sm font-semibold"
                  : "bg-black/10 hover:bg-white/5 border-transparent text-slate-400"
              }`}
              style={{
                borderColor: isActive ? theme.accentHex : "rgba(255, 255, 255, 0.05)"
              }}
            >
              <div className="flex items-center space-x-2" id={`theme-info-${theme.id}`}>
                <span className="text-base select-none">{theme.emoji}</span>
                <span className="text-xs tracking-tight truncate">{theme.name}</span>
              </div>

              {isActive && (
                <Check 
                  className="w-3.5 h-3.5 shrink-0" 
                  style={{ color: theme.accentHex }} 
                  id={`theme-check-${theme.id}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
