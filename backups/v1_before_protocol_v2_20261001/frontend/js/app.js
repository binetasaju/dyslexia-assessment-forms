/*
 * Main application: child information form, step-by-step assessment,
 * review page and submission.
 *
 * Question content comes from assessment-data.js.
 * Timer and AudioRecorder come from timer.js and recorder.js.
 */

const SESSION_LABELS = {
  S01: "Session 1 – Primary Assessment",
  S02: "Session 2 – Follow-up Assessment",
};
const CHILD_ID_PATTERN = /^[A-Za-z0-9_-]{2,30}$/;

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

function setPath(obj, path, value) {
  let node = obj;
  for (let i = 0; i < path.length - 1; i++) {
    node[path[i]] = node[path[i]] || {};
    node = node[path[i]];
  }
  node[path[path.length - 1]] = value;
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

        <label class="field">
          <span>Age <span class="req">*</span></span>
          <select id="age">
            <option value="">Select age</option>
            ${ages.map((a) => `<option value="${a}">${a}</option>`).join("")}
          </select>
        </label>

        <fieldset class="field">
          <legend>Gender <span class="req">*</span></legend>
          <div class="choice-row">
            ${["Male", "Female", "Other"].map((g) => `
              <label class="choice"><input type="radio" name="gender" value="${g}" /> ${g}</label>`).join("")}
          </div>
        </fieldset>

        <label class="field">
          <span>Category <span class="req">*</span></span>
          <select id="category">
            <option value="">Select category</option>
            <option>Dyslexic</option>
            <option>Dysgraphic</option>
            <option>Normal</option>
            <option>Other</option>
          </select>
          <small class="muted">Research classification entered by the assessor. This website does not diagnose.</small>
        </label>

        <fieldset class="field">
          <legend>Session <span class="req">*</span></legend>
          <div class="choice-col">
            ${Object.entries(SESSION_LABELS).map(([id, label]) => `
              <label class="choice"><input type="radio" name="session" value="${id}" /> ${label}</label>`).join("")}
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
  const gender = document.querySelector("input[name=gender]:checked")?.value;
  const category = document.getElementById("category").value;
  const session = document.querySelector("input[name=session]:checked")?.value;

  let error = null;
  if (!childId) error = "Please enter a Child ID before continuing.";
  else if (!CHILD_ID_PATTERN.test(childId))
    error = "Child ID can only contain letters, numbers, '-' or '_' (2–30 characters), e.g. CH001.";
  else if (!age) error = "Please select the child's age.";
  else if (!gender) error = "Please select the child's gender.";
  else if (!category) error = "Please select a category.";
  else if (!session) error = "Please select Session 1 or Session 2.";
  if (error) {
    errEl.textContent = error;
    return;
  }

  const content = getSessionContent(session, age);
  state = {
    child: { child_id: childId, age: Number(age), gender, category, session },
    ageGroup: getAgeGroup(age),
    content,
    startedAt: new Date(),
    handwriting: {},
    items: {}, // recording items, keyed by file base name
    itemOrder: [],
    activeItem: null,
    notes: "",
    submitted: false,
  };

  buildState();
  state.steps = MODULE_ORDER.filter((m) => content[m]).map((m) => ({ type: m, title: MODULE_TITLES[m] }));
  if (state.steps.length === 0) {
    const ph = session2Data.placeholder;
    state.steps.push({ type: "placeholder", title: ph.title });
  }
  state.steps.push({ type: "review", title: "Review & Submit" });
  state.stepIndex = 0;
  renderStep();
}

/* ------------------------------------------------------------ assessment state */

