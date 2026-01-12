(() => {
  const { buildTimeline } = window.DiveSim.sim;
  const { normalizePoints } = window.DiveSim.profile;
  const { clamp, drawScene, updateReadouts } = window.DiveSim.ui;

  const canvas = document.getElementById("profile");
  const ctx = canvas.getContext("2d");
  const depthReadout = document.getElementById("depth-readout");
  const timeReadout = document.getElementById("time-readout");
  const depthAxis = document.getElementById("depth-axis");
  const timeAxis = document.getElementById("time-axis");
  const satAxis = document.getElementById("sat-axis");
  const totalTimeInput = document.getElementById("total-time");
  const maxDepthInput = document.getElementById("max-depth");
  const gfLowInput = document.getElementById("gf-low");
  const gfHighInput = document.getElementById("gf-high");
  const gfLowValue = document.getElementById("gf-low-value");
  const gfHighValue = document.getElementById("gf-high-value");
  const clearBtn = document.getElementById("clear-btn");

  const state = {
    points: [],
    drawing: false,
    lastPoint: null,
    lastIndex: null,
    totalMinutes: Number(totalTimeInput.value),
    maxDepth: Number(maxDepthInput.value),
    stepSec: 60,
    timeline: [],
    currentTime: 0,
    gfLow: (Number(gfLowInput?.value) || 30) / 100,
    gfHigh: (Number(gfHighInput?.value) || 85) / 100
  };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function renderAxis(axisEl, labels) {
    if (!axisEl) return;
    axisEl.innerHTML = "";
    labels.forEach((label) => {
      const span = document.createElement("span");
      span.textContent = label;
      axisEl.appendChild(span);
    });
  }

  function updateAxes() {
    const gridY = 6;
    const gridX = 8;
    const depthLabels = [];
    for (let i = 0; i <= gridY; i++) {
      const depthValue = (i / gridY) * state.maxDepth;
      depthLabels.push(`${depthValue.toFixed(0)} m`);
    }
    renderAxis(depthAxis, depthLabels);

    const timeLabels = [];
    for (let i = 0; i <= gridX; i++) {
      const timeValue = (i / gridX) * state.totalMinutes;
      timeLabels.push(`${timeValue.toFixed(0)} min`);
    }
    renderAxis(timeAxis, timeLabels);

    const satLabels = [];
    for (let i = 0; i <= gridY; i++) {
      const value = ((gridY - i) / gridY) * 100;
      satLabels.push(`${value.toFixed(0)}%`);
    }
    renderAxis(satAxis, satLabels);
  }

  function toProfile(x, y) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const t = clamp(x / width, 0, 1);
    const depth = clamp(y / height, 0, 1) * state.maxDepth;
    return { t, depth };
  }

  function getStepCount() {
    return Math.max(1, Math.ceil((state.totalMinutes * 60) / state.stepSec));
  }

  function quantizePoint(point) {
    const steps = getStepCount();
    const index = clamp(Math.round(point.t * steps), 0, steps);
    return {
      index,
      t: index / steps,
      depth: point.depth
    };
  }

  function getActivePoints() {
    return state.points.filter(Boolean);
  }

  function setFlatProfile() {
    const steps = getStepCount();
    state.points = Array.from({ length: steps + 1 }, (_, index) => ({
      t: index / steps,
      depth: 0
    }));
  }

  function reindexPoints() {
    const existing = getActivePoints();
    if (!existing.length) {
      setFlatProfile();
      return;
    }
    state.points = [];
    existing.forEach((point) => addPoint(point));
  }

  function addPoint(point) {
    const { index, t, depth } = quantizePoint(point);
    state.points[index] = { t, depth };
    state.lastPoint = { t, depth };
    state.lastIndex = index;
  }

  function fillBetweenPoints(fromPoint, toPoint) {
    if (!fromPoint || !toPoint) {
      addPoint(toPoint);
      return;
    }
    const from = quantizePoint(fromPoint);
    const to = quantizePoint(toPoint);
    const start = Math.min(from.index, to.index);
    const end = Math.max(from.index, to.index);
    const span = Math.max(1, end - start);
    for (let i = start; i <= end; i++) {
      const mix = (i - start) / span;
      const depth = from.depth + (to.depth - from.depth) * mix;
      const t = i / getStepCount();
      state.points[i] = { t, depth };
    }
    state.lastPoint = { t: to.t, depth: to.depth };
    state.lastIndex = to.index;
  }

  function rebuildTimeline() {
    state.timeline = buildTimeline({
      points: getActivePoints(),
      totalMinutes: state.totalMinutes,
      stepSec: state.stepSec,
      gfLow: state.gfLow,
      gfHigh: state.gfHigh
    });
    state.currentTime = clamp(state.currentTime, 0, state.totalMinutes);
    updateAxes();
    draw();
    updateFromTime(state.currentTime);
  }

function updateFromTime(minutes) {
  const stepMinutes = Math.max(5, state.stepSec) / 60;
  const index = Math.min(state.timeline.length - 1, Math.round(minutes / stepMinutes));
    updateReadouts({
      snapshot: state.timeline[index],
      depthReadout,
      timeReadout
    });
  draw();
}

function setCurrentTime(minutes) {
  state.currentTime = clamp(minutes, 0, state.totalMinutes);
  updateFromTime(state.currentTime);
}

  function draw() {
    const profilePoints = normalizePoints(getActivePoints());
    drawScene(ctx, canvas, state, profilePoints, state.timeline);
  }

  canvas.addEventListener("pointerdown", (event) => {
    state.drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const point = toProfile(event.offsetX, event.offsetY);
    const bucketed = quantizePoint(point);
    fillBetweenPoints(state.lastPoint, point);
    rebuildTimeline();
    setCurrentTime(bucketed.t * state.totalMinutes);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.drawing) return;
    const point = toProfile(event.offsetX, event.offsetY);
    const bucketed = quantizePoint(point);
    fillBetweenPoints(state.lastPoint, point);
    rebuildTimeline();
    setCurrentTime(bucketed.t * state.totalMinutes);
  });

  canvas.addEventListener("pointerup", (event) => {
    state.drawing = false;
    canvas.releasePointerCapture(event.pointerId);
    const point = toProfile(event.offsetX, event.offsetY);
    const bucketed = quantizePoint(point);
    fillBetweenPoints(state.lastPoint, point);
    rebuildTimeline();
    setCurrentTime(bucketed.t * state.totalMinutes);
  });

  canvas.addEventListener("pointerleave", () => {
    state.drawing = false;
    state.lastPoint = null;
    state.lastIndex = null;
  });

  totalTimeInput.addEventListener("change", () => {
    state.totalMinutes = clamp(Number(totalTimeInput.value) || 40, 5, 180);
    totalTimeInput.value = state.totalMinutes;
    updateAxes();
    reindexPoints();
    rebuildTimeline();
    setCurrentTime(0);
  });

  maxDepthInput.addEventListener("change", () => {
    state.maxDepth = clamp(Number(maxDepthInput.value) || 30, 6, 60);
    maxDepthInput.value = state.maxDepth;
    updateAxes();
    rebuildTimeline();
  });

  function updateGfDisplay() {
    if (gfLowValue && gfLowInput) gfLowValue.textContent = String(gfLowInput.value);
    if (gfHighValue && gfHighInput) gfHighValue.textContent = String(gfHighInput.value);
  }

  function applyGf(inputEl, outputEl, key, fallback) {
    if (!inputEl) return;
    const raw = Number(inputEl.value);
    const percent = clamp(Number.isFinite(raw) ? raw : fallback, 0, 100);
    inputEl.value = String(percent);
    state[key] = percent / 100;
    if (gfLowInput && gfHighInput) {
      const low = Number(gfLowInput.value);
      const high = Number(gfHighInput.value);
      if (low > high) {
        if (key === "gfLow") {
          gfHighInput.value = String(low);
          if (gfHighValue) gfHighValue.textContent = String(low);
          state.gfHigh = low / 100;
        } else {
          gfLowInput.value = String(high);
          if (gfLowValue) gfLowValue.textContent = String(high);
          state.gfLow = high / 100;
        }
      }
    }
    updateGfDisplay();
    rebuildTimeline();
  }

  if (gfLowInput) {
    const handler = () => applyGf(gfLowInput, gfLowValue, "gfLow", 30);
    gfLowInput.addEventListener("input", handler);
    gfLowInput.addEventListener("change", handler);
  }

  if (gfHighInput) {
    const handler = () => applyGf(gfHighInput, gfHighValue, "gfHigh", 85);
    gfHighInput.addEventListener("input", handler);
    gfHighInput.addEventListener("change", handler);
  }

  clearBtn.addEventListener("click", () => {
    setFlatProfile();
    state.lastPoint = null;
    state.lastIndex = null;
    rebuildTimeline();
    setCurrentTime(0);
  });
  window.addEventListener("resize", resizeCanvas);
  const canvasShell = document.getElementById("profile-shell");
  if (canvasShell && "ResizeObserver" in window) {
    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(canvasShell);
  }
  resizeCanvas();
  setFlatProfile();
  updateGfDisplay();
  updateAxes();
  rebuildTimeline();
  setCurrentTime(0);
})();
