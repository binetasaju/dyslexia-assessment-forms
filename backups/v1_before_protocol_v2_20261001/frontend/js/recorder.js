/*
 * Reusable audio recorder (MediaRecorder API).
 *
 *   const rec = new AudioRecorder();
 *   await rec.startRecording();
 *   const result = await rec.stopRecording();   // { blob, duration, status, extension }
 *   rec.playRecording();
 *   rec.deleteRecording();
 *
 * The microphone permission is requested once and shared by all recorders.
 */
class AudioRecorder {
  static stream = null;
  static active = null; // the recorder that is currently recording (only one at a time)

  static async getStream() {
    if (AudioRecorder.stream && AudioRecorder.stream.active) return AudioRecorder.stream;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      throw new Error(
        "This browser cannot record audio. Please use Google Chrome or Microsoft Edge and open the site at http://localhost:5000."
      );
    }
    try {
      AudioRecorder.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "SecurityError") {
        throw new Error(
          "Microphone access is required for this task.\nPlease allow microphone access in your browser and try again."
        );
      }
      if (err.name === "NotFoundError") {
        throw new Error("No microphone was found. Please connect a microphone and try again.");
      }
      if (err.name === "NotReadableError") {
        throw new Error("The microphone is being used by another program. Close it and try again.");
      }
      throw new Error("Could not start the microphone: " + err.message);
    }
    return AudioRecorder.stream;
  }

  static pickMimeType() {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  }

  static extensionFor(mimeType) {
    if (mimeType.includes("ogg")) return "ogg";
    if (mimeType.includes("mp4")) return "m4a";
    return "webm";
  }

  constructor() {
    this.blob = null;
    this.url = null;
    this.duration = 0;
    this.status = "EMPTY"; // EMPTY | RECORDING | RECORDED
    this.chunks = [];
    this.mediaRecorder = null;
    this.audio = null;
  }

  async startRecording() {
    if (AudioRecorder.active && AudioRecorder.active !== this) {
      throw new Error("Another recording is still running. Stop it first.");
    }
    const stream = await AudioRecorder.getStream();
    this.deleteRecording();
    const mimeType = AudioRecorder.pickMimeType();
    this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    this.chunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };
    this.startedAt = performance.now();
    this.mediaRecorder.start(1000); // collect data every second so nothing is lost
    this.status = "RECORDING";
    AudioRecorder.active = this;
  }

  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.status !== "RECORDING") {
        resolve(this.getResult());
        return;
      }
      this.mediaRecorder.onstop = () => {
        const type = this.mediaRecorder.mimeType || "audio/webm";
        this.blob = new Blob(this.chunks, { type });
        this.extension = AudioRecorder.extensionFor(type);
        this.duration = Math.round((performance.now() - this.startedAt) / 100) / 10;
        this.url = URL.createObjectURL(this.blob);
        this.status = this.blob.size > 0 ? "RECORDED" : "EMPTY";
        AudioRecorder.active = null;
        if (this.status === "EMPTY") reject(new Error("Recording failed: no audio was captured. Please try again."));
        else resolve(this.getResult());
      };
      this.mediaRecorder.onerror = (e) => {
        AudioRecorder.active = null;
        this.status = "EMPTY";
        reject(new Error("Recording failed: " + (e.error ? e.error.message : "unknown error")));
      };
      this.mediaRecorder.stop();
    });
  }

  playRecording() {
    if (!this.url) return null;
    this.stopPlayback();
    this.audio = new Audio(this.url);
    this.audio.play();
    return this.audio;
  }

  stopPlayback() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  }

  deleteRecording() {
    this.stopPlayback();
    if (this.url) URL.revokeObjectURL(this.url);
    this.blob = null;
    this.url = null;
    this.duration = 0;
    this.status = "EMPTY";
  }

  getResult() {
    return { blob: this.blob, duration: this.duration, status: this.status, extension: this.extension || "webm" };
  }
}
