// Eerie ambient drone — pure Web Audio synthesis, no audio files.
// Two detuned low sines breathe under a slow LFO, a faint noise shimmer
// floats on top, and every so often something knocks in the distance.
// Needs a user gesture to start (browser autoplay policy), so it is gated
// behind the sound toggle. Preference helpers are unit-tested; the engine
// itself needs a real AudioContext and is verified live.

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const SOUND_PREF_KEY = "if-horpak:ambient:v1";

/** Default off — no surprise audio. */
export function getAmbientPref(storage: StorageLike): boolean {
  return storage.getItem(SOUND_PREF_KEY) === "on";
}

export function setAmbientPref(storage: StorageLike, on: boolean): void {
  storage.setItem(SOUND_PREF_KEY, on ? "on" : "off");
}

const MASTER_GAIN = 0.07;

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private cleanups: (() => void)[] = [];
  private enabled = false;

  /** Create/resume the AudioContext. Must be called from a user gesture. */
  enable(): void {
    if (typeof window === "undefined" || !("AudioContext" in window)) return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER_GAIN;
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

  /** Detuned low pair — the beating between 55 and 55.6 Hz does the dread. */
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
    filter.frequency.value = 220;
    filter.connect(droneGain);

    const oscs = [55, 55.6, 110.3].map((freq) => {
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
    filter.frequency.value = 2400;
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

  /** Every 20–45s: a muffled distant knock or a low passing whoosh. */
  private startDistantEvents(): void {
    const schedule = () => {
      const delay = 20000 + Math.random() * 25000;
      const id = window.setTimeout(() => {
        if (Math.random() < 0.6) this.distantKnock();
        else this.lowWhoosh();
        schedule();
      }, delay);
      this.cleanups.push(() => window.clearTimeout(id));
    };
    schedule();
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
