/*
 * Main application (protocol v2): child information form, step-by-step
 * assessment, review page and submission.
 *
 * This website is a raw data collection form. It COLLECTS:
 *   - Reading, RAN, Memory: audio recordings (with start/end time and duration),
 *   - Phonological awareness, Grapheme–phoneme knowledge: the child's response and the
 *     assessor's mark (Correct / Incorrect / Not attempted) – no audio,
 *   - Handwriting: timer (start/end/duration) and status – no audio.
 * It calculates nothing and diagnoses nothing.
 *
 * Question content comes from assessment-data.js.
 * Timer and AudioRecorder come from timer.js and recorder.js.
 */

const SESSION_LABELS = {
  S01: "Session 1",
  S02: "Session 2",
};
const CHILD_ID_PATTERN = /^[A-Za-z0-9_-]{2,30}$/;

/* Marks the assessor can give a question. Score is stored next to the mark:
 * CORRECT = 1, INCORRECT = 0, NOT_ATTEMPTED = NA (null, never 0). */
const MARKS = [
  { value: "CORRECT", label: "✓ Correct (1)", score: 1 },
  { value: "INCORRECT", label: "✗ Incorrect (0)", score: 0 },
  { value: "NOT_ATTEMPTED", label: "— Not attempted (NA)", score: null },
];
const TASK_STATUSES = [
  { value: "COMPLETED", label: "Completed" },
  { value: "NOT_COMPLETED", label: "Not completed" },
  { value: "NOT_ATTEMPTED", label: "Not attempted" },
];

const appEl = document.getElementById("app");
const headerInfoEl = document.getElementById("header-info");

let state = null; // the assessment in progress

