(() => {
  const { buildTimeline, buildStopSchedule } = window.DiveSim.sim;
  const { normalizePoints } = window.DiveSim.profile;
  const {
    clamp,
    drawDepthScene,
    drawSaturationScene,
    drawSpeedScene,
    drawMValueScene,
    getMValueLineData,
    updateReadouts,
    formatTime,
    formatDepth,
    formatPressure,
    formatSpeed,
    formatPercent
  } = window.DiveSim.ui;

  const { COMPARTMENTS, NITROGEN_FRACTION, WATER_VAPOR_PRESSURE } = window.DiveSim.constants;
  const canvas = document.getElementById("profile");
  const canvasContext = canvas.getContext("2d");
  const saturationCanvas = document.getElementById("saturation");
  const saturationContext = saturationCanvas.getContext("2d");
  const speedCanvas = document.getElementById("speed");
  const speedContext = speedCanvas.getContext("2d");
  const mValueCanvas = document.getElementById("mvalue");
  const mValueContext = mValueCanvas.getContext("2d");
  const depthReadout = document.getElementById("depth-readout");
  const timeReadout = document.getElementById("time-readout");
  const saturationReadout = document.getElementById("saturation-readout");
  const speedReadout = document.getElementById("speed-readout");
  const profileReadout = document.getElementById("profile-readout");
  const profileHint = document.getElementById("profile-hint");
  const saturationReadoutShell = document.getElementById("saturation-readout-shell");
  const speedReadoutShell = document.getElementById("speed-readout-shell");
  const mValueReadoutShell = document.getElementById("mvalue-readout-shell");
  const mValueReadoutMValueX = document.getElementById("mvalue-readout-mvalue-x");
  const mValueReadoutMValueY = document.getElementById("mvalue-readout-mvalue-y");
  const mValueReadoutAmbientX = document.getElementById("mvalue-readout-ambient-x");
  const mValueReadoutAmbientY = document.getElementById("mvalue-readout-ambient-y");
  const mValueReadoutGradientX = document.getElementById("mvalue-readout-gradient-x");
  const mValueReadoutGradientY = document.getElementById("mvalue-readout-gradient-y");
  const depthAxis = document.getElementById("depth-axis");
  const profileTimeAxis = document.getElementById("profile-time-axis");
  const saturationTimeAxis = document.getElementById("saturation-time-axis");
  const speedTimeAxis = document.getElementById("speed-time-axis");
  const saturationAxis = document.getElementById("sat-axis");
  const speedAxis = document.getElementById("speed-axis");
  const mValueAxis = document.getElementById("mvalue-axis");
  const mValueAmbientAxis = document.getElementById("mvalue-ambient-axis");
  const gradientFactorLowInput = document.getElementById("gf-low");
  const gradientFactorHighInput = document.getElementById("gf-high");
  const gradientFactorLowValue = document.getElementById("gf-low-value");
  const gradientFactorHighValue = document.getElementById("gf-high-value");
  const stopList = document.getElementById("stop-list");
  const stopHeader = document.getElementById("stop-header");
  const stopEmpty = document.getElementById("stop-empty");
  const paramMaxDepth = document.getElementById("param-max-depth");
  const paramAvgDepth = document.getElementById("param-avg-depth");
  const paramDuration = document.getElementById("param-duration");

  const DEFAULT_TOTAL_MINUTES = 60;
  const DEFAULT_MAX_DEPTH = 60;
  const MIN_SPEED_RANGE = 15;

  const state = {
    points: [],
    drawing: false,
    hasDrawn: false,
    lastPoint: null,
    lastIndex: null,
    totalMinutes: DEFAULT_TOTAL_MINUTES,
    maxDepth: DEFAULT_MAX_DEPTH,
    stepSeconds: 60,
    timeline: [],
    recommendedStops: [],
    speedSegments: [],
    maxSpeed: MIN_SPEED_RANGE,
    currentTime: 0,
    hoverTime: null,
    hoverIndex: null,
    mValueHover: null,
    gradientFactorLow: (Number(gradientFactorLowInput?.value) || 30) / 100,
    gradientFactorHigh: (Number(gradientFactorHighInput?.value) || 85) / 100
  };

  function resizeCanvasElement(targetCanvas, targetContext, container) {
    if (!targetCanvas || !targetContext || !container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    targetCanvas.width = rect.width * ratio;
    targetCanvas.height = rect.height * ratio;
    targetContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function resizeCanvas() {
    resizeCanvasElement(canvas, canvasContext, canvasShell);
    resizeCanvasElement(saturationCanvas, saturationContext, saturationShell);
    resizeCanvasElement(speedCanvas, speedContext, speedShell);
    resizeCanvasElement(mValueCanvas, mValueContext, mValueShell);
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

  function getMaxTissuePressure() {
    if (!state.timeline.length) {
      return 1;
    }
    const pressureValues = [];
    state.timeline.forEach((point) => {
      if (Number.isFinite(point.maxTissuePressure)) {
        pressureValues.push(point.maxTissuePressure);
      }
      if (Array.isArray(point.tissues)) {
        point.tissues.forEach((tissuePressure) => {
          if (Number.isFinite(tissuePressure)) {
            pressureValues.push(tissuePressure);
          }
        });
      }
    });
    if (pressureValues.length === 0) {
      return 1;
    }
    return Math.max(1, ...pressureValues) + 0.1;
  }

  function buildSpeedSegments(timeline) {
    if (!Array.isArray(timeline) || timeline.length < 2) {
      return { segments: [], maxSpeed: MIN_SPEED_RANGE };
    }
    const segments = [];
    let maxSpeed = 0;
    for (let index = 1; index < timeline.length; index++) {
      const previous = timeline[index - 1];
      const current = timeline[index];
      const duration = current.time - previous.time;
      let speed = 0;
      if (Number.isFinite(duration) && duration > 0) {
        speed = (previous.depth - current.depth) / duration;
      }
      segments.push(speed);
      maxSpeed = Math.max(maxSpeed, Math.abs(speed));
    }
    return { segments, maxSpeed: Math.max(MIN_SPEED_RANGE, maxSpeed) };
  }

  function updateAxes() {
    const gridRows = 6;
    const gridColumns = 8;
    const depthLabels = [];
    for (let index = 0; index <= gridRows; index++) {
      const depthValue = (index / gridRows) * state.maxDepth;
      depthLabels.push(formatDepth(depthValue));
    }
    renderAxis(depthAxis, depthLabels);

    const timeLabels = [];
    for (let index = 0; index <= gridColumns; index++) {
      const timeValue = (index / gridColumns) * state.totalMinutes;
      timeLabels.push(formatTime(timeValue));
    }
    renderAxis(profileTimeAxis, timeLabels);
    renderAxis(saturationTimeAxis, timeLabels);
    renderAxis(speedTimeAxis, timeLabels);

    const maxTissuePressure = getMaxTissuePressure();
    const saturationLabels = [];
    for (let index = 0; index <= gridRows; index++) {
      const value = ((gridRows - index) / gridRows) * maxTissuePressure;
      saturationLabels.push(formatPressure(value));
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

    const speedLabels = [];
    const maxSpeed = Number.isFinite(state.maxSpeed) && state.maxSpeed > 0 ? state.maxSpeed : 1;
    for (let index = 0; index <= gridRows; index++) {
      const value = maxSpeed - (index / gridRows) * maxSpeed * 2;
      speedLabels.push(formatSpeed(value, true));
    }
    renderAxis(speedAxis, speedLabels);

    const scaleMax = 5;
    const mValueLabels = [];
    for (let index = 0; index <= gridRows; index++) {
      const value = ((gridRows - index) / gridRows) * scaleMax;
      mValueLabels.push(formatPressure(value));
    }
    renderAxis(mValueAxis, mValueLabels);

    const ambientLabels = [];
    for (let index = 0; index <= gridColumns; index++) {
      const value = (index / gridColumns) * scaleMax;
      ambientLabels.push(formatPressure(value));
    }
    renderAxis(mValueAmbientAxis, ambientLabels);
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
    const speedData = buildSpeedSegments(state.timeline);
    state.speedSegments = speedData.segments;
    state.maxSpeed = speedData.maxSpeed;
    state.recommendedStops = buildStopSchedule(state.timeline);
    state.currentTime = clamp(state.currentTime, 0, state.totalMinutes);
    renderDiveParams();
    renderStops();
    updateAxes();
    draw();
    updateFromTime(state.currentTime);
  }

  function setReadoutVisibility(isVisible) {
    if (profileReadout) {
      profileReadout.classList.toggle("hidden", !isVisible);
    }
    if (saturationReadoutShell) {
      saturationReadoutShell.classList.toggle("hidden", !isVisible);
    }
    if (speedReadoutShell) {
      speedReadoutShell.classList.toggle("hidden", !isVisible);
    }
  }

  function clearReadouts() {
    if (depthReadout) {
      depthReadout.textContent = "";
    }
    if (timeReadout) {
      timeReadout.textContent = "";
    }
    if (saturationReadout) {
      saturationReadout.textContent = "";
    }
    if (speedReadout) {
      speedReadout.textContent = "";
    }
  }

  function setMValueReadoutVisibility(isVisible) {
    if (mValueReadoutShell) {
      mValueReadoutShell.classList.toggle("hidden", !isVisible);
    }
  }

  function clearMValueReadout() {
    if (mValueReadoutMValueX) {
      mValueReadoutMValueX.textContent = "";
    }
    if (mValueReadoutMValueY) {
      mValueReadoutMValueY.textContent = "";
    }
    if (mValueReadoutAmbientX) {
      mValueReadoutAmbientX.textContent = "";
    }
    if (mValueReadoutAmbientY) {
      mValueReadoutAmbientY.textContent = "";
    }
    if (mValueReadoutGradientX) {
      mValueReadoutGradientX.textContent = "";
    }
    if (mValueReadoutGradientY) {
      mValueReadoutGradientY.textContent = "";
    }
  }

  function updateMValueReadout(hoverData) {
    if (!mValueReadoutShell) {
      return;
    }
    if (!hoverData) {
      setMValueReadoutVisibility(false);
      clearMValueReadout();
      return;
    }
    const ambientValue = formatPressure(hoverData.ambientPressure);
    const mValueValue = formatPressure(hoverData.mValuePressure);
    const ambientLineValue = formatPressure(hoverData.ambientLinePressure);
    const gradientLineValue = formatPressure(hoverData.gradientLinePressure);

    setMValueReadoutVisibility(true);
    if (mValueReadoutMValueX) {
      mValueReadoutMValueX.textContent = ambientValue;
    }
    if (mValueReadoutMValueY) {
      mValueReadoutMValueY.textContent = mValueValue;
    }
    if (mValueReadoutAmbientX) {
      mValueReadoutAmbientX.textContent = ambientValue;
    }
    if (mValueReadoutAmbientY) {
      mValueReadoutAmbientY.textContent = ambientLineValue;
    }
    if (mValueReadoutGradientX) {
      mValueReadoutGradientX.textContent = ambientValue;
    }
    if (mValueReadoutGradientY) {
      mValueReadoutGradientY.textContent = gradientLineValue;
    }
  }

  function updateFromTime(minutes) {
    if (!Number.isFinite(state.hoverTime)) {
      setReadoutVisibility(false);
      clearReadouts();
      draw();
      return;
    }
    const stepMinutes = Math.max(5, state.stepSeconds) / 60;
    const index = Math.min(state.timeline.length - 1, Math.round(minutes / stepMinutes));
    const snapshot = state.timeline[index];
    if (!snapshot) {
      setReadoutVisibility(false);
      clearReadouts();
      draw();
      return;
    }
    setReadoutVisibility(true);
    updateReadouts({ snapshot, depthReadout, timeReadout });
    if (saturationReadout) {
      saturationReadout.textContent = formatPressure(snapshot.maxTissuePressure);
    }
    if (speedReadout) {
      const speed = state.speedSegments[Math.max(0, index - 1)] ?? 0;
      speedReadout.textContent = formatSpeed(speed, true);
    }
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
    updateFromTime(0);
  }

  function setMValueHover(hoverData) {
    state.mValueHover = hoverData;
    updateMValueReadout(hoverData);
    draw();
  }

  function clearMValueHover() {
    if (!state.mValueHover) return;
    state.mValueHover = null;
    updateMValueReadout(null);
    draw();
  }

  function getHoverPoint(pointerX, targetCanvas) {
    const width = targetCanvas.clientWidth;
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

  function getMValueHoverData(pointerX, targetCanvas) {
    const width = targetCanvas.clientWidth;
    if (!width) return null;
    const {
      scaleMax,
      slopeMValue,
      interceptMValue,
      currentSlope,
      currentIntercept
    } = getMValueLineData(state, COMPARTMENTS, NITROGEN_FRACTION, WATER_VAPOR_PRESSURE);
    const ambientPressure = clamp((pointerX / width) * scaleMax, 0, scaleMax);
    const mValuePressure = slopeMValue * ambientPressure + interceptMValue;
    const ambientLinePressure = ambientPressure;
    const gradientLinePressure = currentSlope * ambientPressure + currentIntercept;
    return {
      ambientPressure,
      mValuePressure,
      ambientLinePressure,
      gradientLinePressure
    };
  }

  function draw() {
    const profilePoints = normalizePoints(getActivePoints());
    const maxTissuePressure = getMaxTissuePressure();
    drawDepthScene(
      canvasContext,
      canvas,
      state,
      profilePoints,
      state.timeline,
      state.recommendedStops
    );
    drawSaturationScene(
      saturationContext,
      saturationCanvas,
      state,
      state.timeline,
      maxTissuePressure
    );
    drawSpeedScene(
      speedContext,
      speedCanvas,
      state,
      state.timeline,
      state.speedSegments,
      state.maxSpeed
    );
    drawMValueScene(
      mValueContext,
      mValueCanvas,
      state,
      COMPARTMENTS,
      NITROGEN_FRACTION,
      WATER_VAPOR_PRESSURE
    );
  }

  function renderStops() {
    if (!stopList || !stopHeader || !stopEmpty) {
      return;
    }
    stopList.innerHTML = "";
    if (!state.recommendedStops.length) {
      stopHeader.classList.add("hidden");
      stopEmpty.classList.remove("hidden");
      return;
    }
    stopHeader.classList.remove("hidden");
    stopEmpty.classList.add("hidden");
    state.recommendedStops.forEach((stop) => {
      const row = document.createElement("div");
      row.className =
        "flex items-center justify-between rounded-xl border border-red-200/70 bg-red-50/70 px-3 py-2 text-xs text-red-900";
      const depthValue = document.createElement("span");
      depthValue.textContent = formatDepth(stop.depth);
      const durationValue = document.createElement("span");
      durationValue.className = "font-mono text-red-900";
      durationValue.textContent = formatTime(stop.duration);
      row.append(depthValue, durationValue);
      stopList.appendChild(row);
    });
  }

  function renderDiveParams() {
    if (!paramMaxDepth || !paramAvgDepth || !paramDuration) {
      return;
    }
    const maxDepth = state.timeline.length
      ? Math.max(...state.timeline.map((point) => point.depth))
      : 0;
    let weightedDepth = 0;
    let totalDuration = 0;
    let startTime = null;
    let endTime = null;
    for (let index = 0; index < state.timeline.length - 1; index++) {
      const point = state.timeline[index];
      const nextPoint = state.timeline[index + 1];
      const duration = Math.max(0, nextPoint.time - point.time);
      if (point.depth > 0.1) {
        if (startTime === null) {
          startTime = point.time;
        }
        weightedDepth += point.depth * duration;
        totalDuration += duration;
      } else if (startTime !== null && endTime === null) {
        endTime = point.time;
      }
    }
    if (startTime !== null && endTime === null) {
      endTime = state.timeline[state.timeline.length - 1]?.time ?? startTime;
    }
    const avgDepth = totalDuration > 0 ? weightedDepth / totalDuration : 0;
    const immersionDuration = startTime !== null && endTime !== null ? endTime - startTime : 0;
    paramMaxDepth.textContent = formatDepth(maxDepth);
    paramAvgDepth.textContent = formatDepth(avgDepth);
    paramDuration.textContent = formatTime(immersionDuration);
  }

  function handleHoverMove(event, targetCanvas) {
    const hover = getHoverPoint(event.offsetX, targetCanvas);
    if (hover) {
      setHoverPoint(hover.point, hover.index);
    } else {
      clearHoverPoint();
    }
  }

  function handleHoverLeave() {
    clearHoverPoint();
  }

  function handleMValueHoverMove(event, targetCanvas) {
    const hoverData = getMValueHoverData(event.offsetX, targetCanvas);
    if (hoverData) {
      setMValueHover(hoverData);
    } else {
      clearMValueHover();
    }
  }

  function handleMValueHoverLeave() {
    clearMValueHover();
  }

  function preventTouchScroll(event) {
    if (event.pointerType === "touch" && event.cancelable) {
      event.preventDefault();
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    preventTouchScroll(event);
    state.drawing = true;
    if (!state.hasDrawn && profileHint) {
      state.hasDrawn = true;
      profileHint.classList.add("chart-hint-hidden");
    }
    canvas.setPointerCapture(event.pointerId);
    const point = mapPointerToProfilePoint(event.offsetX, event.offsetY);
    fillBetweenPoints(state.lastPoint, point);
    rebuildTimeline();
    handleHoverMove(event, canvas);
  }, { passive: false });

  canvas.addEventListener("pointermove", (event) => {
    preventTouchScroll(event);
    if (state.drawing) {
      const point = mapPointerToProfilePoint(event.offsetX, event.offsetY);
      fillBetweenPoints(state.lastPoint, point);
      rebuildTimeline();
      handleHoverMove(event, canvas);
      return;
    }
    handleHoverMove(event, canvas);
  }, { passive: false });

  canvas.addEventListener("pointerup", (event) => {
    preventTouchScroll(event);
    state.drawing = false;
    canvas.releasePointerCapture(event.pointerId);
    const point = mapPointerToProfilePoint(event.offsetX, event.offsetY);
    fillBetweenPoints(state.lastPoint, point);
    rebuildTimeline();
    handleHoverMove(event, canvas);
  }, { passive: false });

  canvas.addEventListener("pointerleave", () => {
    state.drawing = false;
    state.lastPoint = null;
    state.lastIndex = null;
    handleHoverLeave();
  });

  saturationCanvas.addEventListener("pointermove", (event) => {
    handleHoverMove(event, saturationCanvas);
  });

  saturationCanvas.addEventListener("pointerleave", () => {
    handleHoverLeave();
  });

  speedCanvas.addEventListener("pointermove", (event) => {
    handleHoverMove(event, speedCanvas);
  });

  speedCanvas.addEventListener("pointerleave", () => {
    handleHoverLeave();
  });

  mValueCanvas.addEventListener("pointermove", (event) => {
    handleMValueHoverMove(event, mValueCanvas);
  });

  mValueCanvas.addEventListener("pointerleave", () => {
    handleMValueHoverLeave();
  });

  function updateRangeFill(inputElement) {
    if (!inputElement) return;
    const minimum = Number(inputElement.min) || 0;
    const maximum = Number(inputElement.max) || 100;
    const rawValue = Number(inputElement.value);
    const clampedValue = clamp(
      Number.isFinite(rawValue) ? rawValue : minimum,
      minimum,
      maximum
    );
    const rangeSpan = maximum - minimum;
    const percent =
      rangeSpan > 0 ? ((clampedValue - minimum) / rangeSpan) * 100 : 0;
    inputElement.style.setProperty("--range-fill", `${percent}%`);
  }

  function updateGradientFactorDisplay() {
    if (gradientFactorLowValue && gradientFactorLowInput) {
      gradientFactorLowValue.textContent = String(gradientFactorLowInput.value);
      updateRangeFill(gradientFactorLowInput);
    }
    if (gradientFactorHighValue && gradientFactorHighInput) {
      gradientFactorHighValue.textContent = String(gradientFactorHighInput.value);
      updateRangeFill(gradientFactorHighInput);
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

  const canvasShell = document.getElementById("profile-shell");
  const saturationShell = document.getElementById("saturation-shell");
  const speedShell = document.getElementById("speed-shell");
  const mValueShell = document.getElementById("mvalue-shell");
  window.addEventListener("resize", resizeCanvas);
  if (canvasShell && "ResizeObserver" in window) {
    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(canvasShell);
    if (saturationShell) {
      observer.observe(saturationShell);
    }
    if (speedShell) {
      observer.observe(speedShell);
    }
    if (mValueShell) {
      observer.observe(mValueShell);
    }
  }
  resizeCanvas();
  setFlatProfile();
  updateGradientFactorDisplay();
  updateAxes();
  rebuildTimeline();
  setCurrentTime(0);
})();