function buildState() {
  const c = state.content;

  if (c.handwriting) {
    for (const task of c.handwriting.tasks) {
      state.handwriting[task.id] = {
        task,
        selected: task.options.length === 1 ? task.options[0].id : null,
        status: null,
        timer: new Timer((s) => {
          const el = document.getElementById(`hwtimer-${task.id}`);
          if (el) el.textContent = Timer.format(s);
          updateHandwritingButtons(task.id);
        }),
      };
    }
  }

  if (c.reading) {
    for (const p of c.reading.passages) {
      addItem({
        key: `reading_${p.id}`, folder: "reading", module: "reading",
        metaPath: ["reading", p.id], extra: { passage_text: p.text },
        label: `Passage ${p.id}`,
      });
    }
  }

  if (c.phonological) {
    for (const sec of c.phonological.sections) {
      sec.items.forEach((prompt, i) => {
        const q = `Q${pad2(i + 1)}`;
        addItem({
          key: `${sec.id}_${q}`, folder: "phonological", module: "phonological", section: sec.id,
          metaPath: ["phonological_awareness", sec.id, "items", q], extra: { prompt },
          label: prompt,
        });
      });
    }
  }

  if (c.ran) {
    for (const t of c.ran.tasks) {
      addItem({
        key: `RAN_${t.id}`, folder: "ran", module: "ran",
        metaPath: ["ran", t.id],
        extra: { title: t.title, stimuli: t.stimuli.map((s) => s.name) },
        label: `${t.id} – ${t.title}`,
      });
    }
  }

  if (c.memory) {
    for (const cond of memoryConditions) {
      for (const lvl of c.memory.levels) {
        lvl.sequences.forEach((seq, i) => {
          const q = `Q${pad2(i + 1)}`;
          addItem({
            key: `MEM_${cond.id}_${lvl.id}_${q}`, folder: "memory", module: "memory", section: cond.id,
            metaPath: ["memory", cond.id, lvl.id, q],
            extra: { level: lvl.label, sequence: seq.join(" – ") },
            label: seq.join(" – "),
          });
        });
      }
    }
  }
}

function addItem(def) {
  const item = {
    ...def,
    status: "NOT_ATTEMPTED", // NOT_ATTEMPTED | RECORDING | COMPLETED | SKIPPED
    duration: 0,
    recorder: new AudioRecorder(),
    error: "",
  };
  item.timer = new Timer((s) => {
    const el = document.getElementById(`timer-${item.key}`);
    if (el) el.textContent = Timer.format(s);
  });
  state.items[item.key] = item;
  state.itemOrder.push(item.key);
}

/* ------------------------------------------------------------ step rendering */

function renderHeaderInfo() {
  const c = state.child;
  headerInfoEl.innerHTML = `
    <span><strong>Child ID:</strong> ${esc(c.child_id)}</span>
    <span><strong>Age:</strong> ${c.age}</span>
    <span><strong>Session:</strong> ${c.session === "S01" ? "Session 1" : "Session 2"}</span>`;
}

function renderStep() {
  showBanner(null);
  renderHeaderInfo();
  const step = state.steps[state.stepIndex];
  const total = state.steps.length;
  const n = state.stepIndex + 1;

  const renderers = {
    handwriting: renderHandwriting,
    reading: renderReading,
    phonological: renderPhonological,
    ran: renderRan,
    memory: renderMemory,
    placeholder: renderPlaceholder,
    review: renderReview,
  };

  appEl.innerHTML = `
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
    </div>`;

  renderers[step.type](document.getElementById("step-body"));

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

/* ---- Handwriting */

function renderHandwriting(el) {
  const hw = state.content.handwriting;
  el.innerHTML = `
    <div class="card">
      <h2>Handwriting</h2>
      <p class="say">${esc(hw.intro)}</p>
      <p class="muted">Collect the child's writing sheet and photograph it separately. Photos are not uploaded here.</p>
    </div>
    ${hw.tasks.map(handwritingTaskHtml).join("")}`;

  el.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name?.startsWith("hwopt-")) {
      const id = t.name.slice(6);
      state.handwriting[id].selected = t.value;
      el.querySelectorAll(`[data-hwopt="${id}"]`).forEach((o) => o.classList.toggle("selected", o.dataset.opt === t.value));
    }
    if (t.name?.startsWith("hwstatus-")) {
      state.handwriting[t.name.slice(9)].status = t.value;
    }
  });
  el.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-hwaction]");
    if (!btn) return;
    const id = btn.dataset.task;
    const hwState = state.handwriting[id];
    const timer = hwState.timer;
    const action = btn.dataset.hwaction;
    if (action === "start") timer.start();
    if (action === "pause") timer.pause();
    if (action === "stop") {
      timer.stop();
      if (!hwState.status) {
        hwState.status = "COMPLETED";
        const radio = el.querySelector(`input[name="hwstatus-${id}"][value="COMPLETED"]`);
        if (radio) radio.checked = true;
      }
    }
    if (action === "reset" && (timer.getDuration() === 0 || confirm("Reset this timer to 00:00?"))) timer.reset();
    updateHandwritingButtons(id);
  });
  hw.tasks.forEach((t) => updateHandwritingButtons(t.id));
}

