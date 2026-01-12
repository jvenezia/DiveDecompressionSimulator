(() => {
  const { buildTimeline } = window.DiveSim.sim;
  const { normalizePoints } = window.DiveSim.profile;
  const { clamp, drawScene, updateReadouts } = window.DiveSim.ui;

  const canvas = document.getElementById("profile");
  const canvasContext = canvas.getContext("2d");
  const depthReadout = document.getElementById("depth-readout");
  const timeReadout = document.getElementById("time-readout");
  const depthAxis = document.getElementById("depth-axis");
  const timeAxis = document.getElementById("time-axis");
  const saturationAxis = document.getElementById("sat-axis");
  const totalTimeInput = document.getElementById("total-time");
  const maxDepthInput = document.getElementById("max-depth");
  const gradientFactorLowInput = document.getElementById("gf-low");
  const gradientFactorHighInput = document.getElementById("gf-high");
  const gradientFactorLowValue = document.getElementById("gf-low-value");
  const gradientFactorHighValue = document.getElementById("gf-high-value");
  const clearButton = document.getElementById("clear-btn");

  const state = {
    points: [],
    drawing: false,
    lastPoint: null,
    lastIndex: null,
    totalMinutes: Number(totalTimeInput.value),
    maxDepth: Number(maxDepthInput.value),
    stepSeconds: 60,
    timeline: [],
    currentTime: 0,
    hoverTime: null,
    hoverIndex: null,
    gradientFactorLow: (Number(gradientFactorLowInput?.value) || 30) / 100,
    gradientFactorHigh: (Number(gradientFactorHighInput?.value) || 85) / 100
  };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvasContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function renderAxis(axisElement, labels, styleForIndex) {
    if (!axisElement) return;
    axisElement.innerHTML = "";
    labels.forEach((label, index) => {
      const span = document.createElement("span");
      span.textContent = label;
      if (styleForIndex) {
        Object.assign(span.style, styleForIndex(index, labels.length));
      }
      axisElement.appendChild(span);
    });
  }

  function updateAxes() {
    const gridRows = 6;
    const gridColumns = 8;
    const depthLabels = [];
    for (let index = 0; index <= gridRows; index++) {
      const depthValue = (index / gridRows) * state.maxDepth;
      depthLabels.push(depthValue.toFixed(0));
    }
    renderAxis(depthAxis, depthLabels);

    const timeLabels = [];
    for (let index = 0; index <= gridColumns; index++) {
      const timeValue = (index / gridColumns) * state.totalMinutes;
      timeLabels.push(timeValue.toFixed(0));
    }
    renderAxis(timeAxis, timeLabels);

    const saturationLabels = [];
    for (let index = 0; index <= gridRows; index++) {
      const value = ((gridRows - index) / gridRows) * 100;
      saturationLabels.push(value.toFixed(0));
    }
    const red = [239, 68, 68];
    const green = [34, 197, 94];
    renderAxis(saturationAxis, saturationLabels, (index, length) => {
      const interpolation = length > 1 ? index / (length - 1) : 0;
      const channel = (startChannel, endChannel) =>
        Math.round(startChannel + (endChannel - startChannel) * interpolation);
      return {
        color: `rgb(${channel(red[0], green[0])}, ${channel(red[1], green[1])}, ${channel(red[2], green[2])})`
      };
    });
  }

  function mapPointerToProfilePoint(pointerX, pointerY) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const timeFraction = clamp(pointerX / width, 0, 1);
    const depth = clamp(pointerY / height, 0, 1) * state.maxDepth;
    return { timeFraction, depth };
  }

  function getStepCount() {
    return Math.max(1, Math.ceil((state.totalMinutes * 60) / state.stepSeconds));
  }

  function quantizePoint(point) {
    const steps = getStepCount();
    const index = clamp(Math.round(point.timeFraction * steps), 0, steps);
    return {
      index,
      timeFraction: index / steps,
      depth: point.depth
    };
  }

  function getActivePoints() {
    return state.points.filter(Boolean);
  }

  function setFlatProfile() {
    const steps = getStepCount();
    state.points = Array.from({ length: steps + 1 }, (_, index) => ({
      timeFraction: index / steps,
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

  function retimePoints(oldTotal, newTotal) {
    const existing = getActivePoints();
    if (!existing.length) {
      setFlatProfile();
      return;
    }
    const timed = existing.map((point) => ({
      time: point.timeFraction * oldTotal,
      depth: point.depth
    }));
    state.points = [];
    timed.forEach((point) => {
      if (point.time > newTotal) {
        return;
      }
      const timeFraction = newTotal > 0 ? point.time / newTotal : 0;
      addPoint({ timeFraction, depth: point.depth });
    });
    if (newTotal > oldTotal) {
      const last = timed[timed.length - 1];
      if (!last || last.depth <= 0.1) {
        addPoint({ timeFraction: 1, depth: 0 });
      }
    }
    if (!getActivePoints().length) {
      setFlatProfile();
    }
    state.lastPoint = null;
    state.lastIndex = null;
  }

  function addPoint(point) {
    const { index, timeFraction, depth } = quantizePoint(point);
    state.points[index] = { timeFraction, depth };
    state.lastPoint = { timeFraction, depth };
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
    for (let index = start; index <= end; index++) {
      const mix = (index - start) / span;
      const depth = from.depth + (to.depth - from.depth) * mix;
      const timeFraction = index / getStepCount();
      state.points[index] = { timeFraction, depth };
    }
    state.lastPoint = { timeFraction: to.timeFraction, depth: to.depth };
    state.lastIndex = to.index;
  }

  function rebuildTimeline() {
    state.timeline = buildTimeline({
      points: getActivePoints(),
      totalMinutes: state.totalMinutes,
      stepSeconds: state.stepSeconds,
      gradientFactorLow: state.gradientFactorLow,
      gradientFactorHigh: state.gradientFactorHigh
    });
    state.currentTime = clamp(state.currentTime, 0, state.totalMinutes);
    updateAxes();
    draw();
    updateFromTime(state.currentTime);
  }

  function updateFromTime(minutes) {
    const stepMinutes = Math.max(5, state.stepSeconds) / 60;
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

  function setHoverPoint(point, index) {
    state.hoverTime = point.timeFraction * state.totalMinutes;
    state.hoverIndex = index;
    updateFromTime(state.hoverTime);
  }

  function clearHoverPoint() {
    if (state.hoverTime === null && state.hoverIndex === null) return;
    state.hoverTime = null;
    state.hoverIndex = null;
    draw();
  }

  function getHoverPoint(pointerX) {
    const width = canvas.clientWidth;
    if (!width) return null;
    const timeFraction = clamp(pointerX / width, 0, 1);
    const { index } = quantizePoint({ timeFraction, depth: 0 });
    if (state.points[index]) {
      return { point: state.points[index], index };
    }
    for (let offset = 1; offset < state.points.length; offset++) {
      const left = index - offset;
      if (left >= 0 && state.points[left]) {
        return { point: state.points[left], index: left };
      }
      const right = index + offset;
      if (right < state.points.length && state.points[right]) {
        return { point: state.points[right], index: right };
      }
    }
    return null;
  }

  function draw() {
    const profilePoints = normalizePoints(getActivePoints());
    drawScene(canvasContext, canvas, state, profilePoints, state.timeline);
  }

  canvas.addEventListener("pointerdown", (event) => {
    state.drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const point = mapPointerToProfilePoint(event.offsetX, event.offsetY);
    fillBetweenPoints(state.lastPoint, point);
    rebuildTimeline();
    const hover = getHoverPoint(event.offsetX);
    if (hover) {
      setHoverPoint(hover.point, hover.index);
    } else {
      clearHoverPoint();
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    if (state.drawing) {
      const point = mapPointerToProfilePoint(event.offsetX, event.offsetY);
      fillBetweenPoints(state.lastPoint, point);
      rebuildTimeline();
      const hover = getHoverPoint(event.offsetX);
      if (hover) {
        setHoverPoint(hover.point, hover.index);
      } else {
        clearHoverPoint();
      }
      return;
    }
    const hover = getHoverPoint(event.offsetX);
    if (hover) {
      setHoverPoint(hover.point, hover.index);
    } else {
      clearHoverPoint();
    }
  });

  canvas.addEventListener("pointerup", (event) => {
    state.drawing = false;
    canvas.releasePointerCapture(event.pointerId);
    const point = mapPointerToProfilePoint(event.offsetX, event.offsetY);
    fillBetweenPoints(state.lastPoint, point);
    rebuildTimeline();
    const hover = getHoverPoint(event.offsetX);
    if (hover) {
      setHoverPoint(hover.point, hover.index);
    } else {
      clearHoverPoint();
    }
  });

  canvas.addEventListener("pointerleave", () => {
    state.drawing = false;
    state.lastPoint = null;
    state.lastIndex = null;
    clearHoverPoint();
  });

  totalTimeInput.addEventListener("change", () => {
    const previousTotal = state.totalMinutes;
    state.totalMinutes = clamp(Number(totalTimeInput.value) || 40, 5, 180);
    totalTimeInput.value = state.totalMinutes;
    updateAxes();
    retimePoints(previousTotal, state.totalMinutes);
    rebuildTimeline();
    setCurrentTime(0);
  });

  maxDepthInput.addEventListener("change", () => {
    state.maxDepth = clamp(Number(maxDepthInput.value) || 30, 6, 60);
    maxDepthInput.value = state.maxDepth;
    updateAxes();
    rebuildTimeline();
  });

  function updateGradientFactorDisplay() {
    if (gradientFactorLowValue && gradientFactorLowInput) {
      gradientFactorLowValue.textContent = String(gradientFactorLowInput.value);
    }
    if (gradientFactorHighValue && gradientFactorHighInput) {
      gradientFactorHighValue.textContent = String(gradientFactorHighInput.value);
    }
  }

  function applyGradientFactor(inputElement, key, fallback) {
    if (!inputElement) return;
    const raw = Number(inputElement.value);
    const percent = clamp(Number.isFinite(raw) ? raw : fallback, 0, 100);
    inputElement.value = String(percent);
    state[key] = percent / 100;
    if (gradientFactorLowInput && gradientFactorHighInput) {
      const low = Number(gradientFactorLowInput.value);
      const high = Number(gradientFactorHighInput.value);
      if (low > high) {
        if (key === "gradientFactorLow") {
          gradientFactorHighInput.value = String(low);
          if (gradientFactorHighValue) {
            gradientFactorHighValue.textContent = String(low);
          }
          state.gradientFactorHigh = low / 100;
        } else {
          gradientFactorLowInput.value = String(high);
          if (gradientFactorLowValue) {
            gradientFactorLowValue.textContent = String(high);
          }
          state.gradientFactorLow = high / 100;
        }
      }
    }
    updateGradientFactorDisplay();
    rebuildTimeline();
  }

  if (gradientFactorLowInput) {
    const handler = () =>
      applyGradientFactor(gradientFactorLowInput, "gradientFactorLow", 30);
    gradientFactorLowInput.addEventListener("input", handler);
    gradientFactorLowInput.addEventListener("change", handler);
  }

  if (gradientFactorHighInput) {
    const handler = () =>
      applyGradientFactor(gradientFactorHighInput, "gradientFactorHigh", 85);
    gradientFactorHighInput.addEventListener("input", handler);
    gradientFactorHighInput.addEventListener("change", handler);
  }

  clearButton.addEventListener("click", () => {
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
  updateGradientFactorDisplay();
  updateAxes();
  rebuildTimeline();
  setCurrentTime(0);
})();
