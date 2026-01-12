(() => {
  const { buildTimeline } = window.DiveSim.sim;
  const { normalizePoints } = window.DiveSim.profile;
  const { clamp, drawScene, updateReadouts } = window.DiveSim.ui;

const canvas = document.getElementById("profile");
const ctx = canvas.getContext("2d");
const depthReadout = document.getElementById("depth-readout");
const timeReadout = document.getElementById("time-readout");
const stopsList = document.getElementById("stops-list");
const totalTimeInput = document.getElementById("total-time");
const maxDepthInput = document.getElementById("max-depth");
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
  gfLow: 0.3,
  gfHigh: 0.85
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
  draw();
  updateFromTime(state.currentTime);
}

function updateFromTime(minutes) {
  const stepMinutes = Math.max(5, state.stepSec) / 60;
  const index = Math.min(state.timeline.length - 1, Math.round(minutes / stepMinutes));
  updateReadouts({
    snapshot: state.timeline[index],
    depthReadout,
    timeReadout,
    stopsList
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
    reindexPoints();
    rebuildTimeline();
    setCurrentTime(0);
  });

maxDepthInput.addEventListener("change", () => {
  state.maxDepth = clamp(Number(maxDepthInput.value) || 30, 6, 60);
  maxDepthInput.value = state.maxDepth;
  rebuildTimeline();
});

  clearBtn.addEventListener("click", () => {
    setFlatProfile();
    state.lastPoint = null;
    state.lastIndex = null;
    rebuildTimeline();
    setCurrentTime(0);
  });
window.addEventListener("resize", resizeCanvas);
const canvasShell = document.querySelector(".canvas-shell");
if (canvasShell && "ResizeObserver" in window) {
  const observer = new ResizeObserver(() => resizeCanvas());
  observer.observe(canvasShell);
}
  resizeCanvas();
  setFlatProfile();
  rebuildTimeline();
  setCurrentTime(0);
})();