function handwritingTaskHtml(task) {
  const s = state.handwriting[task.id];
  const options = task.options.length
    ? `<div class="field"><span class="field-label">${esc(task.selectLabel)}:</span>
        ${task.options.map((o) => `
          <label class="option ${s.selected === o.id ? "selected" : ""}" data-hwopt="${task.id}" data-opt="${esc(o.id)}">
            <input type="radio" name="hwopt-${task.id}" value="${esc(o.id)}" ${s.selected === o.id ? "checked" : ""} />
            <span class="option-label">${esc(o.label)}</span>
            <span class="passage">${esc(o.text)}</span>
          </label>`).join("")}
      </div>`
    : "";
  return `
    <div class="card">
      <h3>${esc(task.title)}</h3>
      <p class="say">${esc(task.instruction)}</p>
      ${task.note ? `<p class="note">${esc(task.note)}</p>` : ""}
      ${options}
      <div class="timer-row">
        <span class="timer big" id="hwtimer-${task.id}">${Timer.format(s.timer.getDuration())}</span>
        <button class="btn btn-go" data-hwaction="start" data-task="${task.id}">▶ Start Timer</button>
        <button class="btn btn-secondary" data-hwaction="pause" data-task="${task.id}">❚❚ Pause</button>
        <button class="btn btn-stop" data-hwaction="stop" data-task="${task.id}">■ Stop Timer</button>
        <button class="btn btn-secondary" data-hwaction="reset" data-task="${task.id}">↺ Reset</button>
      </div>
      <fieldset class="field">
        <legend>Status</legend>
        <div class="choice-row">
          <label class="choice"><input type="radio" name="hwstatus-${task.id}" value="COMPLETED" ${s.status === "COMPLETED" ? "checked" : ""}/> Completed</label>
          <label class="choice"><input type="radio" name="hwstatus-${task.id}" value="NOT_COMPLETED" ${s.status === "NOT_COMPLETED" ? "checked" : ""}/> Not Completed</label>
        </div>
      </fieldset>
    </div>`;
}

function updateHandwritingButtons(id) {
  const hwState = state && state.handwriting[id];
  if (!hwState || !hwState.timer) return; // timer is still being created
  const timer = hwState.timer;
  const q =(a) => document.querySelector(`[data-hwaction="${a}"][data-task="${id}"]`);
  if (!q("start")) return;
  q("start").textContent = timer.state === "paused" ? "▶ Resume" : "▶ Start Timer";
  q("start").disabled = timer.state === "running";
  q("pause").disabled = timer.state !== "running";
  q("stop").disabled = !(timer.state === "running" || timer.state === "paused");
  q("reset").disabled = timer.state === "idle";
  document.getElementById(`hwtimer-${id}`).classList.toggle("running", timer.state === "running");
}

/* ---- Recording widget (shared by reading, PA, RAN, memory) */

