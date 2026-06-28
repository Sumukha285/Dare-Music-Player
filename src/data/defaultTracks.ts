import { Track } from "../types";

export const DEFAULT_TRACKS: Track[] = [
  {
    id: "midnight-grid",
    title: "Midnight Grid Cruise",
    artist: "RetroRunner",
    genre: "Synthwave / Outrun",
    duration: 154,
    url: "synth-outrun",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
    captions: [
      { time: 0, text: "🌌 [0:00] Ignition. The dashboard backlight glows orange." },
      { time: 5, text: "🚗 [0:05] Cruising down the wireframe retro gridway at 120 BPM..." },
      { time: 15, text: "🎵 [0:15] Low-end analog oscillators begin their rhythmic pulse." },
      { time: 25, text: "✨ [0:25] Neon cyan and pink streetlights flash in the rearview mirror." },
      { time: 40, text: "🎹 [0:40] Brass-like polyphonic synthesizers join the main melody!" },
      { time: 55, text: "🌅 [0:55] A vector sun sets slowly over an endless virtual ocean." },
      { time: 70, text: "⚡ [1:10] Filtering sweep... Soundscape opens into the highway chorus!" },
      { time: 88, text: "🏎️ [1:28] High speed lane engaged. Adjust your equalizer for maximum bass boost." },
      { time: 105, text: "🌟 [1:45] Retro arpeggiators sparkle across the soundstage." },
      { time: 120, text: "🥁 [2:00] Snares echoing into the cosmic night." },
      { time: 135, text: "🍂 [2:15] Heading into the final stretch... The grid slowly fades." },
      { time: 148, text: "🔇 [2:28] Outro. Speedometer settles back to zero. Engine off." }
    ]
  },
  {
    id: "ethereal-moss",
    title: "Ethereal Moss Dance",
    artist: "Sylvan Whisper",
    genre: "Ambient Folktronica",
    duration: 120,
    url: "synth-forest",
    coverUrl: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=300&q=80",
    captions: [
      { time: 0, text: "🌲 [0:00] Crisp forest air. Deeps woodland echoes begin." },
      { time: 6, text: "🍃 [0:06] Soft wooden chime sounds dance playfully in the canopy." },
      { time: 16, text: "💧 [0:16] A gentle, sparkling water stream is synthesized in real time." },
      { time: 26, text: "🍂 [0:26] Deep organic low-pass drone establishes a natural foundation." },
      { time: 38, text: "🪈 [0:38] Echoing woodwind melody floats on the morning breeze." },
      { time: 52, text: "☀️ [0:52] Rays of golden sunshine pierce through the redwood trees." },
      { time: 68, text: "🌿 [1:08] Double-beat wooden percussion mimics a soft forest heartbeat." },
      { time: 84, text: "🌟 [1:24] Harmonious whistles soar, blending with the organic visualizer." },
      { time: 100, text: "🍄 [1:40] Melody gently breaks down, leaving only the sound of water." },
      { time: 114, text: "🍃 [1:54] A single dry leaf falls. Soundscape settles back into the moss." }
    ]
  },
  {
    id: "gilded-ballroom",
    title: "Gilded Ballroom Waltz",
    artist: "Majestic Ensemble",
    genre: "Classical Crossover",
    duration: 160,
    url: "synth-royal",
    coverUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=300&q=80",
    captions: [
      { time: 0, text: "🎻 [0:00] Warm strings tuning up in the gilded concert hall." },
      { time: 8, text: "🏰 [0:08] The royal waltz starts in 3/4 time. Stately, elegant." },
      { time: 18, text: "🎹 [0:18] Harpsichord notes pluck with mechanical baroque beauty." },
      { time: 32, text: "👑 [0:32] Violins soar into the high frequencies. Pristine treble." },
      { time: 50, text: "🎺 [0:50] Orchestral brass fanfares join the noble choreography." },
      { time: 65, text: "💃 [1:05] Dancers in gold-woven velvet twirl under crystal chandeliers." },
      { time: 82, text: "🎼 [1:22] A dramatic minor-key transition. Contrast and passion!" },
      { time: 100, text: "✨ [1:40] Peak orchestral crescendo! Feel the high mid presence." },
      { time: 118, text: "🏰 [1:58] Gentle string-only breakdown. A private ballroom whisper." },
      { time: 135, text: "🍂 [2:15] The final cadence rolls in. Guests curtsy and bow." },
      { time: 152, text: "🏛️ [2:32] Echo of applause in the hall... Silence returns." }
    ]
  },
  {
    id: "cyber-overdrive",
    title: "Neon Cyber Overdrive",
    artist: "GL1TCH_M4ST3R",
    genre: "Cyberpunk Techno",
    duration: 180,
    url: "synth-cyber",
    coverUrl: "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?auto=format&fit=crop&w=300&q=80",
    captions: [
      { time: 0, text: "⚡ [0:00] SYSTEM ROOT: Cybernetic audio node initialized." },
      { time: 5, text: "🤖 [0:05] Decoding incoming neural wave feed... [98% Complete]" },
      { time: 12, text: "🔊 [0:12] Sub-bass surge! Deep industrial kick hits the circuit board." },
      { time: 24, text: "👾 [0:24] Acid synth filter opening. Resonance set to self-oscillate." },
      { time: 36, text: "🛑 [0:36] Glitched breakdown: High frequency bitcrusher active." },
      { time: 48, text: "💥 [0:48] Beat drops! 140 BPM cybernetic rhythm drives forward." },
      { time: 64, text: "☢️ [1:04] Overdrive circuit triggered. Dial back Mid-range for scoop effect." },
      { time: 82, text: "🛰️ [1:22] Satellite telemetry signal intercepted. High beep loops." },
      { time: 100, text: "🔥 [1:40] Core temperature threshold exceeded. Amplifiers hot!" },
      { time: 120, text: "🧠 [2:00] Synthetic neural vox lines whisper coded passwords." },
      { time: 140, text: "🎛️ [2:20] Final turbo bass sequence engaged. Maximum pressure." },
      { time: 160, text: "🔌 [2:40] Decelerating generator speed. Power grid draining..." },
      { time: 175, text: "🔌 [2:55] Connection lost. Terminal offline." }
    ]
  },
  {
    id: "frost-glass",
    title: "Frost Glass Serenade",
    artist: "AeroSpace",
    genre: "Minimalist Chillout",
    duration: 140,
    url: "synth-chill",
    coverUrl: "https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=300&q=80",
    captions: [
      { time: 0, text: "❄️ [0:00] Pure, frozen silence. Prismatic glass bells chime." },
      { time: 10, text: "🌬️ [0:10] A smooth, warm sub-bass pad warms up the frozen room." },
      { time: 25, text: "💎 [0:25] Minimalist click percussion starts ticking in a steady groove." },
      { time: 45, text: "🫧 [0:45] Glassmorphic clarity. Equalizer highs sound crystalline." },
      { time: 65, text: "🚀 [1:05] Celestial chords sweep in, simulating a slow-motion weightless drift." },
      { time: 85, text: "🌌 [1:25] A quiet pause. Only the crystalline bells remain." },
      { time: 105, text: "🌊 [1:45] Ambient swell returns for a final heartwarming hug." },
      { time: 125, text: "🌬️ [2:05] Ice particles melting. Chords softly evaporate." },
      { time: 136, text: "🔇 [2:16] The frozen dream settles. Silence." }
    ]
  }
];
