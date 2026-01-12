(() => {
  window.DiveSim = window.DiveSim || {};

  const { BuhlmannModel, getStopDepth, calculateTissueSaturation } = window.DiveSim.buhlmann;
  const { normalizePoints, getDepthAtTime } = window.DiveSim.profile;
  const { NITROGEN_FRACTION, WATER_VAPOR_PRESSURE } = window.DiveSim.constants;

  function interpolateLinear(startValue, endValue, amount) {
    return startValue + (endValue - startValue) * amount;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function buildTimeline({ points, totalMinutes, stepSeconds, gradientFactorLow, gradientFactorHigh }) {
    const timeline = [];
    const model = new BuhlmannModel();
    const ceilingModel = new BuhlmannModel();
    const stepMinutes = Math.max(5, stepSeconds) / 60;
    const steps = Math.ceil(totalMinutes / stepMinutes);
    const profilePoints = normalizePoints(points);
    const lastNonZeroPoint = [...profilePoints].reverse().find((point) => point.depth > 0.1);
    const lastNonZeroTime = lastNonZeroPoint ? lastNonZeroPoint.timeFraction * totalMinutes : 0;
    const surfaceInspired = Math.max(
      0.0001,
      (1 - WATER_VAPOR_PRESSURE) * NITROGEN_FRACTION
    );
    const maxProfileDepth = Math.max(...profilePoints.map((point) => point.depth));
    const maxInspired = Math.max(
      surfaceInspired + 0.0001,
      (1 + maxProfileDepth / 10 - WATER_VAPOR_PRESSURE) * NITROGEN_FRACTION
    );
    const maxAmbient = 1 + maxProfileDepth / 10;
    const low = Math.min(gradientFactorLow, gradientFactorHigh);
    const high = Math.max(gradientFactorLow, gradientFactorHigh);

    for (let index = 0; index <= steps; index++) {
      const time = index * stepMinutes;
      const depth = getDepthAtTime(time, totalMinutes, profilePoints);
      const ambient = model.updateSegment(depth, stepMinutes);
      if (time <= lastNonZeroTime + stepMinutes * 0.5) {
        ceilingModel.updateSegment(depth, stepMinutes);
      }
      const fraction = maxAmbient > 1 ? (maxAmbient - ambient) / (maxAmbient - 1) : 1;
      const gradientFactor = interpolateLinear(low, high, clamp(fraction, 0, 1));
      const ceilingAmbient = ceilingModel.getCeiling(gradientFactor);
      const ceilingMeters = Math.max(0, (ceilingAmbient - 1) * 10);
      const pressures = model.getTissues();
      const maxPressure = Math.max(...pressures);
      const saturation = Math.max(
        0,
        Math.min(1, (maxPressure - surfaceInspired) / (maxInspired - surfaceInspired))
      );

      timeline.push({
        time,
        depth,
        tissues: calculateTissueSaturation(pressures, ambient),
        ceiling: ceilingMeters,
        saturation
      });
    }

    return timeline;
  }

  function buildStopSchedule(timeline) {
    if (!Array.isArray(timeline) || timeline.length < 2) {
      return [];
    }
    const stops = [];
    const maxDepth = Math.max(...timeline.map((point) => point.depth));
    const depthThreshold = Math.max(0.1, maxDepth - 0.1);
    const deepestIndex = timeline.findIndex((point) => point.depth >= maxDepth - 0.05);
    let startIndex = deepestIndex > -1 ? deepestIndex : 0;
    for (let index = startIndex + 1; index < timeline.length; index++) {
      if (timeline[index].depth < depthThreshold) {
        startIndex = index;
        break;
      }
    }
    let lastStopDepth = null;
    for (let index = startIndex; index < timeline.length - 1; index++) {
      const point = timeline[index];
      const nextPoint = timeline[index + 1];
      const duration = Math.max(0, nextPoint.time - point.time);
      let stopDepth = getStopDepth(point.ceiling);
      if (!stopDepth || duration <= 0) {
        continue;
      }
      if (lastStopDepth !== null && stopDepth > lastStopDepth) {
        continue;
      }
      const lastStop = stops[stops.length - 1];
      if (lastStop && lastStop.depth === stopDepth) {
        lastStop.duration += duration;
        lastStop.endTime = nextPoint.time;
      } else {
        stops.push({
          depth: stopDepth,
          duration,
          startTime: point.time,
          endTime: nextPoint.time
        });
      }
      lastStopDepth = stopDepth;
    }
    return stops;
  }

  window.DiveSim.sim = {
    buildTimeline,
    buildStopSchedule
  };
})();