function recordingWidgetHtml(item) {
  return `
    <div class="rec" id="item-${item.key}">
      <div class="rec-controls">
        <button class="btn btn-rec" data-action="start" data-key="${item.key}">● Start Recording</button>
        <button class="btn btn-stop" data-action="stop" data-key="${item.key}">■ Stop Recording</button>
        <button class="btn btn-secondary" data-action="play" data-key="${item.key}">▶ Play</button>
        <button class="btn btn-secondary" data-action="rerecord" data-key="${item.key}">↻ Re-record</button>
        <span class="timer" id="timer-${item.key}">${Timer.format(item.timer.getDuration())}</span>
      </div>
      <div class="rec-controls">
        <span class="rec-state" id="state-${item.key}"></span>
        <span class="spacer"></span>
        <button class="btn btn-ok" data-action="complete" data-key="${item.key}">✓ Complete</button>
        <button class="btn btn-skip" data-action="skip" data-key="${item.key}">Skip Question</button>
      </div>
      <div class="rec-error" id="error-${item.key}" role="alert"></div>
    </div>`;
}

function updateItemUI(item) {
  const box = document.getElementById(`item-${item.key}`);
  if (!box) return;
  const btn = (a) => box.querySelector(`[data-action="${a}"]`);
  const recording = item.status === "RECORDING";
  const hasAudio = item.recorder.status === "RECORDED";

  btn("start").disabled = recording || hasAudio;
  btn("stop").disabled = !recording;
  btn("play").disabled = !hasAudio;
  btn("rerecord").disabled = !hasAudio;
  btn("complete").disabled = recording || item.status === "COMPLETED";
  btn("skip").disabled = recording || item.status === "SKIPPED";

  const stateEl = document.getElementById(`state-${item.key}`);
  const labels = {
    NOT_ATTEMPTED: ["Not recorded yet", "st-idle"],
    RECORDING: ["● Recording", "st-recording"],
    COMPLETED: [hasAudio
      ? `✓ Recording stopped – Duration ${Timer.format(item.duration)}`
      : "✓ Completed (no audio)", "st-done"],
    SKIPPED: ["Skipped", "st-skipped"],
  };
  const [text, cls] = labels[item.status];
  stateEl.textContent = text;
  stateEl.className = `rec-state ${cls}`;
  box.className = `rec ${cls}`;
  document.getElementById(`timer-${item.key}`).classList.toggle("running", recording);
  document.getElementById(`error-${item.key}`).textContent = item.error;
  box.closest("[data-section-count]") && updateSectionCount(box.closest("[data-section-count]"));
}

function updateSectionCount(sectionEl) {
  const keys = sectionEl.dataset.sectionCount.split(",");
  const done = keys.filter((k) => ["COMPLETED", "SKIPPED"].includes(state.items[k].status)).length;
  const el = sectionEl.querySelector(".section-count");
  if (el) el.textContent = `${done} of ${keys.length} done`;
}

function bindRecordingWidgets(container) {
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const item = state.items[btn.dataset.key];
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
          item.recorder.deleteRecording();
          item.status = "NOT_ATTEMPTED";
          await startItem(item);
        }
        break;
      case "complete":
        if (item.recorder.status !== "RECORDED" &&
            !confirm("No audio has been recorded for this question.\nMark it as completed without audio?")) break;
        item.status = "COMPLETED";
        break;
      case "skip":
        if (item.recorder.status === "RECORDED" && !confirm("Delete the recording and mark this question as skipped?")) break;
        item.recorder.deleteRecording();
        item.timer.reset();
        item.duration = 0;
        item.status = "SKIPPED";
        break;
    }
    updateItemUI(item);
  });
  container.querySelectorAll(".rec").forEach((box) => updateItemUI(state.items[box.id.slice(5)]));
  container.querySelectorAll("[data-section-count]").forEach(updateSectionCount);
}

async function startItem(item) {
  if (state.activeItem && state.activeItem !== item) await stopItem(state.activeItem);
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
  item.status = "RECORDING";
  state.activeItem = item;
  updateItemUI(item);
}

async function stopItem(item) {
  if (item.status !== "RECORDING") return;
  item.timer.stop();
  state.activeItem = null;
  try {
    const result = await item.recorder.stopRecording();
    item.duration = result.duration;
    item.status = "COMPLETED";
  } catch (err) {
    item.error = err.message;
    item.status = "NOT_ATTEMPTED";
    item.timer.reset();
  }
  updateItemUI(item);
}

