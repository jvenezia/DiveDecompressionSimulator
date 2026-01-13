(() => {
  window.DiveSim = window.DiveSim || {};

  const { BuhlmannModel, getStopDepth } = window.DiveSim.buhlmann;
  const { normalizePoints, getDepthAtTime } = window.DiveSim.profile;
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
    const maxProfileDepth = Math.max(...profilePoints.map((point) => point.depth));
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
      const maxTissuePressure = Math.max(...pressures);

      timeline.push({
        time,
        depth,
        tissues: pressures,
        ceiling: ceilingMeters,
        maxTissuePressure
      });
    }

    return timeline;
  }

  function buildStopSchedule(timeline) {
    if (!Array.isArray(timeline) || timeline.length < 2) {
      return [];
    }
    const stops = [];
    let activeStop = null;
    for (let index = 0; index < timeline.length - 1; index++) {
      const point = timeline[index];
      const nextPoint = timeline[index + 1];
      const duration = Math.max(0, nextPoint.time - point.time);
      let stopDepth = getStopDepth(point.ceiling);
      if (!stopDepth || duration <= 0) {
        activeStop = null;
        continue;
      }
      if (activeStop && activeStop.depth === stopDepth) {
        activeStop.duration += duration;
        activeStop.endTime = nextPoint.time;
      } else {
        activeStop = {
          depth: stopDepth,
          duration,
          startTime: point.time,
          endTime: nextPoint.time
        };
        stops.push(activeStop);
      }
    }
    if (!stops.length) {
      return stops;
    }
    let deepestStop = -Infinity;
    let startIndex = stops.length - 1;
    for (let index = stops.length - 1; index >= 0; index--) {
      const stop = stops[index];
      if (stop.depth >= deepestStop) {
        deepestStop = stop.depth;
        startIndex = index;
        continue;
      }
      break;
    }
    return stops.slice(startIndex);
  }

  window.DiveSim.sim = {
    buildTimeline,
    buildStopSchedule
  };
})();
