/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Track, ThemeId, ThemeConfig, EqualizerPreset, EQUALIZER_BANDS, Playlist } from "./types";
import { DEFAULT_TRACKS } from "./data/defaultTracks";
import { THEMES } from "./utils/themes";
import { SynthesizedMusicEngine } from "./utils/SynthesizedMusicEngine";

import ThemeSelector from "./components/ThemeSelector";
import AudioVisualizer from "./components/AudioVisualizer";
import Equalizer from "./components/Equalizer";
import CaptionPlayer from "./components/CaptionPlayer";
import PlaylistManager from "./components/PlaylistManager";
import EffectsRack from "./components/EffectsRack";
import AppInstaller from "./components/AppInstaller";

import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Upload, 
  Disc, 
  Sparkles, 
  Sliders, 
  FileAudio,
  Radio,
  Gauge,
  ListMusic,
  Maximize2
} from "lucide-react";

// Synthetically generate a high-quality stereo white noise reverb impulse response
function createReverbImpulseResponse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * duration));
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const percent = i / length;
    const decayFactor = Math.exp(-percent * decay);
    left[i] = (Math.random() * 2 - 1) * decayFactor;
    right[i] = (Math.random() * 2 - 1) * decayFactor;
  }
  return impulse;
}

export default function App() {
  // Theme state
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>("immersive");
  const theme = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];

  // Playlist & Tracks State
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  
  const [activePlaylistId, setActivePlaylistId] = useState<string>(() => {
    return localStorage.getItem("dare_player_active_playlist_id") || "all";
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem("dare_player_playlists");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: "all", name: "All Library Tracks", trackIds: DEFAULT_TRACKS.map(t => t.id), isEditable: false },
      { id: "favorites", name: "♥️ My Favorites", trackIds: ["midnight-grid", "frost-glass"], isEditable: true },
      { id: "electronic", name: "⚡ High Energy", trackIds: ["cyber-overdrive", "midnight-grid"], isEditable: true },
    ];
  });

  const [activeTrackId, setActiveTrackId] = useState<string>(() => {
    return DEFAULT_TRACKS[0]?.id || "";
  });

  useEffect(() => {
    localStorage.setItem("dare_player_playlists", JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem("dare_player_active_playlist_id", activePlaylistId);
  }, [activePlaylistId]);

  const currentPlaylist = playlists.find((p) => p.id === activePlaylistId) || playlists[0] || { id: "all", name: "All Library Tracks", trackIds: [] };
  const playlistTracks = currentPlaylist.trackIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter((t): t is Track => !!t);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || playlistTracks[0] || tracks[0];

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Equalizer Gains (7 Bands, default Flat)
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  // AI Captions state
  const [captionProvider, setCaptionProvider] = useState<string>("preset");
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState<boolean>(false);

  // Spatial effects states
  const [echoEnabled, setEchoEnabled] = useState<boolean>(false);
  const [echoFeedback, setEchoFeedback] = useState<number>(0.35);
  const [echoTime, setEchoTime] = useState<number>(0.3);

  const [reverbEnabled, setReverbEnabled] = useState<boolean>(false);
  const [reverbMix, setReverbMix] = useState<number>(0.3);
  const [reverbDecay, setReverbDecay] = useState<number>(2.5);

  // Web Audio Nodes and References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[] | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const synthRef = useRef<SynthesizedMusicEngine | null>(null);

  // Effects Node Refs
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayGainNodeRef = useRef<GainNode | null>(null);
  const feedbackGainNodeRef = useRef<GainNode | null>(null);
  const convolverNodeRef = useRef<ConvolverNode | null>(null);
  const reverbGainNodeRef = useRef<GainNode | null>(null);
  const effectsInputRef = useRef<GainNode | null>(null);
  const effectsOutputRef = useRef<GainNode | null>(null);
  
  // Custom synth progress timer
  const synthTimerRef = useRef<any>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
      if (synthRef.current) synthRef.current.stop();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // Initialize Web Audio API on first user interaction (Play)
  const initAudioEngine = () => {
    if (audioCtxRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // 1. Create equalizer cascade of 7 bandpass/peaking filter nodes in series
      const filters: BiquadFilterNode[] = [];
      EQUALIZER_BANDS.forEach((freq, index) => {
        const filter = ctx.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = freq;
        filter.Q.value = 1.4; // select band sharpness
        filter.gain.value = eqGains[index]; // load current slider level
        
        // Chain them up
        if (filters.length > 0) {
          filters[filters.length - 1].connect(filter);
        }
        filters.push(filter);
      });

      // 2. Master Gain volume control node
      const masterGain = ctx.createGain();
      masterGain.gain.value = isMuted ? 0 : volume;
      masterGainRef.current = masterGain;

      // 3. FFT Analyser Node for reactive UI canvas drawing
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // 4. Hook up HTML5 audio element
      const audioEl = audioRef.current;
      if (audioEl) {
        const source = ctx.createMediaElementSource(audioEl);
        source.connect(filters[0]);
      }

      // 4.5 Initialize spatial effects routing nodes
      const effectsInput = ctx.createGain();
      const effectsOutput = ctx.createGain();
      effectsInputRef.current = effectsInput;
      effectsOutputRef.current = effectsOutput;

      // Dry bypass path (always flows clean)
      effectsInput.connect(effectsOutput);

      // Echo (Delay with feedback loop) setup
      const delayNode = ctx.createDelay(2.0);
      const delayGain = ctx.createGain();
      const feedbackGain = ctx.createGain();

      delayNode.delayTime.value = echoTime;
      feedbackGain.gain.value = echoFeedback;
      delayGain.gain.value = echoEnabled ? echoFeedback * 0.8 : 0;

      effectsInput.connect(delayNode);
      delayNode.connect(delayGain);
      delayGain.connect(effectsOutput);
      delayNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);

      delayNodeRef.current = delayNode;
      delayGainNodeRef.current = delayGain;
      feedbackGainNodeRef.current = feedbackGain;

      // Reverb (Synthetic buffer convolution) setup
      const convolverNode = ctx.createConvolver();
      const reverbGain = ctx.createGain();

      try {
        convolverNode.buffer = createReverbImpulseResponse(ctx, reverbDecay, reverbDecay);
      } catch (e) {
        console.error("Failed to build initial reverb buffer:", e);
      }
      reverbGain.gain.value = reverbEnabled ? reverbMix : 0;

      effectsInput.connect(convolverNode);
      convolverNode.connect(reverbGain);
      reverbGain.connect(effectsOutput);

      convolverNodeRef.current = convolverNode;
      reverbGainNodeRef.current = reverbGain;

      // Connect last EQ filter -> spatial effects input -> spatial effects output -> volume booster -> visualizer analyser -> speaker destination
      filters[filters.length - 1].connect(effectsInput);
      effectsOutput.connect(masterGain);
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      filtersRef.current = filters;

      // 5. Instantiate dynamic procedural synthesizer outputting directly to first EQ band
      const synth = new SynthesizedMusicEngine(ctx, filters[0]);
      synthRef.current = synth;

      console.log("Web Audio Graph initialized successfully.");
    } catch (e) {
      console.error("Failed to initialize Web Audio context:", e);
    }
  };

  // Sync EQ changes directly into active audio nodes
  const handleGainChange = (bandIndex: number, value: number) => {
    const updatedGains = [...eqGains];
    updatedGains[bandIndex] = value;
    setEqGains(updatedGains);

    if (filtersRef.current && filtersRef.current[bandIndex] && audioCtxRef.current) {
      const node = filtersRef.current[bandIndex];
      node.gain.setValueAtTime(value, audioCtxRef.current.currentTime);
    }
  };

  // Apply a custom EQ sound preset (Flat, Bass Boost, etc.)
  const handleApplyPreset = (preset: EqualizerPreset) => {
    setEqGains(preset.gains);
    if (filtersRef.current && audioCtxRef.current) {
      preset.gains.forEach((gain, index) => {
        if (filtersRef.current && filtersRef.current[index]) {
          filtersRef.current[index].gain.setValueAtTime(gain, audioCtxRef.current!.currentTime);
        }
      });
    }
  };

  // Handle Playback toggle
  const handlePlay = async () => {
    // 1. Trigger audio context boot safely on click
    initAudioEngine();

    // Ensure audio context is running (resume if suspended by browser security policy)
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    if (isPlaying) {
      handlePauseAction();
    } else {
      setIsPlaying(true);
      
      // Determine if active track is procedural synth or physical MP3 file
      if (activeTrack.url?.startsWith("synth-")) {
        // Stop audio element first
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        // Start Synthesizer Sequencer
        if (synthRef.current) {
          synthRef.current.start(activeTrack.url);
        }

        // Start local time tracking for synth
        if (synthTimerRef.current) clearInterval(synthTimerRef.current);
        synthTimerRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            if (prev >= activeTrack.duration - 1) {
              // Track completed - handle loop or next track
              setTimeout(() => handleNextTrack(), 500);
              return activeTrack.duration;
            }
            return prev + 1;
          });
        }, 1000);

      } else {
        // Physical Audio MP3 File
        if (synthRef.current) {
          synthRef.current.stop();
        }
        if (synthTimerRef.current) {
          clearInterval(synthTimerRef.current);
        }

        if (audioRef.current) {
          audioRef.current.play().catch((e) => {
            console.error("Audio playback error:", e);
          });
        }
      }
    }
  };

  const handlePauseAction = () => {
    setIsPlaying(false);
    
    if (synthRef.current) {
      synthRef.current.stop();
    }
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Skip tracks forward
  const handleNextTrack = () => {
    handlePauseAction();
    if (playlistTracks.length === 0) return;
    const currentIdx = playlistTracks.findIndex((t) => t.id === activeTrackId);
    const nextIdx = (currentIdx + 1) % playlistTracks.length;
    const nextTrack = playlistTracks[nextIdx];
    if (!nextTrack) return;

    setActiveTrackId(nextTrack.id);
    setCurrentTime(0);
    setCaptionProvider(nextTrack.id.startsWith("custom-") ? "fallback" : "preset");

    // Trigger auto play transition
    setTimeout(() => {
      setIsPlaying(true);
      triggerAutoPlay(nextTrack);
    }, 150);
  };

  // Skip tracks backward
  const handlePrevTrack = () => {
    handlePauseAction();
    if (playlistTracks.length === 0) return;
    const currentIdx = playlistTracks.findIndex((t) => t.id === activeTrackId);
    const prevIdx = currentIdx === 0 || currentIdx === -1 ? playlistTracks.length - 1 : currentIdx - 1;
    const prevTrack = playlistTracks[prevIdx];
    if (!prevTrack) return;

    setActiveTrackId(prevTrack.id);
    setCurrentTime(0);
    setCaptionProvider(prevTrack.id.startsWith("custom-") ? "fallback" : "preset");

    // Trigger auto play transition
    setTimeout(() => {
      setIsPlaying(true);
      triggerAutoPlay(prevTrack);
    }, 150);
  };

  const triggerAutoPlay = async (track: Track) => {
    if (!track) return;

    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    if (track.url?.startsWith("synth-")) {
      if (synthRef.current) {
        synthRef.current.start(track.url);
      }
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
      synthTimerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= track.duration - 1) {
            setTimeout(() => handleNextTrack(), 500);
            return track.duration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (audioRef.current) {
        audioRef.current.play().catch((e) => console.log("CORS/play error:", e));
      }
    }
  };

  // Interactive seek progress slider
  const handleSeekChange = (value: number) => {
    setCurrentTime(value);
    
    if (activeTrack.url?.startsWith("synth-")) {
      // For synths, just update the local timeline state
    } else if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  // Handle HTML5 Audio volume slider change
  const handleVolumeChange = (value: number) => {
    setVolume(value);
    setIsMuted(value === 0);

    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(value, audioCtxRef.current.currentTime);
    }
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  // Mute toggle
  const handleMuteToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);

    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(nextMute ? 0 : volume, audioCtxRef.current.currentTime);
    }
    if (audioRef.current) {
      audioRef.current.muted = nextMute;
    }
  };

  // Drag-and-drop / custom file upload logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addUploadedFile(files[0]);
    }
  };

  const addUploadedFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const newTrackId = `custom-${Date.now()}`;
    const newTrack: Track = {
      id: newTrackId,
      title: file.name.replace(/\.[^/.]+$/, ""), // strip file extension
      artist: "Local Studio Import",
      genre: "Uploaded MP3",
      duration: 180, // will load dynamic duration below
      url: url,
      coverUrl: "https://images.unsplash.com/photo-1487180144351-b8472da7a4c3?auto=format&fit=crop&w=300&q=80",
      captions: []
    };

    // Prepend new file into tracklist and set active
    setTracks((prev) => [newTrack, ...prev]);

    setPlaylists((prevPls) => {
      return prevPls.map((pl) => {
        if (pl.id === "all") {
          return { ...pl, trackIds: [newTrackId, ...pl.trackIds] };
        }
        if (pl.id === activePlaylistId && pl.isEditable !== false) {
          return { ...pl, trackIds: [newTrackId, ...pl.trackIds] };
        }
        return pl;
      });
    });

    setActiveTrackId(newTrackId);
    setCurrentTime(0);
    setCaptionProvider("fallback"); // default state before AI synthesis
    handlePauseAction();

    // Give a small interval for HTML audio source setup, then play
    setTimeout(() => {
      handlePlay();
    }, 200);
  };

  // Triggered when HTML5 audio element finishes loading metadata
  const handleLoadedMetadata = () => {
    if (audioRef.current && !activeTrack.url?.startsWith("synth-")) {
      const trackDuration = Math.floor(audioRef.current.duration);
      setTracks((prev) =>
        prev.map((t) =>
          t.id === activeTrackId ? { ...t, duration: trackDuration } : t
        )
      );
    }
  };

  // Update physical audio timestamp
  const handleTimeUpdate = () => {
    if (audioRef.current && !activeTrack.url?.startsWith("synth-")) {
      setCurrentTime(Math.floor(audioRef.current.currentTime));
    }
  };

  // Handle physical audio ended
  const handleAudioEnded = () => {
    handleNextTrack();
  };

  // Gemini AI Caption generator orchestrator
  const handleGenerateAiCaptions = async () => {
    setIsGeneratingCaptions(true);

    try {
      const response = await fetch("/api/generate-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeTrack.title,
          artist: activeTrack.artist,
          genre: activeTrack.genre,
          duration: activeTrack.duration,
        }),
      });

      const data = await response.json();
      if (data.success && data.captions) {
        setTracks((prev) =>
          prev.map((t) =>
            t.id === activeTrackId ? { ...t, captions: data.captions } : t
          )
        );
        setCaptionProvider(data.provider);
      }
    } catch (e) {
      console.error("AI Subtitle error:", e);
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  // --- PLAYLIST ACTIONS ---

  const handleSelectPlaylist = (id: string) => {
    setActivePlaylistId(id);
    const targetPlaylist = playlists.find(p => p.id === id);
    if (targetPlaylist && targetPlaylist.trackIds.length > 0) {
      if (!targetPlaylist.trackIds.includes(activeTrackId)) {
        const firstTrackId = targetPlaylist.trackIds[0];
        setActiveTrackId(firstTrackId);
        setCurrentTime(0);
        setCaptionProvider(firstTrackId.startsWith("custom-") ? "fallback" : "preset");
        handlePauseAction();
      }
    }
  };

  const handleSelectTrack = (trackId: string) => {
    handlePauseAction();
    setActiveTrackId(trackId);
    setCurrentTime(0);
    setCaptionProvider(trackId.startsWith("custom-") ? "fallback" : "preset");
    setTimeout(() => handlePlay(), 150);
  };

  const handleCreatePlaylist = (name: string) => {
    const newId = `playlist-${Date.now()}`;
    const newPlaylist: Playlist = {
      id: newId,
      name,
      trackIds: [],
      isEditable: true
    };
    setPlaylists((prev) => [...prev, newPlaylist]);
    setActivePlaylistId(newId);
  };

  const handleRenamePlaylist = (id: string, name: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => (pl.id === id ? { ...pl, name } : pl))
    );
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((pl) => pl.id !== id));
    if (activePlaylistId === id) {
      setActivePlaylistId("all");
    }
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          return {
            ...pl,
            trackIds: pl.trackIds.filter((id) => id !== trackId)
          };
        }
        return pl;
      })
    );

    // If active track is removed, skip next
    if (activeTrackId === trackId && activePlaylistId === playlistId) {
      const remainingIds = (playlists.find(p => p.id === playlistId)?.trackIds || []).filter(id => id !== trackId);
      if (remainingIds.length > 0) {
        handleNextTrack();
      } else {
        handlePauseAction();
        setCurrentTime(0);
      }
    }
  };

  const handleAddTrackToPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          if (pl.trackIds.includes(trackId)) return pl;
          return {
            ...pl,
            trackIds: [...pl.trackIds, trackId]
          };
        }
        return pl;
      })
    );
  };

  const handleReorderTrack = (playlistId: string, trackId: string, direction: "up" | "down") => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const index = pl.trackIds.indexOf(trackId);
          if (index === -1) return pl;

          const nextTrackIds = [...pl.trackIds];
          if (direction === "up" && index > 0) {
            const temp = nextTrackIds[index - 1];
            nextTrackIds[index - 1] = nextTrackIds[index];
            nextTrackIds[index] = temp;
          } else if (direction === "down" && index < nextTrackIds.length - 1) {
            const temp = nextTrackIds[index + 1];
            nextTrackIds[index + 1] = nextTrackIds[index];
            nextTrackIds[index] = temp;
          }
          return { ...pl, trackIds: nextTrackIds };
        }
        return pl;
      })
    );
  };

  const handleUpdateEcho = (enabled: boolean, feedback: number, time: number) => {
    setEchoEnabled(enabled);
    setEchoFeedback(feedback);
    setEchoTime(time);

    if (audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      if (delayNodeRef.current) {
        delayNodeRef.current.delayTime.setValueAtTime(time, now);
      }
      if (feedbackGainNodeRef.current) {
        feedbackGainNodeRef.current.gain.setValueAtTime(feedback, now);
      }
      if (delayGainNodeRef.current) {
        delayGainNodeRef.current.gain.setValueAtTime(enabled ? feedback * 0.8 : 0, now);
      }
    }
  };

  const handleUpdateReverb = (enabled: boolean, mix: number, decay: number) => {
    const decayChanged = decay !== reverbDecay;
    setReverbEnabled(enabled);
    setReverbMix(mix);
    setReverbDecay(decay);

    if (audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      if (reverbGainNodeRef.current) {
        reverbGainNodeRef.current.gain.setValueAtTime(enabled ? mix : 0, now);
      }
      if (convolverNodeRef.current && decayChanged) {
        try {
          convolverNodeRef.current.buffer = createReverbImpulseResponse(audioCtxRef.current, decay, decay);
        } catch (e) {
          console.error("Failed to update reverb buffer dynamically:", e);
        }
      }
    }
  };

  // Helper: Format seconds to M:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`${theme.bgClass} flex flex-col p-4 md:p-8 relative min-h-screen font-sans`} id="app-root-container">
      {/* Visual neon grid background overlays for Synthwave Theme */}
      {currentThemeId === "synthwave" && (
        <div className="synthwave-grid-bg pointer-events-none z-0" id="retro-wireframe-grid" />
      )}

      {/* Primary layout constraint wrapper */}
      <div className="w-full max-w-6xl mx-auto z-10 flex flex-col space-y-6" id="dashboard-wrapper">
        
        {/* Dynamic Theme Banner Heading */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2" id="app-header">
          <div className="flex items-center space-x-3" id="app-logo-box">
            <div 
              className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-md transition-transform duration-500 hover:rotate-12`}
              style={{ 
                borderColor: theme.accentHex,
                backgroundColor: `${theme.accentHex}1a`
              }}
              id="brand-icon-wrapper"
            >
              <Radio className="w-5 h-5 animate-pulse" style={{ color: theme.accentHex }} id="app-brand-icon" />
            </div>
            <div id="brand-titles">
              <h1 className={`text-xl md:text-2xl font-extrabold ${theme.fontDisplay}`} id="app-name-heading">
                Dare Player
              </h1>
              <p className={`${theme.fontMono} text-[10px] tracking-widest`} id="app-tagline">
                Professional Playlists & EQ Engine
              </p>
            </div>
          </div>

          {/* Quick Stats or status line */}
          <div className="flex items-center space-x-4 text-xs font-mono" id="header-telemetry">
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-400">Audio System:</span> 
              <span className="text-white font-semibold">Active</span>
            </span>
          </div>
        </header>

        {/* Dashboard Grid columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-columns-grid">
          
          {/* LEFT PANEL: Playlist & Active Music Deck (7 cols) */}
          <section className="lg:col-span-5 flex flex-col space-y-6" id="left-control-panel">
            
            {/* Theme Aesthetic Changer */}
            <div className={theme.cardClass} id="theme-selector-card">
              <ThemeSelector 
                currentThemeId={currentThemeId} 
                onThemeSelect={setCurrentThemeId} 
                activeThemeConfig={theme}
              />
            </div>

            {/* Now Playing visual deck */}
            <div className={`${theme.cardClass} flex flex-col space-y-5`} id="now-playing-deck-card">
              
              {/* Cover Art and Vinyl simulation container */}
              <div className="flex flex-col md:flex-row md:items-center gap-5" id="deck-track-details">
                {/* Vinyl Disc Container */}
                <div className="relative mx-auto md:mx-0 w-32 h-32 shrink-0 flex items-center justify-center" id="vinyl-disc-container">
                  {currentThemeId === "immersive" && (
                    <div className="absolute -inset-6 bg-purple-600/35 blur-[35px] rounded-full pointer-events-none" />
                  )}
                  {/* Decorative record grooves */}
                  <div 
                    className={`absolute inset-0 rounded-full bg-zinc-950 border-4 border-zinc-800 flex items-center justify-center shadow-lg overflow-hidden ${
                      isPlaying && theme.vinylAnimate ? "animate-spin-vinyl" : ""
                    }`}
                    id="vinyl-record"
                  >
                    {/* Concentric sound groove lines */}
                    <div className="absolute inset-2 border border-zinc-800/40 rounded-full" />
                    <div className="absolute inset-5 border border-zinc-900 rounded-full" />
                    <div className="absolute inset-8 border border-zinc-800 rounded-full" />
                    <div className="absolute inset-11 border border-zinc-900 rounded-full" />

                    {/* Album Art center sticker */}
                    <div className="w-12 h-12 rounded-full border-2 border-zinc-900 overflow-hidden relative z-10" id="vinyl-art-sticker">
                      <img 
                        src={activeTrack.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80"} 
                        alt="Sticker Art" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Turntable needle armature element */}
                  <div 
                    className="absolute -top-1 -right-2 w-14 h-16 origin-top-left transition-transform duration-700 pointer-events-none z-20"
                    style={{
                      transform: isPlaying ? "rotate(18deg)" : "rotate(-12deg)"
                    }}
                    id="vinyl-armature"
                  >
                    <div className="w-1.5 h-12 bg-slate-400 border border-slate-500 rounded-full shadow-sm" />
                    <div className="w-3 h-4 bg-slate-600 rounded-sm absolute bottom-0 -left-1" />
                  </div>
                </div>

                {/* Track Metadata description */}
                <div className="text-center md:text-left flex-1 min-w-0" id="metadata-header">
                  <span 
                    className="inline-block text-[9px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 bg-black/25 border border-white/5"
                    style={{ color: theme.accentHex }}
                  >
                    {activeTrack.genre}
                  </span>
                  <h2 className={`text-lg md:text-xl font-bold truncate ${theme.id === 'cyberpunk' ? 'text-yellow-300' : ''}`} id="current-track-title">
                    {activeTrack.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-1" id="current-track-artist">
                    <span>by {activeTrack.artist}</span>
                  </p>
                  
                  {/* Indicator if synthesized or physical */}
                  <div className="mt-3 flex items-center justify-center md:justify-start gap-1 text-[9px] font-mono text-slate-500" id="track-delivery-stat">
                    <FileAudio className="w-3 h-3" />
                    <span>Playback Route: {activeTrack.url?.startsWith("synth-") ? "Procedural Audio Synthesizer Node" : "Standard PCM Stream Decode"}</span>
                  </div>
                </div>
              </div>

              {/* Progress Slider Bar */}
              <div className="flex flex-col space-y-1.5 pt-2" id="timeline-scrubber">
                <input
                  type="range"
                  min="0"
                  max={activeTrack.duration}
                  value={currentTime}
                  onChange={(e) => handleSeekChange(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-current"
                  style={currentThemeId === "immersive" ? { 
                    backgroundImage: `linear-gradient(to right, #a855f7 ${((currentTime) / (activeTrack.duration || 1)) * 100}%, rgba(255, 255, 255, 0.1) ${((currentTime) / (activeTrack.duration || 1)) * 100}%)`,
                    accentColor: '#a855f7'
                  } : { color: theme.accentHex }}
                  id="seek-slider"
                />
                
                <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5" id="timeline-metrics">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(activeTrack.duration)}</span>
                </div>
              </div>

              {/* Main Deck Playback Controls */}
              <div className="flex items-center justify-between bg-black/10 rounded-2xl p-4 border border-white/5" id="playback-controls-rack">
                
                {/* Volume bar cluster */}
                <div className="flex items-center space-x-2 w-28" id="volume-rack">
                  <button 
                    onClick={handleMuteToggle}
                    className="text-slate-400 hover:text-white transition-colors"
                    id="volume-mute-btn"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-current"
                    style={{ color: theme.accentHex }}
                    id="volume-slider"
                  />
                </div>

                {/* Navigation and center buttons */}
                <div className="flex items-center space-x-3" id="transport-btns">
                  <button
                    onClick={handlePrevTrack}
                    className="p-2 rounded-full hover:bg-white/5 text-slate-300 hover:text-white transition-all cursor-pointer"
                    id="prev-track-btn"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handlePlay}
                    id="play-pause-btn"
                    className={`p-3.5 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 ${
                      currentThemeId === "immersive" 
                        ? "bg-gradient-to-tr from-purple-500 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-white/10" 
                        : "shadow-md"
                    }`}
                    style={currentThemeId === "immersive" ? undefined : { 
                      backgroundColor: theme.accentHex,
                      color: "#fff"
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-white" />
                    ) : (
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={handleNextTrack}
                    className="p-2 rounded-full hover:bg-white/5 text-slate-300 hover:text-white transition-all cursor-pointer"
                    id="next-track-btn"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                {/* File Upload Studio trigger */}
                <div className="relative cursor-pointer hover:scale-105 transition-transform" id="file-uploader-box">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    id="studio-file-input"
                  />
                  <div 
                    className="p-2 rounded-lg border flex items-center justify-center bg-white/5 hover:bg-white/10"
                    style={{ borderColor: `${theme.accentHex}40` }}
                    id="uploader-ui-btn"
                  >
                    <Upload className="w-4 h-4" style={{ color: theme.accentHex }} />
                  </div>
                </div>
              </div>

            </div>

            {/* Studio Playlist Tracks card */}
            <div className={theme.cardClass} id="playlist-card">
              <PlaylistManager
                tracks={tracks}
                playlists={playlists}
                activePlaylistId={activePlaylistId}
                activeTrackId={activeTrackId}
                isPlaying={isPlaying}
                theme={theme}
                onSelectPlaylist={handleSelectPlaylist}
                onSelectTrack={handleSelectTrack}
                onCreatePlaylist={handleCreatePlaylist}
                onRenamePlaylist={handleRenamePlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
                onAddTrackToPlaylist={handleAddTrackToPlaylist}
                onReorderTrack={handleReorderTrack}
              />
            </div>

          </section>

          {/* RIGHT PANEL: Equalizer & Visualizer & Subtitles (7 cols) */}
          <section className="lg:col-span-7 flex flex-col space-y-6" id="right-control-panel">
            
            {/* Visualizer Rack */}
            <div className={`${theme.cardClass} p-4 flex flex-col`} id="visualizer-card">
              <div className="flex items-center justify-between mb-2.5" id="visualizer-header-bar">
                <div className="flex items-center space-x-2">
                  <Gauge className="w-4 h-4" style={{ color: theme.accentHex }} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Real-time Signal Analyser
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 uppercase">
                  FFT SIZE: 256 BINS
                </span>
              </div>
              
              {/* Responsive Interactive Canvas */}
              <AudioVisualizer 
                analyser={analyserRef.current} 
                theme={theme}
                isPlaying={isPlaying}
              />
            </div>

            {/* Equalizer sliders */}
            <div className={theme.cardClass} id="equalizer-card-wrapper">
              <Equalizer 
                gains={eqGains} 
                onGainChange={handleGainChange} 
                onApplyPreset={handleApplyPreset} 
                theme={theme}
              />
            </div>

            {/* Spatial Effects Processor */}
            <div className={theme.cardClass} id="effects-card-wrapper">
              <EffectsRack
                echoEnabled={echoEnabled}
                echoFeedback={echoFeedback}
                echoTime={echoTime}
                reverbEnabled={reverbEnabled}
                reverbMix={reverbMix}
                reverbDecay={reverbDecay}
                theme={theme}
                onUpdateEcho={handleUpdateEcho}
                onUpdateReverb={handleUpdateReverb}
              />
            </div>

            {/* Captions subtitles rack */}
            <div className={theme.cardClass} id="captions-card-wrapper">
              <CaptionPlayer 
                captions={activeTrack.captions || []} 
                currentTime={currentTime} 
                onGenerateAiCaptions={handleGenerateAiCaptions}
                isGenerating={isGeneratingCaptions} 
                trackTitle={activeTrack.title} 
                provider={captionProvider}
                theme={theme}
              />
            </div>

            {/* App Installer & Downloader Card */}
            <div className={theme.cardClass} id="installer-card-wrapper">
              <AppInstaller theme={theme} />
            </div>

          </section>
        </div>

        {/* Studio bottom credit line */}
        <footer className="pt-4 border-t border-white/5 text-center flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 font-mono" id="app-footer">
          <span>&copy; 2026 Dare Player Co. All sound processing occurs on-device.</span>
          <span>Powered by Gemini 3.5 Flash Client Bridge</span>
        </footer>

      </div>

      {/* Hidden HTML5 Audio Element for physical local MP3 playing */}
      <audio
        ref={audioRef}
        src={activeTrack.url?.startsWith("synth-") ? undefined : activeTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        className="hidden"
        id="physical-audio-node"
      />
    </div>
  );
}