/* ---- Reading */

function renderReading(el) {
  const r = state.content.reading;
  el.innerHTML = `
    <div class="card">
      <h2>Reading Task</h2>
      <p class="say">${esc(r.instruction)}</p>
      <p class="muted">Press <strong>Start Recording</strong> when the child begins reading and <strong>Stop Recording</strong> when they finish.</p>
    </div>
    ${r.passages.map((p) => `
      <div class="card">
        <h3>Passage ${esc(p.id)}</h3>
        <p class="passage reading-passage">${esc(p.text)}</p>
        ${recordingWidgetHtml(state.items[`reading_${p.id}`])}
      </div>`).join("")}`;
  bindRecordingWidgets(el);
}

/* ---- Phonological awareness */

function renderPhonological(el) {
  const pa = state.content.phonological;
  el.innerHTML = `
    <div class="card">
      <h2>Phonological Awareness</h2>
      <p class="muted">For each question: read the prompt, record the child's answer, then go to the next question.
      Use <strong>Skip Question</strong> if the child does not answer.</p>
    </div>
    ${pa.sections.map((sec) => {
      const keys = sec.items.map((_, i) => `${sec.id}_Q${pad2(i + 1)}`);
      return `
      <div class="card" data-section-count="${keys.join(",")}">
        <div class="card-head">
          <h3>${esc(sec.id)} – ${esc(sec.title)}</h3>
          <span class="section-count"></span>
        </div>
        <p class="note">${esc(sec.instruction)}</p>
        ${keys.map((k, i) => `
          <div class="question">
            <div class="q-label"><span class="q-num">Q${pad2(i + 1)}</span> <span class="q-prompt">${esc(sec.items[i])}</span></div>
            ${recordingWidgetHtml(state.items[k])}
          </div>`).join("")}
      </div>`;
    }).join("")}`;
  bindRecordingWidgets(el);
}

/* ---- RAN */

function renderRan(el) {
  const ran = state.content.ran;
  el.innerHTML = `
    <div class="card">
      <h2>Rapid Automatized Naming (RAN)</h2>
      <p class="muted">Turn the screen towards the child for the grid. Start recording when you say "Go".</p>
      <label class="choice"><input type="checkbox" id="ran-names" /> Show expected names (assessor only)</label>
    </div>
    ${ran.tasks.map((t) => `
      <div class="card">
        <h3>${esc(t.id)} – ${esc(t.title)}</h3>
        <p class="say">${esc(t.instruction)}</p>
        <div class="ran-grid" style="grid-template-columns: repeat(${t.columns}, 1fr)">
          ${t.stimuli.map((s) => `
            <div class="ran-cell">
              ${s.colour
                ? `<span class="ran-colour" style="background:${s.colour}" aria-label="${esc(s.name)}"></span>`
                : `<span class="ran-symbol">${esc(s.display)}</span>`}
              <span class="ran-name">${esc(s.name)}</span>
            </div>`).join("")}
        </div>
        ${recordingWidgetHtml(state.items[`RAN_${t.id}`])}
      </div>`).join("")}`;
  el.querySelector("#ran-names").addEventListener("change", (e) => {
    el.classList.toggle("show-ran-names", e.target.checked);
  });
  bindRecordingWidgets(el);
}

/* ---- Memory */

