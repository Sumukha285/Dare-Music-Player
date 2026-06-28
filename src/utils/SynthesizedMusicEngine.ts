export class SynthesizedMusicEngine {
  private ctx: AudioContext;
  private destination: AudioNode;
  private isRunning: boolean = false;
  private intervalId: any = null;
  private activeNodes: { node: AudioNode; stopTime: number }[] = [];
  private currentStep: number = 0;
  private nextNoteTime: number = 0;
  private trackType: string = "";

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
  }

  public start(trackType: string) {
    if (this.isRunning) {
      this.stop();
    }

    this.isRunning = true;
    this.trackType = trackType;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime;
    
    // Start the sequencer loop
    const schedulerInterval = 50; // ms
    this.intervalId = setInterval(() => {
      this.scheduler();
    }, schedulerInterval);
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Stop and disconnect all active nodes immediately to prevent hanging notes
    const now = this.ctx.currentTime;
    this.activeNodes.forEach((item) => {
      try {
        if ('stop' in item.node) {
          (item.node as any).stop(now);
        }
        item.node.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeNodes = [];
  }

  private scheduler() {
    // Schedule ahead of time by 100ms
    const scheduleAheadTime = 0.1;
    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime && this.isRunning) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }
    
    // Cleanup expired active nodes
    const now = this.ctx.currentTime;
    this.activeNodes = this.activeNodes.filter((item) => {
      if (item.stopTime < now) {
        try {
          item.node.disconnect();
        } catch (e) {}
        return false;
      }
      return true;
    });
  }

  private advanceStep() {
    let tempo = 120; // BPM
    if (this.trackType === 'synth-outrun') tempo = 120;
    else if (this.trackType === 'synth-forest') tempo = 75;
    else if (this.trackType === 'synth-royal') tempo = 95;
    else if (this.trackType === 'synth-cyber') tempo = 135;
    else if (this.trackType === 'synth-chill') tempo = 85;

    const secondsPerBeat = 60.0 / tempo;
    const stepDuration = secondsPerBeat / 2; // Eighth notes
    this.nextNoteTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduleStep(step: number, time: number) {
    if (this.trackType === 'synth-outrun') {
      this.playOutrunStep(step, time);
    } else if (this.trackType === 'synth-forest') {
      this.playForestStep(step, time);
    } else if (this.trackType === 'synth-royal') {
      this.playRoyalStep(step, time);
    } else if (this.trackType === 'synth-cyber') {
      this.playCyberStep(step, time);
    } else if (this.trackType === 'synth-chill') {
      this.playChillStep(step, time);
    }
  }

  // --- 1. SYNTHWAVE / OUTRUN STYLE ---
  private playOutrunStep(step: number, time: number) {
    // Outrun Bassline: steady driving eighth notes
    const bassScale = [110, 110, 110, 110, 130.81, 130.81, 146.83, 146.83, 98.0, 98.0, 98.0, 98.0, 110, 110, 110, 110]; // A2, C3, D3, G2, A2
    const freq = bassScale[step];
    
    this.triggerBass(freq, 0.22, 'sawtooth', time, 150);

    // Kick and Snare Drums simulated with custom envelopes
    if (step % 4 === 0) {
      this.triggerKick(time);
    } else if (step % 4 === 2) {
      this.triggerSnare(time);
    }

    // Lead Arpeggio
    const leadNotes = [220, 261.63, 329.63, 392.0, 440, 523.25, 659.25, 783.99]; // A Minor Chord Arp
    if (step % 2 === 0) {
      const arpIndex = (step / 2) % leadNotes.length;
      const noteFreq = leadNotes[arpIndex] * (step > 8 ? 2 : 1); // alternate octaves
      this.triggerSynthLead(noteFreq, 0.15, 'triangle', time, 1000);
    }
  }

  // --- 2. AMBIENT FOREST STYLE ---
  private playForestStep(step: number, time: number) {
    // Deep wind/atmosphere drone pads (trigger occasionally for long times)
    if (step === 0) {
      this.triggerBass(146.83, 4.5, 'sine', time, 200); // D3
      this.triggerBass(220.00, 4.5, 'sine', time, 300); // A3
    } else if (step === 8) {
      this.triggerBass(164.81, 4.5, 'sine', time, 200); // E3
    }

    // Wooden Flute/Chime (Pentatonic Scale: D4, F4, G4, A4, C5, D5)
    const forestChimes = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33];
    const triggerProb = 0.35;
    if (Math.random() < triggerProb && step % 2 === 0) {
      const note = forestChimes[Math.floor(Math.random() * forestChimes.length)];
      this.triggerChime(note, 0.8, time, 0.08);
    }

    // Soft simulated forest water drip
    if (Math.random() < 0.2) {
      this.triggerDrip(time);
    }
  }

  // --- 3. ROYAL BALLROOM WALTZ STYLE ---
  private playRoyalStep(step: number, time: number) {
    // Waltz rhythm: 3 beats (Step 0, 3, 6, 9, 12, 15...)
    // Beat 1: Root Bass, Beat 2: Chord, Beat 3: Chord
    const scale = [130.81, 164.81, 196.00]; // C, E, G
    const progression = [130.81, 146.83, 164.81, 196.00]; // C, D, E, G roots
    const rootIndex = Math.floor(step / 4) % progression.length;
    const rootFreq = progression[rootIndex];

    const measureStep = step % 6; // 6 step waltz cycle
    
    if (measureStep === 0) {
      // Beat 1: Strong Cello/Bass
      this.triggerBass(rootFreq, 0.6, 'triangle', time, 300);
      this.triggerBass(rootFreq * 2, 0.6, 'sine', time, 400);
    } else if (measureStep === 2 || measureStep === 4) {
      // Beat 2 & 3: Plucked Harpsichord chords
      this.triggerHarpsichord(rootFreq * 2, time, 0.05);
      this.triggerHarpsichord(rootFreq * 2.5, time + 0.01, 0.04);
      this.triggerHarpsichord(rootFreq * 3, time + 0.02, 0.05);
    }

    // Soaring high string melody
    const royalMelody = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50]; // C Major scale
    if (step % 2 === 0 && Math.random() < 0.6) {
      const melodyNote = royalMelody[(step + rootIndex) % royalMelody.length];
      this.triggerSynthLead(melodyNote, 0.4, 'sine', time, 1200, 0.04);
    }
  }

  // --- 4. CYBERPUNK TECHNO STYLE ---
  private playCyberStep(step: number, time: number) {
    // Intense distorted bass growl alternating roots
    const cyberBass = [73.42, 73.42, 82.41, 73.42, 110.0, 73.42, 65.41, 73.42]; // D2, E2, A2, C2
    const freq = cyberBass[step % cyberBass.length];
    
    // Heavy modulated bass
    this.triggerCyberBass(freq, 0.18, time);

    // Hard Electronic Beat
    if (step % 4 === 0) {
      this.triggerHeavyKick(time);
    }
    
    if (step % 4 === 2) {
      this.triggerSnare(time);
    } else if (step % 2 === 1) {
      // Cyber hihats
      this.triggerHihat(time);
    }

    // Random computer/telemetry glitch bleeps
    if (Math.random() < 0.15) {
      const bleepFreq = 1500 + Math.random() * 2000;
      this.triggerSynthLead(bleepFreq, 0.05, 'sawtooth', time, 8000, 0.01);
    }
  }

  // --- 5. FROST GLASS CHILL STYLE ---
  private playChillStep(step: number, time: number) {
    // Warm soothing sub bass chords
    const padProgression = [110.00, 110.00, 130.81, 146.83, 164.81, 164.81, 146.83, 130.81]; // A2, C3, D3, E3
    const rootPad = padProgression[Math.floor(step / 2) % padProgression.length];
    if (step % 4 === 0) {
      this.triggerBass(rootPad, 1.2, 'sine', time, 100);
      this.triggerBass(rootPad * 1.5, 1.2, 'sine', time, 150);
    }

    // Sparkling crystalline triangle glass bells (Pentatonic)
    const glassScale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66]; // High C, D, E, G, A
    if (step % 2 === 0 && Math.random() < 0.5) {
      const bellNote = glassScale[Math.floor(Math.random() * glassScale.length)];
      this.triggerChime(bellNote, 1.5, time, 0.05, 0.8);
    }

    // Minimal click/cabasa tick
    if (step % 2 === 0) {
      this.triggerHihat(time, 0.01, 12000);
    }
  }

  // ========================
  // SYNTHESIZER VOICES & INSTRUMENTS
  // ========================

  private registerNode(node: AudioNode, stopTime: number) {
    this.activeNodes.push({ node, stopTime });
  }

  // Standard Synthesizer Lead
  private triggerSynthLead(freq: number, duration: number, type: OscillatorType, time: number, filterFreq: number, gainVal: number = 0.06) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    // Filter envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, time);
    filter.frequency.exponentialRampToValueAtTime(filterFreq / 4, time + duration);

    // Volume envelope
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(gainVal, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.destination);

    osc.start(time);
    osc.stop(time + duration);

    this.registerNode(osc, time + duration);
    this.registerNode(gainNode, time + duration);
  }

  // Driving Bass Synthesizer
  private triggerBass(freq: number, duration: number, type: OscillatorType, time: number, filterFreq: number) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + duration);

    // Bass Envelope: punchy start, decay down
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.12, time + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.destination);

    osc.start(time);
    osc.stop(time + duration);

    this.registerNode(osc, time + duration);
    this.registerNode(gainNode, time + duration);
  }

  // Cyber Distorted Modulated Bass
  private triggerCyberBass(freq: number, duration: number, time: number) {
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq / 2, time); // deep sub

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(100, time);
    filter.frequency.linearRampToValueAtTime(800, time + 0.05);
    filter.frequency.exponentialRampToValueAtTime(80, time + duration);
    filter.Q.setValueAtTime(4.0, time);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.2, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.destination);

    osc.start(time);
    osc.stop(time + duration);
    subOsc.start(time);
    subOsc.stop(time + duration);

    this.registerNode(osc, time + duration);
    this.registerNode(subOsc, time + duration);
    this.registerNode(gainNode, time + duration);
  }

  // Bell/Glass chime with sweet sine/triangle rings
  private triggerChime(freq: number, duration: number, time: number, attack: number = 0.01, gainMultiplier: number = 0.05) {
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2.01, time); // slightly off-integer for metallic ring

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(gainMultiplier, time + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gainNode);
    overtone.connect(gainNode);
    gainNode.connect(this.destination);

    osc.start(time);
    osc.stop(time + duration);
    overtone.start(time);
    overtone.stop(time + duration);

    this.registerNode(osc, time + duration);
    this.registerNode(overtone, time + duration);
    this.registerNode(gainNode, time + duration);
  }

  // Harpsichord simulator (fast decay sawtooth wave, high pitch)
  private triggerHarpsichord(freq: number, time: number, gainVal: number) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(200, time);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(gainVal, time + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.destination);

    osc.start(time);
    osc.stop(time + 0.25);

    this.registerNode(osc, time + 0.25);
    this.registerNode(gainNode, time + 0.25);
  }

  // --- SIMULATED DRUM VOICES ---

  // Classic Synthesized Kick Drum
  private triggerKick(time: number) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.25, time + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);

    osc.connect(gainNode);
    gainNode.connect(this.destination);

    osc.start(time);
    osc.stop(time + 0.2);

    this.registerNode(osc, time + 0.2);
    this.registerNode(gainNode, time + 0.2);
  }

  // Extra Industrial/Distorted Techno Kick
  private triggerHeavyKick(time: number) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const waveshaper = this.ctx.createWaveShaper();

    // Create a simple distortion curve
    const makeDistortionCurve = (amount = 20) => {
      const k = typeof amount === 'number' ? amount : 50;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      return curve;
    };
    waveshaper.curve = makeDistortionCurve(10);
    waveshaper.oversample = '4x';

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.15);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.35, time + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

    osc.connect(waveshaper);
    waveshaper.connect(gainNode);
    gainNode.connect(this.destination);

    osc.start(time);
    osc.stop(time + 0.22);

    this.registerNode(osc, time + 0.22);
    this.registerNode(gainNode, time + 0.22);
  }

  // Snare simulated via white noise burst
  private triggerSnare(time: number) {
    // Generate an audio buffer with random white noise
    const bufferSize = this.ctx.sampleRate * 0.15; // 150ms snare
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter to make snare sound mid-frequency high
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, time);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.12, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.destination);

    noiseSource.start(time);
    noiseSource.stop(time + 0.15);

    this.registerNode(noiseSource, time + 0.15);
    this.registerNode(gainNode, time + 0.15);
  }

  // High hi-hat click using bandpassed white noise
  private triggerHihat(time: number, duration: number = 0.04, customFreq: number = 8000) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(customFreq, time);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.04, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.destination);

    source.start(time);
    source.stop(time + duration);

    this.registerNode(source, time + duration);
    this.registerNode(gainNode, time + duration);
  }

  // Water drip simulation (rapid envelope triangle pitch modulation)
  private triggerDrip(time: number) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(1400, time + 0.08); // sweeps upwards fast

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.06, time + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);

    osc.connect(gainNode);
    gainNode.connect(this.destination);

    osc.start(time);
    osc.stop(time + 0.1);

    this.registerNode(osc, time + 0.1);
    this.registerNode(gainNode, time + 0.1);
  }
}
