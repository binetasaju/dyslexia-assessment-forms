/*
 * Reusable timer used by every task (handwriting, reading, PA, RAN, memory).
 *
 *   const t = new Timer((seconds) => display.textContent = Timer.format(seconds));
 *   t.start(); t.pause(); t.start(); t.stop(); t.reset(); t.getDuration();
 *
 * States: "idle" | "running" | "paused" | "stopped"
 */
class Timer {
  constructor(onTick) {
    this.onTick = onTick || (() => {});
    this.reset();
  }

  start() {
    if (this.state === "running") return;
    if (this.state === "stopped") this.reset();
    if (!this.startTime) this.startTime = new Date();
    this.runningSince = performance.now();
    this.state = "running";
    this.interval = setInterval(() => this.onTick(this.getDuration()), 200);
    this.onTick(this.getDuration());
  }

  pause() {
    if (this.state !== "running") return;
    this.elapsedMs += performance.now() - this.runningSince;
    this.runningSince = null;
    clearInterval(this.interval);
    this.state = "paused";
    this.onTick(this.getDuration());
  }

  stop() {
    if (this.state === "idle" || this.state === "stopped") return this.getDuration();
    if (this.state === "running") this.elapsedMs += performance.now() - this.runningSince;
    this.runningSince = null;
    clearInterval(this.interval);
    this.endTime = new Date();
    this.state = "stopped";
    this.onTick(this.getDuration());
    return this.getDuration();
  }

  reset() {
    clearInterval(this.interval);
    this.state = "idle";
    this.elapsedMs = 0;
    this.runningSince = null;
    this.startTime = null;
    this.endTime = null;
    this.onTick(0);
  }

  /* Duration in seconds (one decimal place). */
  getDuration() {
    let ms = this.elapsedMs;
    if (this.state === "running") ms += performance.now() - this.runningSince;
    return Math.round(ms / 100) / 10;
  }

  static format(seconds) {
    const total = Math.floor(seconds || 0);
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }
}