function renderMemory(el) {
  const mem = state.content.memory;
  el.innerHTML = `
    <div class="card">
      <h2>Memory Task</h2>
      <div class="assessor-only">ASSESSOR ONLY – DO NOT SHOW TO CHILD</div>
      <p class="muted">Read each sequence aloud to the child (about one digit per second), then record the child's spoken answer.
      The website does not check whether the answer is correct.</p>
    </div>
    ${memoryConditions.map((cond) => {
      const keys = mem.levels.flatMap((l) => l.sequences.map((_, i) => `MEM_${cond.id}_${l.id}_Q${pad2(i + 1)}`));
      return `
      <div class="card" data-section-count="${keys.join(",")}">
        <div class="card-head">
          <h3>Condition: ${esc(cond.title)}</h3>
          <span class="section-count"></span>
        </div>
        <p class="say">${esc(cond.instruction)}</p>
        ${mem.levels.map((lvl) => `
          <h4>Level: ${esc(lvl.label)}</h4>
          ${lvl.sequences.map((seq, i) => {
            const item = state.items[`MEM_${cond.id}_${lvl.id}_Q${pad2(i + 1)}`];
            return `
            <div class="question">
              <div class="q-label">
                <span class="q-num">Q${pad2(i + 1)}</span>
                <span class="assessor-tag">ASSESSOR ONLY</span>
                <span class="sequence">${esc(seq.join(" – "))}</span>
              </div>
              ${recordingWidgetHtml(item)}
            </div>`;
          }).join("")}`).join("")}
      </div>`;
    }).join("")}`;
  bindRecordingWidgets(el);
}

/* ---- Session 2 placeholder */

function renderPlaceholder(el) {
  const ph = session2Data.placeholder;
  el.innerHTML = `
    <div class="card">
      <h2>${esc(ph.title)}</h2>
      <p>${esc(ph.message)}</p>
      <p class="muted">You can still submit this session; it will save the child information only.</p>
    </div>`;
}

/* ---- Review */

function statusText(item) {
  if (item.status === "COMPLETED") {
    return item.recorder.status === "RECORDED"
      ? `Recorded – ${Math.round(item.duration)} sec`
      : "Completed (no audio)";
  }
  if (item.status === "SKIPPED") return "Skipped";
  return `<span class="warn-text">Not attempted</span>`;
}

function countStatuses(items) {
  const c = { COMPLETED: 0, SKIPPED: 0, NOT_ATTEMPTED: 0 };
  items.forEach((i) => (c[i.status === "RECORDING" ? "NOT_ATTEMPTED" : i.status] += 1));
  return c;
}

function countLine(c) {
  return `${c.COMPLETED} completed, ${c.SKIPPED} skipped` +
    (c.NOT_ATTEMPTED ? `, <span class="warn-text">${c.NOT_ATTEMPTED} not attempted</span>` : "");
}

function renderReview(el) {
  const c = state.child;
  const items = state.itemOrder.map((k) => state.items[k]);
  const byModule = (m) => items.filter((i) => i.module === m);
  const sections = [];

  if (state.content.handwriting) {
    sections.push(`<h3>Handwriting</h3><ul>${state.content.handwriting.tasks.map((t) => {
      const s = state.handwriting[t.id];
      const status = s.status === "COMPLETED" ? "Completed" : s.status === "NOT_COMPLETED" ? "Not Completed"
        : `<span class="warn-text">No status selected</span>`;
      const opt = t.options.find((o) => o.id === s.selected);
      const running = s.timer.state === "running" || s.timer.state === "paused"
        ? ` <span class="warn-text">(timer still running – will be stopped on submit)</span>` : "";
      return `<li>${esc(t.id)}: ${status} – ${Math.round(s.timer.getDuration())} sec${opt ? ` (${esc(opt.label)})` : ""}${running}</li>`;
    }).join("")}</ul>`);
  }
  if (state.content.reading) {
    sections.push(`<h3>Reading</h3><ul>${byModule("reading").map((i) =>
      `<li>${esc(i.label)}: ${statusText(i)}</li>`).join("")}</ul>`);
  }
  if (state.content.phonological) {
    const pa = byModule("phonological");
    sections.push(`<h3>Phonological Awareness</h3><p>${countLine(countStatuses(pa))}</p><ul>${
      state.content.phonological.sections.map((sec) =>
        `<li>${esc(sec.id)} – ${esc(sec.title)}: ${countLine(countStatuses(pa.filter((i) => i.section === sec.id)))}</li>`).join("")}</ul>`);
  }
  if (state.content.ran) {
    sections.push(`<h3>RAN</h3><ul>${byModule("ran").map((i) =>
      `<li>${esc(i.label)}: ${statusText(i)}</li>`).join("")}</ul>`);
  }
  if (state.content.memory) {
    const mem = byModule("memory");
    sections.push(`<h3>Memory</h3><ul>${memoryConditions.map((cond) =>
      `<li>${esc(cond.title)}: ${countLine(countStatuses(mem.filter((i) => i.section === cond.id)))}</li>`).join("")}</ul>`);
  }

  const recorded = items.filter((i) => i.recorder.status === "RECORDED").length;
  el.innerHTML = `
    <div class="card review">
      <h2>Assessment Review</h2>
      <table class="info-table">
        <tr><th>Child ID</th><td>${esc(c.child_id)}</td></tr>
        <tr><th>Age</th><td>${c.age}</td></tr>
        <tr><th>Gender</th><td>${esc(c.gender)}</td></tr>
        <tr><th>Category</th><td>${esc(c.category)}</td></tr>
        <tr><th>Session</th><td>${esc(SESSION_LABELS[c.session])}</td></tr>
      </table>
      ${sections.join("") || "<p>No tasks in this session yet.</p>"}
      <p><strong>Audio recordings to save:</strong> ${recorded}</p>
      <label class="field">
        <span>Assessor notes (optional)</span>
        <textarea id="notes" rows="3" placeholder="e.g. child was tired, session interrupted">${esc(state.notes)}</textarea>
      </label>
      <p class="muted">Questions marked "Not attempted" will be saved as NOT_ATTEMPTED. You can go back with Previous to finish them.</p>
    </div>`;
  el.querySelector("#notes").addEventListener("input", (e) => (state.notes = e.target.value));
}

