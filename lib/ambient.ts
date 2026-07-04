// Ambient drone — pure Web Audio synthesis, no audio files.
// Two detuned low sines breathe under a slow LFO, a faint noise shimmer
// floats on top, and every so often a mood-specific event fires in the
// distance. Needs a user gesture to start (browser autoplay policy), so it
// is gated behind the sound toggle. Preference helpers are unit-tested; the
// engine itself needs a real AudioContext and is verified live.

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const SOUND_PREF_KEY = "if:ambient:v1";

/** Default off — no surprise audio. */
export function getAmbientPref(storage: StorageLike): boolean {
  return storage.getItem(SOUND_PREF_KEY) === "on";
}

export function setAmbientPref(storage: StorageLike, on: boolean): void {
  storage.setItem(SOUND_PREF_KEY, on ? "on" : "off");
}

export type AmbientMood = "horror" | "romance" | "office" | "period";

interface MoodConfig {
  droneFreqs: number[]; // detuned low pair/triad
  droneFilterHz: number; // lowpass cutoff on drone
  masterGain: number;
  shimmerHz: number; // bandpass center of the top shimmer
  eventKind: "knock" | "chime" | "keyboard";
}

const MOODS: Record<AmbientMood, MoodConfig> = {
  horror: { droneFreqs: [55, 55.6, 110.3], droneFilterHz: 220, masterGain: 0.07, shimmerHz: 2400, eventKind: "knock" },
  romance: { droneFreqs: [98, 98.4, 147], droneFilterHz: 320, masterGain: 0.06, shimmerHz: 1800, eventKind: "chime" },
  office: { droneFreqs: [120, 120.5, 60], droneFilterHz: 500, masterGain: 0.05, shimmerHz: 3200, eventKind: "keyboard" },
  period: { droneFreqs: [110, 110.4, 165], droneFilterHz: 400, masterGain: 0.055, shimmerHz: 1400, eventKind: "chime" },
};

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private cleanups: (() => void)[] = [];
  private enabled = false;
  private cfg: MoodConfig;

  constructor(mood: AmbientMood) {
    this.cfg = MOODS[mood];
  }

  /** Create/resume the AudioContext. Must be called from a user gesture. */
  enable(): void {
    if (typeof window === "undefined" || !("AudioContext" in window)) return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.cfg.masterGain;
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
    if (this.enabled) return;
    this.enabled = true;
    this.startDrone();
    this.startShimmer();
    this.startDistantEvents();
  }

  disable(): void {
    this.enabled = false;
    for (const stop of this.cleanups) stop();
    this.cleanups = [];
    if (this.ctx) void this.ctx.suspend();
  }

  /** Detuned low pair — the beating between the two close frequencies does the mood. */
  private startDrone(): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0, t);
    droneGain.gain.linearRampToValueAtTime(0.9, t + 4);
    droneGain.connect(this.master);

    // slow breathing LFO on the drone volume
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.value = 0.25;
    lfo.connect(lfoDepth);
    lfoDepth.connect(droneGain.gain);
    lfo.start(t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = this.cfg.droneFilterHz;
    filter.connect(droneGain);

    const oscs = this.cfg.droneFreqs.map((freq) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(filter);
      osc.start(t);
      return osc;
    });

    this.cleanups.push(() => {
      for (const osc of [...oscs, lfo]) {
        try {
          osc.stop();
        } catch {
          // already stopped
        }
      }
    });
  }

  /** Faint high shimmer: narrow-band noise that swells and fades at random. */
  private startShimmer(): void {
    if (!this.ctx || !this.master) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = this.cfg.shimmerHz;
    filter.Q.value = 18;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start();

    const swell = window.setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const peak = 0.03 + Math.random() * 0.05;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(peak, t + 3 + Math.random() * 3);
      g.gain.linearRampToValueAtTime(0.005, t + 9 + Math.random() * 4);
    }, 14000);

    this.cleanups.push(() => {
      window.clearInterval(swell);
      try {
        src.stop();
      } catch {
        // already stopped
      }
    });
  }

  /** Every 20–45s: a mood-specific event or a low passing whoosh. */
  private startDistantEvents(): void {
    const schedule = () => {
      const delay = 20000 + Math.random() * 25000;
      const id = window.setTimeout(() => {
        if (Math.random() < 0.6) this.moodEvent();
        else this.lowWhoosh();
        schedule();
      }, delay);
      this.cleanups.push(() => window.clearTimeout(id));
    };
    schedule();
  }

  private moodEvent(): void {
    if (this.cfg.eventKind === "chime") this.softChime();
    else if (this.cfg.eventKind === "keyboard") this.keyboardClicks();
    else this.distantKnock();
  }

  private distantKnock(): void {
    if (!this.ctx || !this.master) return;
    const knocks = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < knocks; i++) {
      const t = this.ctx.currentTime + i * (0.35 + Math.random() * 0.1);
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  }

  /** A soft two-note sine arpeggio for the romance mood. */
  private softChime(): void {
    if (!this.ctx || !this.master) return;
    const notes = [660, 880];
    for (let i = 0; i < notes.length; i++) {
      const t = this.ctx.currentTime + i * 0.2;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(notes[i], t);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.65);
    }
  }

  /** 3–6 short filtered-noise clicks for the office mood. */
  private keyboardClicks(): void {
    if (!this.ctx || !this.master) return;
    const clicks = 3 + Math.floor(Math.random() * 4);
    let t = this.ctx.currentTime;
    for (let i = 0; i < clicks; i++) {
      t += 0.04 + Math.random() * 0.05;
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.01, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let j = 0; j < data.length; j++) data[j] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 2000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.01);
      src.connect(filter);
      filter.connect(g);
      g.connect(this.master);
      src.start(t);
    }
  }

  private lowWhoosh(): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(38, t);
    osc.frequency.linearRampToValueAtTime(62, t + 2.5);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 120;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 1.2);
    g.gain.linearRampToValueAtTime(0, t + 3);
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 3.1);
  }
}
