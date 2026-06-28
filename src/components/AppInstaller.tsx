import React, { useState, useEffect } from "react";
import { ThemeConfig } from "../types";
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Info, 
  ChevronRight, 
  Sparkles,
  Share2,
  Check,
  Terminal,
  Cpu
} from "lucide-react";

interface AppInstallerProps {
  theme: ThemeConfig;
}

export default function AppInstaller({ theme }: AppInstallerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [platform, setPlatform] = useState<"pc" | "android" | "ios" | "unknown">("unknown");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    // Detect Platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android/i.test(userAgent)) {
      setPlatform("android");
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setPlatform("ios");
    } else if (/Win|Mac|Linux/.test(userAgent)) {
      setPlatform("pc");
    }

    // Listen for PWA installation prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("'beforeinstallprompt' event was fired.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detect if app is already running in standalone display mode
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const copyCommand = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="flex flex-col space-y-4 p-5" id="app-installer-panel">
      
      {/* Title & Info Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5" id="installer-header">
        <div className="flex items-center space-x-2">
          <Download className="w-4 h-4" style={{ color: theme.accentHex }} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            PWA & App Downloader
          </h3>
        </div>
        <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
          <Smartphone className="w-3 h-3 text-cyan-400" />
          Cross-Platform (PC & Mobile)
        </span>
      </div>

      {/* Main Download Call To Action */}
      <div 
        className="rounded-2xl p-4 border relative overflow-hidden bg-gradient-to-br from-purple-950/20 to-blue-950/20 flex flex-col items-center justify-center text-center space-y-3"
        style={{ borderColor: `${theme.accentHex}20` }}
        id="installer-cta"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="p-3 bg-white/5 rounded-full border border-white/10 relative" id="cta-icon-container">
          <Sparkles className="w-5 h-5 animate-pulse text-purple-400 absolute -top-1 -right-1" />
          {platform === "android" || platform === "ios" ? (
            <Smartphone className="w-8 h-8 text-cyan-400" />
          ) : (
            <Monitor className="w-8 h-8 text-indigo-400" />
          )}
        </div>

        <div>
          <h4 className="text-sm font-bold text-white">
            {isInstalled ? "Dare Player is Installed!" : "Install Dare Player App"}
          </h4>
          <p className="text-[11px] text-slate-400 max-w-[280px] mt-1 mx-auto leading-relaxed">
            {isInstalled 
              ? "You are running Dare Player in desktop mode with direct local storage access, lower power consumption, and offline support."
              : "Install directly on your system tray or home screen. Lightweight, offline-ready, with instant media control integration."}
          </p>
        </div>

        {deferredPrompt ? (
          <button
            onClick={triggerInstall}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-black hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.accentHex }}
            id="install-pwa-btn"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            Install App Now
          </button>
        ) : (
          <div className="w-full py-2 bg-black/30 rounded-xl border border-white/5 text-[11px] text-slate-400" id="non-prompt-status">
            {isInstalled ? (
              <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Running in App Container
              </span>
            ) : (
              <span>Install via browser menu or walkthrough guides below ↘</span>
            )}
          </div>
        )}
      </div>

      {/* Dynamic System Instructions based on detected client */}
      <div className="bg-black/10 rounded-xl p-3 border border-white/5 space-y-2 text-[11px] text-slate-300" id="platform-walkthrough">
        <div className="flex items-center gap-1.5 font-bold text-slate-200" id="walkthrough-title">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quick Install Guide for {platform === "pc" ? "PC / Laptop" : platform === "android" ? "Android Phone" : platform === "ios" ? "iPhone / iPad" : "your Device"}</span>
        </div>

        {platform === "pc" && (
          <ul className="list-disc pl-4 space-y-1 text-slate-400 leading-relaxed">
            <li>On <strong className="text-white font-semibold">Chrome / Edge</strong>: Click the small <strong className="text-white font-semibold">Install Icon ⊞</strong> appearing inside your browser URL bar at the top right, then click Install.</li>
            <li>On <strong className="text-white font-semibold">Firefox / Safari</strong>: Click the browser Options (three dots/lines) and select <strong className="text-white font-semibold">"Install App / Add to Applications"</strong>.</li>
          </ul>
        )}

        {platform === "android" && (
          <ul className="list-disc pl-4 space-y-1 text-slate-400 leading-relaxed">
            <li>On Chrome: Tap the <strong className="text-white font-semibold">three dots menu ⫶</strong> at the top-right corner, then select <strong className="text-white font-semibold">"Install app"</strong> or <strong className="text-white font-semibold">"Add to Home screen"</strong>.</li>
            <li>On Samsung Internet: Tap the bottom menu icon and choose <strong className="text-white font-semibold">"Add page to &gt; App screen"</strong>.</li>
          </ul>
        )}

        {platform === "ios" && (
          <ul className="list-disc pl-4 space-y-1 text-slate-400 leading-relaxed">
            <li>Open this app in <strong className="text-white font-semibold">Safari Browser</strong>.</li>
            <li>Tap the <strong className="text-white font-semibold">Share button <Share2 className="w-3.5 h-3.5 inline text-indigo-400" /></strong> in Safari's bottom toolbar.</li>
            <li>Scroll down and tap <strong className="text-white font-semibold">"Add to Home Screen"</strong>.</li>
          </ul>
        )}

        {platform === "unknown" && (
          <p className="text-slate-400 leading-relaxed">
            Open the browser's main options menu and select "Install App" or "Add to Home Screen" to install Dare Player as a native desktop or mobile client.
          </p>
        )}
      </div>

      {/* Compilation Guide for packaging standalone EXE / APK (Advanced Section) */}
      <div className="flex flex-col space-y-2 pt-2 border-t border-white/5" id="compilation-section">
        <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider" id="compilation-header">
          <Cpu className="w-3.5 h-3.5" style={{ color: theme.accentHex }} />
          <span>Standalone Packaging Guide (EXE & APK)</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed leading-snug">
          To build standard standalone distributables for Google Play Store or native PC installer archives, run the following commands in the workspace root:
        </p>

        {/* Packaging Cards */}
        <div className="grid grid-cols-1 gap-2 text-[10px] font-mono" id="compilation-cards">
          
          {/* Android APK building via Capacitor */}
          <div className="bg-black/25 rounded-xl p-3 border border-white/5 flex flex-col space-y-2" id="apk-build-card">
            <div className="flex justify-between items-center">
              <span className="text-cyan-400 font-bold">1. Native Android APK</span>
              <button 
                onClick={() => copyCommand("npm i @capacitor/core @capacitor/cli && npx cap init DarePlayer com.dare.player && npm run build && npx cap add android && npx cap open android", "apk")}
                className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-400 hover:text-white border border-white/5 transition-all"
              >
                {copiedText === "apk" ? "Copied ✓" : "Copy commands"}
              </button>
            </div>
            <div className="bg-black/40 rounded p-2 text-slate-400 text-[9.5px] leading-relaxed select-all whitespace-pre-wrap flex items-start gap-1.5">
              <Terminal className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
              <span>npm i @capacitor/core @capacitor/cli && npx cap init DarePlayer com.dare.player && npm run build && npx cap add android && npx cap open android</span>
            </div>
          </div>

          {/* PC Desktop App building via Electron */}
          <div className="bg-black/25 rounded-xl p-3 border border-white/5 flex flex-col space-y-2" id="exe-build-card">
            <div className="flex justify-between items-center">
              <span className="text-indigo-400 font-bold">2. Native PC App (EXE/DMG)</span>
              <button 
                onClick={() => copyCommand("npm i -D electron electron-builder && npx electron-packager . DarePlayer --platform=win32 --arch=x64 --out=dist-pc", "exe")}
                className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-400 hover:text-white border border-white/5 transition-all"
              >
                {copiedText === "exe" ? "Copied ✓" : "Copy commands"}
              </button>
            </div>
            <div className="bg-black/40 rounded p-2 text-slate-400 text-[9.5px] leading-relaxed select-all whitespace-pre-wrap flex items-start gap-1.5">
              <Terminal className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
              <span>npm i -D electron-builder && npx electron-packager . DarePlayer --platform=win32 --arch=x64 --out=dist-pc</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