/* ------------------------------------------------------------ metadata & submission */

function buildMetadata() {
  const c = state.child;
  const meta = {
    child_id: c.child_id,
    age: c.age,
    age_group: state.ageGroup,
    gender: c.gender,
    category: c.category,
    category_note: "Research classification entered by the assessor. Not a diagnosis.",
    session: c.session,
    session_label: SESSION_LABELS[c.session],
    created_at: localIso(state.startedAt),
    handwriting: {},
    reading: {},
    phonological_awareness: {},
    ran: {},
    memory: {},
    assessor_notes: state.notes.trim(),
  };

  if (state.content.handwriting) {
    for (const task of state.content.handwriting.tasks) {
      const s = state.handwriting[task.id];
      if (s.timer.state === "running" || s.timer.state === "paused") s.timer.stop();
      const entry = {};
      if (task.metaKey) {
        const opt = task.options.find((o) => o.id === s.selected);
        entry[task.metaKey] = s.selected;
        entry.selected_text = opt ? opt.text : null;
      } else {
        entry.prompt = task.instruction;
      }
      entry.start_time = localIso(s.timer.startTime);
      entry.end_time = localIso(s.timer.endTime);
      entry.duration_seconds = s.timer.getDuration();
      entry.status = s.status || "NOT_MARKED";
      meta.handwriting[task.id] = entry;
    }
  }

  if (state.content.phonological) {
    for (const sec of state.content.phonological.sections) {
      meta.phonological_awareness[sec.id] = { title: sec.title, items: {} };
    }
  }

  const files = [];
  for (const key of state.itemOrder) {
    const item = state.items[key];
    const entry = { ...item.extra };
    if (item.status === "COMPLETED" && item.recorder.status === "RECORDED") {
      const file = `${item.folder}/${item.key}.${item.recorder.extension || "webm"}`;
      entry.file = file;
      entry.duration_seconds = item.duration;
      entry.status = "COMPLETED";
      files.push({ path: file, blob: item.recorder.blob });
    } else if (item.status === "COMPLETED") {
      entry.file = null;
      entry.status = "COMPLETED";
      entry.note = "Marked completed without audio";
    } else {
      entry.status = item.status === "SKIPPED" ? "SKIPPED" : "NOT_ATTEMPTED";
    }
    setPath(meta, item.metaPath, entry);
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
