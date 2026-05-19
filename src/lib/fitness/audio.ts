/**
 * Web Audio API で動的にビート・効果音を生成する音響エンジン。
 * 外部音源を持たず、全てオシレータで合成するので Vercel 無料枠で完結。
 */

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

export class FitnessAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bpm = 100;
  private beatTimer: number | null = null;
  private nextBeatAt = 0;
  private beatCount = 0;
  private running = false;
  private onBeat: ((beat: number, scheduledTime: number) => void) | null = null;

  /** ユーザー操作後に呼ぶ。AudioContext は user gesture が必要 */
  async ensureStarted(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
    if (!Ctor) throw new Error("Web Audio API がサポートされていません");
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
  }

  setVolume(v: number): void {
    if (this.master) this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  /** ノート判定で使う AudioContext の現在時刻 */
  currentAudioTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /** カウントイン後にビートを流し始める。onBeat はメインスレッドで叩かれる */
  startBeat(
    bpm: number,
    onBeat: (beat: number, scheduledTime: number) => void
  ): void {
    if (!this.ctx) return;
    this.bpm = bpm;
    this.onBeat = onBeat;
    this.beatCount = 0;
    this.nextBeatAt = this.ctx.currentTime + 0.1;
    this.running = true;
    this.scheduler();
  }

  stop(): void {
    this.running = false;
    if (this.beatTimer !== null) {
      window.clearTimeout(this.beatTimer);
      this.beatTimer = null;
    }
  }

  destroy(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.master = null;
    }
  }

  /** 約 100ms 先までのビートをスケジュール、25ms ごとに更新 */
  private scheduler = (): void => {
    if (!this.ctx || !this.running) return;
    const lookahead = 0.1;
    const interval = 60 / this.bpm;
    while (this.nextBeatAt < this.ctx.currentTime + lookahead) {
      this.scheduleClick(this.nextBeatAt, this.beatCount % 4 === 0);
      // 8 ビートに 1 回ベースノートも鳴らす（メロディ的にゆらぎを出す）
      if (this.beatCount % 2 === 0) {
        const notes = [110, 110, 146.83, 164.81, 130.81, 130.81, 174.61, 196];
        this.scheduleBass(notes[(this.beatCount / 2) % notes.length], this.nextBeatAt);
      }
      const current = this.beatCount;
      const scheduled = this.nextBeatAt;
      // メインスレッドへは setTimeout で通知（スケジュール時間に近づけて）
      const delayMs = Math.max(0, (scheduled - this.ctx.currentTime) * 1000);
      window.setTimeout(() => this.onBeat?.(current, scheduled), delayMs);
      this.beatCount++;
      this.nextBeatAt += interval;
    }
    this.beatTimer = window.setTimeout(this.scheduler, 25);
  };

  /** メトロノーム的クリック音。1拍目はピッチを上げてアクセント */
  private scheduleClick(at: number, accent: boolean): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = accent ? 880 : 660;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.25 : 0.15, at + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
    osc.connect(gain).connect(this.master);
    osc.start(at);
    osc.stop(at + 0.1);
  }

  /** 低音のベース。雰囲気作り */
  private scheduleBass(freq: number, at: number): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.2, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
    osc.connect(gain).connect(this.master);
    osc.start(at);
    osc.stop(at + 0.45);
  }

  /** ヒット時の「チャリン♪」コイン音。2 つのピッチを重ねてキラキラに */
  playCoin(): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    [
      { freq: 988, delay: 0 },
      { freq: 1319, delay: 0.08 },
    ].forEach(({ freq, delay }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      const at = now + delay;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.18, at + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
      osc.connect(gain).connect(this.master!);
      osc.start(at);
      osc.stop(at + 0.3);
    });
  }

  /** ミス時の鈍い音 */
  playMiss(): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** ファンファーレ（クリア時） */
  playFanfare(): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const at = now + i * 0.12;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      osc.connect(gain).connect(this.master!);
      osc.start(at);
      osc.stop(at + 0.6);
    });
  }
}
