// src/audio.js - Procedural Web Audio API Sound Generator for Survival Horror

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;

    // Ambient Drone
    this.ambientDrone = null;
    this.heartbeatTimer = null;
    this.heartbeatRate = 'slow'; // 'slow' or 'fast'
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.initialized = true;
      this.startAmbient();
      this.startHeartbeatLoop();
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.ctx) {
      if (this.ambientGain) this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  startAmbient() {
    if (!this.ctx || this.isMuted) return;

    // Low sub-bass horror drone (55Hz + 58Hz binaural detune)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(58.5, this.ctx.currentTime); // Creepy dissonance

    this.ambientGain.gain.setValueAtTime(0.1, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
  }

  startHeartbeatLoop() {
    const triggerBeat = () => {
      if (!this.isMuted && this.ctx && this.ctx.state === 'running') {
        this.playSingleHeartbeat();
      }
      const interval = this.heartbeatRate === 'fast' ? 420 : 1300;
      this.heartbeatTimer = setTimeout(triggerBeat, interval);
    };
    triggerBeat();
  }

  setHeartbeatRate(rate) {
    this.heartbeatRate = rate;
  }

  playSingleHeartbeat() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Lub-dub double thud
    this.playThump(t, 55, 0.25);
    this.playThump(t + 0.12, 45, 0.18);
  }

  playThump(startTime, freq, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(20, startTime + 0.15);

    gain.gain.setValueAtTime(vol * (this.heartbeatRate === 'fast' ? 1.4 : 0.6), startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.2);
  }

  playFootstep() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Filtered noise click for wooden floor step
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450 + Math.random() * 80, t);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  playKeyPickup() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Eerie sparkling metallic arpeggio
    const freqs = [587.33, 880, 1174.66, 1760]; // D5, A5, D6, A6

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);

      gain.gain.setValueAtTime(0.15, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.5);
    });
  }

  playDoorUnlock() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Heavy metal latch rattle + slide
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.2);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.5);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  playEnemyAlert() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Blood-curdling screech / violin screech chord
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(700, t);
    osc1.frequency.exponentialRampToValueAtTime(1300, t + 0.35);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(730, t);
    osc2.frequency.exponentialRampToValueAtTime(1380, t + 0.35);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.65);
    osc2.stop(t + 0.65);
  }

  playJumpscare() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Aggressive shock blast
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.0);
  }

  playVictory() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Major chord release of relief
    const chords = [261.63, 329.63, 392.0, 523.25]; // C major
    chords.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 2.6);
    });
  }
}