/* ------------------------------------------------------------ helpers */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function localIso(date) {
  if (!date) return null;
  const d = date;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function todayIso() {
  return localIso(new Date()).slice(0, 10);
}

function showBanner(message, type = "error") {
  const el = document.getElementById("banner");
  if (!message) {
    el.hidden = true;
    return;
  }
  el.className = `banner banner-${type}`;
  el.textContent = message;
  el.hidden = false;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function markLabel(value) {
  return { CORRECT: "Correct", INCORRECT: "Incorrect", NOT_ATTEMPTED: "Not attempted (NA)" }[value] || null;
}

function statusLabel(value) {
  return TASK_STATUSES.find((s) => s.value === value)?.label || null;
}

/* Number typed by the assessor → integer, or null when empty. Stored exactly as entered. */
function readCount(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/* ------------------------------------------------------------ child information page */

function renderChildForm(prefill = {}) {
  state = null;
  headerInfoEl.innerHTML = "";
  showBanner(null);
  const ages = Array.from({ length: 11 }, (_, i) => i + 5);
  appEl.innerHTML = `
    <div class="card">
      <h1>Child Assessment</h1>
      <p class="muted">Fill in the details below and press <strong>Start Assessment</strong>.</p>
      <form id="child-form" novalidate>
        <label class="field">
          <span>Child ID <span class="req">*</span></span>
          <input type="text" id="child_id" placeholder="e.g. CH001" autocomplete="off" value="${esc(prefill.child_id || "")}" />
          <small class="muted">Use the research code only (letters, numbers, - or _). Do not enter the child's name.</small>
        </label>

        <div class="field-row">
          <label class="field">
            <span>Age <span class="req">*</span></span>
            <select id="age">
              <option value="">Select age</option>
              ${ages.map((a) => `<option value="${a}" ${Number(prefill.age) === a ? "selected" : ""}>${a}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Grade</span>
            <input type="text" id="grade" maxlength="20" placeholder="e.g. 3" autocomplete="off" value="${esc(prefill.grade || "")}" />
          </label>
          <label class="field">
            <span>Date <span class="req">*</span></span>
            <input type="date" id="assessment_date" value="${esc(prefill.assessment_date || todayIso())}" />
          </label>
        </div>

        <fieldset class="field">
          <legend>Gender <span class="req">*</span></legend>
          <div class="choice-row">
            ${["Male", "Female", "Other"].map((g) => `
              <label class="choice"><input type="radio" name="gender" value="${g}" ${prefill.gender === g ? "checked" : ""} /> ${g}</label>`).join("")}
          </div>
        </fieldset>

        <label class="field">
          <span>Category <span class="req">*</span></span>
          <select id="category">
            <option value="">Select category</option>
            ${["Dyslexic", "Dysgraphic", "Normal", "Other"].map((c) =>
              `<option ${prefill.category === c ? "selected" : ""}>${c}</option>`).join("")}
          </select>
          <small class="muted">Research classification entered by the assessor. This website does not diagnose.</small>
        </label>

        <fieldset class="field">
          <legend>Session <span class="req">*</span></legend>
          <div class="choice-row">
            ${Object.entries(SESSION_LABELS).map(([id, label]) => `
              <label class="choice"><input type="radio" name="session" value="${id}" ${prefill.session === id ? "checked" : ""} /> ${label}</label>`).join("")}
          </div>
        </fieldset>

        <div class="mic-test">
          <button type="button" class="btn btn-secondary" id="mic-test">🎤 Test Microphone</button>
          <span id="mic-test-result" class="muted"></span>
        </div>

        <div id="form-error" class="form-error" role="alert"></div>
        <button type="submit" class="btn btn-primary btn-large">Start Assessment</button>
      </form>
    </div>`;

  document.getElementById("mic-test").addEventListener("click", testMicrophone);
  document.getElementById("child-form").addEventListener("submit", (e) => {
    e.preventDefault();
    startAssessment();
  });
}

async function testMicrophone() {
  const out = document.getElementById("mic-test-result");
  out.textContent = "Asking for microphone permission…";
  out.className = "muted";
  try {
    const stream = await AudioRecorder.getStream();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    out.className = "ok-text";
    out.textContent = "Microphone ready ✓ – speak to see the level: ";
    const meter = document.createElement("span");
    meter.className = "level";
    out.appendChild(meter);
    const started = performance.now();
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
      meter.style.width = `${Math.min(100, peak * 1.5)}px`;
      if (performance.now() - started < 8000 && document.body.contains(meter)) requestAnimationFrame(tick);
      else ctx.close();
    };
    tick();
  } catch (err) {
    out.className = "error-text";
    out.textContent = err.message;
  }
}

function startAssessment() {
  const errEl = document.getElementById("form-error");
  const childId = document.getElementById("child_id").value.trim().toUpperCase();
  const age = document.getElementById("age").value;
  const grade = document.getElementById("grade").value.trim();
  const assessmentDate = document.getElementById("assessment_date").value;
  const gender = document.querySelector("input[name=gender]:checked")?.value;
  const category = document.getElementById("category").value;
  const session = document.querySelector("input[name=session]:checked")?.value;

  let error = null;
  if (!childId) error = "Please enter a Child ID before continuing.";
  else if (!CHILD_ID_PATTERN.test(childId))
    error = "Child ID can only contain letters, numbers, '-' or '_' (2–30 characters), e.g. CH001.";
  else if (!age) error = "Please select the child's age.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(assessmentDate)) error = "Please enter the assessment date.";
  else if (!gender) error = "Please select the child's gender.";
  else if (!category) error = "Please select a category.";
  else if (!session) error = "Please select Session 1 or Session 2.";
  if (error) {
    errEl.textContent = error;
    return;
  }

  const content = getSessionContent(session, age);
  state = {
    child: { child_id: childId, age: Number(age), grade, assessment_date: assessmentDate, gender, category, session },
    ageGroup: getAgeGroup(age),
    content,
    startedAt: new Date(),
    hw: {},        // handwriting timers + status
    rec: {},       // audio recording items (reading, RAN, memory), keyed by file base name
    marks: {},     // child's response + assessor mark for PA / GPK questions
    activeItem: null,
    notes: "",
    submitted: false,
  };

  buildState();
  state.steps = STEP_DEFS
    .filter((d) => content[d.module] && (!d.part || content[d.module][d.part]))
    .map((d) => ({ ...d }));
  state.steps.push({ type: "review", title: "Review & Submit", assessorOnly: false });
  state.stepIndex = 0;
  renderStep();
}

/* ------------------------------------------------------------ assessment state */

function buildState() {
  const c = state.content;

  if (c.handwriting) {
    for (const part of ["copying", "dictation"]) {
      if (!c.handwriting[part]) continue;
      const hw = { status: null, timesRead: "" };
      hw.timer = new Timer((s) => {
        const el = document.getElementById(`hwtimer-${part}`);
        if (el) el.textContent = Timer.format(s);
        updateHandwritingButtons(part);
      });
      state.hw[part] = hw;
    }
  }

  if (c.reading) addRec(`READING_${c.reading.passage_id}`, "reading");

  for (const moduleKey of ["phonological", "grapheme_phoneme"]) {
    if (!c[moduleKey]) continue;
    for (const sec of c[moduleKey].sections) {
      for (const item of sec.items) state.marks[questionKey(moduleKey, sec, item)] = { status: null, response: "" };
    }
  }

  if (c.ran) for (const t of c.ran.tasks) addRec(`RAN_${t.id}`, "ran");

  if (c.memory) for (const t of memoryTrials()) addRec(t.key, "memory");
}

/* Flat list of memory trials for the current session. */
function memoryTrials() {
  const mem = state.content.memory;
  const cond = mem.condition === "BACKWARD" ? "BWD" : "FWD";
  return mem.levels.flatMap((lvl) => lvl.sequences.map((seq, i) => ({
    key: `MEM_${cond}_${lvl.id}_T${i + 1}`,
    level: lvl,
    trial: i + 1,
    sequence: seq,
  })));
}

function addRec(key, folder) {
  const item = { key, folder, duration: 0, recorder: new AudioRecorder(), error: "", recording: false };
  item.timer = new Timer((s) => {
    const el = document.getElementById(`timer-${key}`);
    if (el) el.textContent = Timer.format(s);
  });
  state.rec[key] = item;
}

/* ------------------------------------------------------------ step rendering */

function renderHeaderInfo() {
  const c = state.child;
  headerInfoEl.innerHTML = `
    <span><strong>Child ID:</strong> ${esc(c.child_id)}</span>
    <span><strong>Age:</strong> ${c.age}</span>
    <span><strong>Session:</strong> ${SESSION_LABELS[c.session]}</span>`;
}

function renderStep() {
  showBanner(null);
  renderHeaderInfo();
  const step = state.steps[state.stepIndex];
  const total = state.steps.length;
  const n = state.stepIndex + 1;

  const renderers = {
    hw_copying: (el) => renderHandwriting(el, "copying"),
    hw_dictation: (el) => renderHandwriting(el, "dictation"),
    reading: renderReading,
    phonological: (el) => renderQuestions(el, "phonological"),
    grapheme_phoneme: (el) => renderQuestions(el, "grapheme_phoneme"),
    ran: renderRan,
    memory: renderMemory,
    review: renderReview,
  };

  appEl.innerHTML = `
    <div class="step-layout">
      <aside id="step-aside" class="assessor-box"></aside>
      <div class="step-main">
        <div class="progress">
          <div class="progress-text">Step ${n} of ${total} – <strong>${esc(step.title)}</strong></div>
          <div class="progress-bar"><div style="width:${(n / total) * 100}%"></div></div>
        </div>
        <div id="step-body"></div>
        <div class="nav">
          <button class="btn btn-secondary" id="prev-btn">← Previous</button>
          ${step.type === "review"
            ? `<button class="btn btn-primary btn-large" id="submit-btn">Submit Assessment</button>`
            : `<button class="btn btn-primary" id="next-btn">Next →</button>`}
        </div>
      </div>
      <div class="step-spacer"></div>
    </div>`;

  const body = document.getElementById("step-body");
  if (step.assessorOnly) renderAssessorGate(body, () => renderers[step.type](body));
  else renderers[step.type](body);

  document.getElementById("prev-btn").addEventListener("click", () => goTo(state.stepIndex - 1));
  document.getElementById("next-btn")?.addEventListener("click", () => goTo(state.stepIndex + 1));
  document.getElementById("submit-btn")?.addEventListener("click", submitAssessment);
  window.scrollTo({ top: 0 });
}

async function goTo(index) {
  if (state.activeItem) await stopItem(state.activeItem);
  if (index < 0) {
    if (confirm("Go back to the Child Information page? Everything recorded so far will be lost.")) {
      renderChildForm(state.child);
    }
    return;
  }
  if (index >= state.steps.length) return;
  state.stepIndex = index;
  renderStep();
}

/* ---- Assessor-only warning */

function assessorBannerHtml() {
  return `<div class="assessor-only">ASSESSOR ONLY — DO NOT SHOW THIS SCREEN TO THE CHILD</div>`;
}

function renderAssessorGate(el, renderContent) {
  el.innerHTML = `
    <div class="card gate">
      <div class="gate-title">ASSESSOR ONLY</div>
      <p class="gate-text">Do not show this screen to the child.</p>
      <p>The next screen contains information the child must not see (sentences, sequences, expected answers or scoring).
      Turn the screen away from the child. Read the instruction and/or stimulus aloud.</p>
      <button class="btn btn-primary btn-large" id="gate-open">I am the assessor – show the screen</button>
    </div>`;
  el.querySelector("#gate-open").addEventListener("click", () => {
    el.innerHTML = "";
    renderContent();
    el.insertAdjacentHTML("afterbegin", assessorBannerHtml());
  }, { once: true }); // a second or double click can never render the content twice
}

/* Small assessor-instruction box on the left of the step. */
function setAside(html) {
  const el = document.getElementById("step-aside");
  if (el) el.innerHTML = `<div class="assessor-box-title">Assessor instructions</div>${html}`;
}

function sayHtml(text) {
  return `<p class="aside-label">Say to the child:</p><p class="aside-say">“${esc(text)}”</p>`;
}

/* Full-screen card shown to the child (e.g. a letter or the copying text). Contains no answers. */
function showChildCard(text, big) {
  const overlay = document.createElement("div");
  overlay.className = "child-card";
  overlay.innerHTML = `
    <div class="child-card-text ${big ? "huge" : ""}">${esc(text)}</div>
    <button class="btn btn-secondary child-card-close">Close (Esc)</button>`;
  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => e.key === "Escape" && close();
  overlay.querySelector("button").addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
}

/* ---- Shared form controls */

function radioGroupHtml(name, options, selected) {
  return `<div class="choice-row">${options.map((o) => `
    <label class="choice choice-${o.value.toLowerCase()}">
      <input type="radio" name="${esc(name)}" value="${o.value}" ${selected === o.value ? "checked" : ""} /> ${esc(o.label)}
    </label>`).join("")}</div>`;
}

/* ---- Handwriting */

function renderHandwriting(el, part) {
  const content = state.content.handwriting[part];
  const hw = state.hw[part];
  const isDictation = part === "dictation";
  const c = state.child;
  setAside(`
    ${part === "copying" ? sayHtml(SCRIPTS.handwritingIntro) : ""}
    ${sayHtml(isDictation ? SCRIPTS.dictation : SCRIPTS.copying)}
    <ul class="rules">
      ${isDictation ? `
        <li>The child must not see this sentence. Read it aloud at a natural pace.</li>
        <li>You may read the sentence as many times as needed.</li>
        <li>Do not spell words, give hints or correct the child's writing.</li>` : `
        <li>Give the child a writing sheet. The child copies the text shown on the screen.</li>
        <li>Do not demonstrate a handwriting style.</li>`}
      <li>Start the timer when the child begins writing. Stop it when the child finishes.</li>
    </ul>
    <p>Handwriting image is collected separately. Do not upload it here.
      Suggested photo name: <code>${esc(c.child_id)}_${esc(c.session)}_${part}.jpg</code></p>`);
  el.innerHTML = `
    <div class="card">
      ${isDictation ? `
        <div class="text-box">
          <div class="text-box-label">Sentence to read aloud (assessor only) · ${esc(content.text_id)}</div>
          <p class="passage">${esc(content.text)}</p>
        </div>` : `
        <div class="child-text-box">
          <p class="child-text">${esc(content.text)}</p>
        </div>
        <button class="btn btn-secondary" id="show-copy">Show the text full-screen</button>`}
      <div class="timer-row">
        <span class="timer big" id="hwtimer-${part}">${Timer.format(hw.timer.getDuration())}</span>
        <button class="btn btn-go" data-hwaction="start">▶ Start Timer</button>
        <button class="btn btn-secondary" data-hwaction="pause">❚❚ Pause</button>
        <button class="btn btn-stop" data-hwaction="stop">■ Stop Timer</button>
        <button class="btn btn-secondary" data-hwaction="reset">↺ Reset</button>
      </div>
      <fieldset class="field">
        <legend>Status</legend>
        ${radioGroupHtml(`hwstatus-${part}`, TASK_STATUSES.slice(0, 2), hw.status)}
      </fieldset>
      ${isDictation ? `
        <label class="field narrow">
          <span>Times the sentence was read aloud (optional, for information only)</span>
          <input type="number" min="1" step="1" id="hw-times-read" value="${esc(hw.timesRead)}" />
        </label>` : ""}
    </div>`;

  el.querySelector("#show-copy")?.addEventListener("click", () => showChildCard(content.text, false));
  el.querySelector("#hw-times-read")?.addEventListener("input", (e) => (hw.timesRead = e.target.value));
  el.querySelectorAll(`input[name="hwstatus-${part}"]`).forEach((r) =>
    r.addEventListener("change", () => (hw.status = r.value)));
  el.querySelectorAll("[data-hwaction]").forEach((btn) => btn.addEventListener("click", () => {
    const timer = hw.timer;
    const action = btn.dataset.hwaction;
    if (action === "start") timer.start();
    if (action === "pause") timer.pause();
    if (action === "stop") {
      timer.stop();
      if (!hw.status) {
        hw.status = "COMPLETED";
        el.querySelector(`input[name="hwstatus-${part}"][value="COMPLETED"]`).checked = true;
      }
    }
    if (action === "reset" && (timer.getDuration() === 0 || confirm("Reset this timer to 00:00?"))) timer.reset();
    updateHandwritingButtons(part);
  }));
  updateHandwritingButtons(part);
}

function updateHandwritingButtons(part) {
  const hw = state && state.hw[part];
  if (!hw || !hw.timer) return; // timer is still being created
  const timer = hw.timer;
  const q = (a) => document.querySelector(`[data-hwaction="${a}"]`);
  if (!q("start") || !document.getElementById(`hwtimer-${part}`)) return;
  q("start").textContent = timer.state === "paused" ? "▶ Resume" : "▶ Start Timer";
  q("start").disabled = timer.state === "running";
  q("pause").disabled = timer.state !== "running";
  q("stop").disabled = !(timer.state === "running" || timer.state === "paused");
  q("reset").disabled = timer.state === "idle";
  document.getElementById(`hwtimer-${part}`).classList.toggle("running", timer.state === "running");
}

/* ---- Recording widget (shared by reading, RAN, memory) */

function recordingWidgetHtml(item) {
  return `
    <div class="rec" id="item-${item.key}">
      <div class="rec-controls">
        <button class="btn btn-rec" data-action="start" data-key="${item.key}">● Start Recording</button>
        <button class="btn btn-stop" data-action="stop" data-key="${item.key}">■ Stop</button>
        <button class="btn btn-secondary" data-action="play" data-key="${item.key}">▶ Play</button>
        <button class="btn btn-secondary" data-action="rerecord" data-key="${item.key}">↻ Re-record</button>
        <button class="btn btn-secondary" data-action="delete" data-key="${item.key}">🗑 Delete</button>
        <span class="timer" id="timer-${item.key}">${Timer.format(item.timer.getDuration())}</span>
        <span class="rec-state" id="state-${item.key}"></span>
      </div>
      <div class="rec-error" id="error-${item.key}" role="alert"></div>
    </div>`;
}

function updateItemUI(item) {
  const box = document.getElementById(`item-${item.key}`);
  if (!box) return;
  const btn = (a) => box.querySelector(`[data-action="${a}"]`);
  const hasAudio = item.recorder.status === "RECORDED";
  btn("start").disabled = item.recording || hasAudio;
  btn("stop").disabled = !item.recording;
  btn("play").disabled = !hasAudio;
  btn("rerecord").disabled = !hasAudio;
  btn("delete").disabled = !hasAudio;

  const stateEl = document.getElementById(`state-${item.key}`);
  const [text, cls] = item.recording ? ["● Recording", "st-recording"]
    : hasAudio ? [`✓ Recorded – ${Timer.format(item.duration)}`, "st-done"]
    : ["Not recorded", "st-idle"];
  stateEl.textContent = text;
  stateEl.className = `rec-state ${cls}`;
  box.className = `rec ${cls}`;
  document.getElementById(`timer-${item.key}`).classList.toggle("running", item.recording);
  document.getElementById(`error-${item.key}`).textContent = item.error;
}

function bindRecordingWidgets(container) {
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const item = state.rec[btn.dataset.key];
    item.error = "";
    switch (btn.dataset.action) {
      case "start":
        await startItem(item);
        break;
      case "stop":
        await stopItem(item);
        break;
      case "play":
        item.recorder.playRecording();
        break;
      case "rerecord":
        if (confirm("Delete this recording and record again?")) {
          clearRecording(item);
          await startItem(item);
        }
        break;
      case "delete":
        if (confirm("Delete this recording?")) clearRecording(item);
        break;
    }
    updateItemUI(item);
  });
  container.querySelectorAll(".rec").forEach((box) => updateItemUI(state.rec[box.id.slice(5)]));
}

function clearRecording(item) {
  item.recorder.deleteRecording();
  item.timer.reset();
  item.duration = 0;
}

async function startItem(item) {
  if (state.activeItem && state.activeItem !== item) {
    const previous = state.activeItem;
    await stopItem(previous);
    updateItemUI(previous);
  }
  try {
    await item.recorder.startRecording();
  } catch (err) {
    item.error = err.message;
    if (/Microphone access/.test(err.message)) showBanner(err.message);
    updateItemUI(item);
    return;
  }
  item.timer.reset();
  item.timer.start();
  item.recording = true;
  state.activeItem = item;
  updateItemUI(item);
}

async function stopItem(item) {
  if (!item.recording) return;
  item.timer.stop();
  item.recording = false;
  state.activeItem = null;
  try {
    const result = await item.recorder.stopRecording();
    item.duration = result.duration;
  } catch (err) {
    item.error = err.message;
    item.timer.reset();
  }
  updateItemUI(item);
}

/* ---- Reading (audio only) */

function renderReading(el) {
  const r = state.content.reading;
  const item = state.rec[`READING_${r.passage_id}`];
  setAside(`
    ${sayHtml(SCRIPTS.reading)}
    <p>Turn the screen towards the child. Press <strong>Start Recording</strong> when the child begins
      reading and <strong>Stop</strong> when the child has finished. Only the audio is saved.</p>`);
  el.innerHTML = `
    <div class="card">
      <div class="child-text-box">
        <p class="child-text">${esc(r.text)}</p>
      </div>
      ${recordingWidgetHtml(item)}
    </div>`;
  bindRecordingWidgets(el);
}

/* ---- Phonological awareness + grapheme–phoneme knowledge (no audio) */

function questionKey(moduleKey, sec, item) {
  return `${moduleKey === "phonological" ? "PA" : "GPK"}_${sec.id}_${item.id}`;
}

/* For multiple-choice questions: the option whose text is the protocol's expected answer (e.g. "Night." → B). */
function expectedOption(item) {
  if (item.type !== "mc" || item.expected === null) return null;
  const norm = (t) => String(t).trim().replace(/\.$/, "").toLowerCase();
  return item.options.find((o) => norm(o.text) === norm(item.expected)) || null;
}

function expectedText(item) {
  const opt = expectedOption(item);
  return opt ? `${opt.key}. ${opt.text}` : item.expected;
}

function questionHtml(moduleKey, sec, item) {
  const key = questionKey(moduleKey, sec, item);
  const mark = state.marks[key];
  return `
    <div class="question" id="q-${key}">
      <div class="q-label">
        <span class="q-num">${esc(item.id)}</span>
        <span class="q-prompt">${esc(item.say)}</span>
        ${item.child_display ? `<button class="btn btn-secondary btn-small" data-child-card="${esc(item.child_display)}">Show "${esc(item.child_display)}" to child</button>` : ""}
      </div>
      ${item.type === "mc" ? `<ol class="mc-options">${item.options.map((o) =>
        `<li><strong>${o.key}.</strong> ${esc(o.text)}</li>`).join("")}</ol>` : ""}
      ${item.expected !== null ? `<div class="expected"><span class="exp-label">Expected (protocol):</span> ${esc(expectedText(item))}</div>` : ""}
      <div class="answer-row">
        <label class="response">
          <span>Child's response</span>
          <input type="text" data-response="${key}" value="${esc(mark.response)}" autocomplete="off" />
        </label>
        <div class="mark">${radioGroupHtml(`mark-${key}`, MARKS, mark.status)}</div>
      </div>
    </div>`;
}

function bindMarks(el) {
  el.querySelectorAll("[data-response]").forEach((input) =>
    input.addEventListener("input", () => (state.marks[input.dataset.response].response = input.value)));
  el.querySelectorAll('input[type=radio][name^="mark-"]').forEach((radio) =>
    radio.addEventListener("change", () => (state.marks[radio.name.slice(5)].status = radio.value)));
}

function renderQuestions(el, moduleKey) {
  const mod = state.content[moduleKey];
  const isGpk = moduleKey === "grapheme_phoneme";
  setAside(`
    <p>Give each question exactly as written. Type the child's response, then mark the whole question:
      <strong>Correct (1)</strong>, <strong>Incorrect (0)</strong> or <strong>Not attempted (NA)</strong>.</p>
    <p>You decide whether the answer is correct. No audio is recorded for this task.</p>
    ${isGpk ? `<p>Use "Show … to child" to show the letter. Saved separately from phonological awareness.</p>` : ""}`);
  el.innerHTML = `
    ${mod.sections.map((sec) => `
      <div class="card">
        <h3>${esc(sec.title)}</h3>
        ${sec.say ? `<p class="say">${esc(sec.say)}</p>` : ""}
        ${sec.items.map((item) => questionHtml(moduleKey, sec, item)).join("")}
      </div>`).join("")}`;
  el.querySelectorAll("[data-child-card]").forEach((b) =>
    b.addEventListener("click", () => showChildCard(b.dataset.childCard, true)));
  bindMarks(el);
}

/* ---- RAN (audio only) */

function ranCellHtml(name) {
  if (RAN_COLOURS[name]) return `<span class="ran-colour" style="background:${RAN_COLOURS[name]}" aria-label="${esc(name)}"></span>`;
  if (RAN_EMOJI[name]) return `<span class="ran-symbol">${RAN_EMOJI[name]}</span>`;
  return `<span class="ran-symbol${name.length > 1 ? " ran-word" : ""}">${esc(name)}</span>`;
}

function renderRan(el) {
  const ran = state.content.ran;
  setAside(`
    ${[...new Set(ran.tasks.map((t) => t.instruction))].map(sayHtml).join("")}
    <p>Turn the screen towards the child and give the instruction. Then say <strong>"Ready? Go."</strong>
      and press <strong>Start Recording</strong>.</p>
    <p>Press <strong>Stop</strong> when the child has named the last item. Only the audio and the recording time are saved.</p>`);
  el.innerHTML = `
    ${ran.tasks.map((t) => `
      <div class="card">
        <div class="ran-grid ${t.columns <= 6 ? "ran-grid-small" : ""}" style="grid-template-columns: repeat(${t.columns}, 1fr)">
          ${t.items.map((name) => `<div class="ran-cell">${ranCellHtml(name)}</div>`).join("")}
        </div>
        <p class="muted small">Grid ${esc(t.grid_id)} · ${t.items.length} items</p>
        ${recordingWidgetHtml(state.rec[`RAN_${t.id}`])}
      </div>`).join("")}`;
  bindRecordingWidgets(el);
}

/* ---- Memory (audio only) */

function renderMemory(el) {
  const mem = state.content.memory;
  const backward = mem.condition === "BACKWARD";
  const trials = memoryTrials();
  setAside(`
    <p><strong>${backward ? "Backward" : "Forward"} digit recall</strong></p>
    ${sayHtml(SCRIPTS.memory[mem.condition])}
    <ul class="rules">
      <li>Never show the digits to the child.</li>
      <li>Read the digits aloud at a natural, consistent pace. Do not give hints.</li>
      <li>Press <strong>Start Recording</strong> before the child answers and <strong>Stop</strong> when the child has finished.
        Only the audio is saved.</li>
    </ul>`);
  el.innerHTML = `
    ${mem.levels.map((lvl) => `
      <div class="card">
        <h3>${esc(lvl.label)}</h3>
        ${trials.filter((t) => t.level === lvl).map((t) => `
          <div class="question">
            <div class="q-label">
              <span class="q-num">Trial ${t.trial}</span>
              <span class="assessor-tag">ASSESSOR ONLY</span>
              <span class="sequence">${esc(t.sequence.join(" – "))}</span>
            </div>
            ${recordingWidgetHtml(state.rec[t.key])}
          </div>`).join("")}
      </div>`).join("")}`;
  bindRecordingWidgets(el);
}

/* ---- Review (shows only what was collected; nothing is calculated) */

function recText(item) {
  return item && item.recorder.status === "RECORDED"
    ? `audio recorded (${Math.round(item.duration)} sec)` : `<span class="warn-text">no audio</span>`;
}

function markText(status) {
  return status ? esc(markLabel(status)) : `<span class="warn-text">not marked</span>`;
}

function questionReviewRows(moduleKey) {
  return state.content[moduleKey].sections.map((sec) => `
    <tr class="sub-head"><td colspan="3">${esc(sec.title)}</td></tr>
    ${sec.items.map((item) => {
      const mark = state.marks[questionKey(moduleKey, sec, item)];
      return `<tr><td>${esc(item.id)}</td><td>${esc(item.say)}</td>
        <td>${markText(mark.status)}${mark.response ? ` <span class="muted">(“${esc(mark.response)}”)</span>` : ""}</td></tr>`;
    }).join("")}`).join("");
}

function renderReview(el) {
  const c = state.child;
  const ct = state.content;
  const sections = [];

  if (ct.handwriting) {
    sections.push(`<h3>Handwriting</h3><ul>${["copying", "dictation"].filter((p) => state.hw[p]).map((p) => {
      const hw = state.hw[p];
      const running = hw.timer.state === "running" || hw.timer.state === "paused"
        ? ` <span class="warn-text">(timer still running – will be stopped on submit)</span>` : "";
      const status = hw.status ? statusLabel(hw.status) : `<span class="warn-text">No status selected</span>`;
      return `<li>${p === "copying" ? "Copying" : "Dictation"}: ${status} — ${Math.round(hw.timer.getDuration())} sec${running}</li>`;
    }).join("")}</ul>`);
  }
  if (ct.reading) {
    sections.push(`<h3>Reading</h3><p>${recText(state.rec[`READING_${ct.reading.passage_id}`])}</p>`);
  }
  if (ct.phonological) {
    sections.push(`<h3>Phonological Awareness</h3><table class="q-table">${questionReviewRows("phonological")}</table>`);
  }
  if (ct.grapheme_phoneme) {
    sections.push(`<h3>Grapheme–Phoneme Knowledge</h3><table class="q-table">${questionReviewRows("grapheme_phoneme")}</table>`);
  }
  if (ct.ran) {
    sections.push(`<h3>RAN</h3><ul>${ct.ran.tasks.map((t) =>
      `<li>${esc(t.title)} (${esc(t.grid_id)}): ${recText(state.rec[`RAN_${t.id}`])}</li>`).join("")}</ul>`);
  }
  if (ct.memory) {
    const backward = ct.memory.condition === "BACKWARD";
    sections.push(`<h3>Memory – ${backward ? "Backward" : "Forward"} recall</h3><table class="q-table">${
      memoryTrials().map((t) => `<tr><td>${esc(t.level.label)} · Trial ${t.trial}</td>
        <td>${esc(t.sequence.join(" – "))}</td><td>${recText(state.rec[t.key])}</td></tr>`).join("")}</table>`);
  }

  const unmarked = Object.values(state.marks).filter((m) => !m.status).length;
  el.innerHTML = `
    <div class="card review">
      ${assessorBannerHtml()}
      <h2>Assessment Review</h2>
      <table class="info-table">
        <tr><th>Child ID</th><td>${esc(c.child_id)}</td></tr>
        <tr><th>Age</th><td>${c.age}</td></tr>
        <tr><th>Gender</th><td>${esc(c.gender)}</td></tr>
        <tr><th>Grade</th><td>${esc(c.grade || "–")}</td></tr>
        <tr><th>Category</th><td>${esc(c.category)} <span class="muted">(research classification entered by the assessor)</span></td></tr>
        <tr><th>Session</th><td>${esc(SESSION_LABELS[c.session])}</td></tr>
        <tr><th>Date</th><td>${esc(c.assessment_date)}</td></tr>
      </table>
      ${unmarked ? `<p class="warn-text">${unmarked} question(s) are not marked. They will be saved as NOT_MARKED (not as incorrect).
        Use Previous to go back and mark them.</p>` : ""}
      ${sections.join("")}
      <label class="field">
        <span>Assessor notes (optional)</span>
        <textarea id="notes" rows="3" placeholder="e.g. child was tired, session interrupted">${esc(state.notes)}</textarea>
      </label>
    </div>`;
  el.querySelector("#notes").addEventListener("input", (e) => (state.notes = e.target.value));
}

/* ------------------------------------------------------------ metadata & submission */

/* Audio + recording times for one recording item; adds the file to `files`. */
function audioEntry(item, files) {
  if (item.recorder.status !== "RECORDED") {
    return { audio_file: null, recording_start_time: null, recording_end_time: null, recording_duration_seconds: null };
  }
  const file = `${item.folder}/${item.key}.${item.recorder.extension || "webm"}`;
  files.push({ path: file, blob: item.recorder.blob });
  return {
    audio_file: file,
    recording_start_time: localIso(item.timer.startTime),
    recording_end_time: localIso(item.timer.endTime),
    recording_duration_seconds: item.duration,
  };
}

function buildMetadata() {
  const c = state.child;
  const ct = state.content;
  const files = [];
  const meta = {
    schema_version: "2.1",
    protocol_version: PROTOCOL_VERSION,
    child_id: c.child_id,
    age: c.age,
    age_group: state.ageGroup,
    gender: c.gender,
    grade: c.grade || null,
    category: c.category,
    category_note: "Research classification entered by the assessor. Not a diagnosis.",
    session: c.session,
    session_label: SESSION_LABELS[c.session],
    assessment_date: c.assessment_date,
    created_at: localIso(state.startedAt),
    data_note: "Raw data collection only; nothing was calculated by the website. " +
      "Reading, RAN and memory: audio only. Phonological awareness and grapheme-phoneme knowledge: " +
      "assessor mark per question (CORRECT=1, INCORRECT=0, NOT_ATTEMPTED=null, NOT_MARKED=null).",
    handwriting: null,
    reading: null,
    phonological_awareness: null,
    grapheme_phoneme_knowledge: null,
    ran: null,
    memory: null,
    assessor_notes: state.notes.trim(),
  };

  if (ct.handwriting) {
    meta.handwriting = {};
    for (const part of ["copying", "dictation"]) {
      const hw = state.hw[part];
      if (!hw) continue;
      if (hw.timer.state === "running" || hw.timer.state === "paused") hw.timer.stop();
      meta.handwriting[part] = {
        text_id: ct.handwriting[part].text_id,
        text: ct.handwriting[part].text,
        start_time: localIso(hw.timer.startTime),
        end_time: localIso(hw.timer.endTime),
        duration_seconds: hw.timer.getDuration(),
        status: hw.status || "NOT_MARKED",
        ...(part === "dictation" ? { times_sentence_read: readCount(hw.timesRead) } : {}),
      };
    }
    meta.handwriting.image_note = "Handwriting images are collected and saved separately (not uploaded).";
  }

  if (ct.reading) {
    const r = ct.reading;
    meta.reading = {
      passage_id: r.passage_id,
      passage_title: r.title,
      passage_text: r.text,
      ...audioEntry(state.rec[`READING_${r.passage_id}`], files),
    };
  }

  for (const [moduleKey, metaKey] of [["phonological", "phonological_awareness"], ["grapheme_phoneme", "grapheme_phoneme_knowledge"]]) {
    if (!ct[moduleKey]) continue;
    meta[metaKey] = {
      sections: ct[moduleKey].sections.map((sec) => ({
        section_id: sec.id,
        title: sec.title,
        ...(sec.say ? { section_instruction: sec.say } : {}),
        items: sec.items.map((item) => {
          const mark = state.marks[questionKey(moduleKey, sec, item)];
          return {
            question_id: item.id,
            question: item.say,
            ...(item.options ? { options: item.options.map((o) => `${o.key}. ${o.text}`) } : {}),
            expected_answer_protocol: item.expected,
            ...(expectedOption(item) ? { expected_option: expectedOption(item).key } : {}),
            raw_response: mark.response.trim() || null,
            status: mark.status || "NOT_MARKED",
            score: MARKS.find((m) => m.value === mark.status)?.score ?? null,
          };
        }),
      })),
    };
  }

  if (ct.ran) {
    meta.ran = {
      tasks: ct.ran.tasks.map((t) => ({
        task_id: t.id,
        title: t.title,
        category: t.category,
        instruction: t.instruction,
        grid_id: t.grid_id,
        grid_source: RAN_GRID_SOURCE,
        grid_columns: t.columns,
        grid_rows: Math.ceil(t.items.length / t.columns),
        grid_items: t.items,
        ...audioEntry(state.rec[`RAN_${t.id}`], files),
      })),
    };
  }

  if (ct.memory) {
    const condition = ct.memory.condition;
    const block = {
      administered: true,
      condition,
      instruction: SCRIPTS.memory[condition],
      trials: memoryTrials().map((t) => ({
        level: t.level.id,
        level_label: t.level.label,
        trial: t.trial,
        target_sequence: t.sequence,
        ...audioEntry(state.rec[t.key], files),
      })),
    };
    const notHere = { administered: false, note: `${condition === "FORWARD" ? "Backward" : "Forward"} recall is administered in the other session.` };
    meta.memory = condition === "FORWARD" ? { forward: block, backward: notHere } : { forward: notHere, backward: block };
  }

  return { meta, files };
}

async function submitAssessment(overwrite = false) {
  const btn = document.getElementById("submit-btn");
  if (state.activeItem) await stopItem(state.activeItem);
  const { meta, files } = buildMetadata();

  const form = new FormData();
  form.append("metadata", JSON.stringify(meta));
  if (overwrite === true) form.append("overwrite", "true");
  for (const f of files) form.append(f.path, f.blob, f.path.split("/").pop());

  btn.disabled = true;
  btn.textContent = "Saving and emailing…";
  showBanner(null);
  let response, data;
  try {
    response = await fetch("/api/submit", { method: "POST", body: form });
    data = await response.json();
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Submit Assessment";
    showBanner("Could not reach the assessment server. Make sure the backend window (python app.py) is still running, " +
      "then click Submit Assessment again. Your recordings are still in this page – do not close or refresh it.");
    return;
  }
  btn.disabled = false;
  btn.textContent = "Submit Assessment";

  if (response.status === 409 && data.already_exists) {
    if (confirm(`${data.error}\n\nReplace it with this assessment?\n(The earlier copy is kept in a backup folder, not deleted.)`)) {
      return submitAssessment(true);
    }
    return;
  }
  if (!response.ok || !data.ok) {
    showBanner(`Submission failed: ${data.error || response.statusText}. Nothing was lost – please try again.`);
    return;
  }

  state.submitted = true;
  renderSuccess(data, meta);
}

function renderSuccess(result, meta) {
  headerInfoEl.innerHTML = "";
  appEl.innerHTML = `
    <div class="card success">
      <div class="big-check">✓</div>
      <h2>Assessment submitted successfully.</h2>
      <table class="info-table">
        <tr><th>Child ID</th><td>${esc(result.child_id)}</td></tr>
        <tr><th>Session</th><td>${esc(result.session)}</td></tr>
        <tr><th>Audio files saved</th><td>${result.audio_files}</td></tr>
      </table>
      <p>All recorded audio has been saved on this laptop.</p>
      <p class="muted">Saved in: <code>${esc(result.folder)}</code></p>
      ${result.previous_moved_to ? `<p class="muted">The earlier submission was moved to <code>${esc(result.previous_moved_to)}</code>.</p>` : ""}
      <div id="email-status" class="email-status"></div>
      <button class="btn btn-primary btn-large" id="new-btn">Start New Assessment</button>
    </div>`;
  document.getElementById("new-btn").addEventListener("click", () => {
    renderChildForm();
    checkServer();
  });
  showEmailResult(result.email || { status: "FAILED", message: "No email result received." }, result.child_id, result.session);
}

/* Show the result of the email that the backend sent during submission (or a retry). */
function showEmailResult(email, childId, session) {
  const el = document.getElementById("email-status");
  if (!el) return;
  const zips = (email.zip_files || []).join(", ");
  if (email.status === "SENT") {
    el.className = "email-status ok";
    el.textContent = "✉ " + email.message;
  } else if (email.status === "DISABLED") {
    el.className = "email-status muted";
    el.textContent = `Email is turned off. The data${zips ? ` and ${zips}` : ""} are saved on this laptop.`;
  } else {
    el.className = "email-status warn";
    el.innerHTML = `⚠ <strong>Saved locally, but the email was NOT sent.</strong><br>
      The assessment and all audio are safe on this laptop${zips ? ` (ZIP: <code>${esc(zips)}</code>)` : ""}.<br>
      <small>${esc(email.message)}</small><br>
      <button class="btn btn-secondary" id="retry-email">Retry Email</button><br>
      <small class="muted">If there is no internet now, you can retry later from the start page
      or with: <code>python app.py --send-pending</code></small>`;
    el.querySelector("#retry-email").addEventListener("click", () => retryEmail(childId, session));
  }
}

async function retryEmail(childId, session) {
  const el = document.getElementById("email-status");
  el.className = "email-status";
  el.textContent = "Sending email… (this can take a minute when recordings are attached)";
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ child_id: childId, session }),
    });
    showEmailResult(await res.json(), childId, session);
  } catch (err) {
    showEmailResult({ status: "FAILED", message: "The assessment server could not be reached." }, childId, session);
  }
}

/* ------------------------------------------------------------ start-up */

window.addEventListener("beforeunload", (e) => {
  if (state && !state.submitted) {
    e.preventDefault();
    e.returnValue = "";
  }
});

async function checkServer() {
  const footer = document.getElementById("footer-status");
  if (location.protocol === "file:") {
    showBanner("Please do not open index.html directly. Start the backend (python app.py) and open http://localhost:5000");
    return;
  }
  try {
    const res = await fetch("/api/status");
    const s = await res.json();
    footer.textContent = s.email_enabled
      ? (s.email_configured
        ? `Email notification: on${s.email_attach_audio ? " (recordings attached)" : ""}`
        : "Email notification: on, but not configured – check backend/.env")
      : "Email notification: off";
    if (s.station_name) footer.textContent += ` · Laptop: ${s.station_name}`;
    if (s.pending_emails > 0 && !state) showPendingNotice(s.pending_emails);
  } catch {
    showBanner("The assessment server is not running. Start it with: python app.py");
  }
}

/* Start page notice: saved assessments whose email has not been sent yet. */
function showPendingNotice(count) {
  const card = appEl.querySelector(".card");
  if (!card || document.getElementById("pending-notice")) return;
  const box = document.createElement("div");
  box.id = "pending-notice";
  box.className = "email-status warn";
  box.innerHTML = `<span id="pending-text">⚠ ${count} saved assessment${count > 1 ? "s have" : " has"} not been emailed yet (the files are safe on this laptop).</span>
    <br><button class="btn btn-secondary" id="send-pending">Send pending emails now</button>
    <div id="pending-result"></div>`;
  card.prepend(box);
  box.querySelector("#send-pending").addEventListener("click", async (e) => {
    e.target.disabled = true;
    e.target.textContent = "Sending…";
    const out = box.querySelector("#pending-result");
    try {
      const res = await fetch("/api/send-pending", { method: "POST" });
      const data = await res.json();
      out.innerHTML = data.results.map((r) =>
        `<div>${esc(r.child_id)} ${esc(r.session)}: ${r.status === "SENT" ? "✓ sent" : "not sent – " + esc(r.message)}</div>`).join("");
      if (data.remaining === 0) {
        box.className = "email-status ok";
        box.querySelector("#pending-text").textContent = "✓ All pending assessments have been emailed.";
        e.target.remove();
      } else {
        e.target.disabled = false;
        e.target.textContent = "Try again";
      }
    } catch {
      out.textContent = "The assessment server could not be reached.";
      e.target.disabled = false;
      e.target.textContent = "Try again";
    }
  });
}

renderChildForm();
checkServer();
