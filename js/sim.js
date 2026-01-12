(() => {
  window.DiveSim = window.DiveSim || {};

  const { BuhlmannModel, buildStops, tissueSaturation } = window.DiveSim.buhlmann;
  const { normalizePoints, depthAt } = window.DiveSim.profile;
  const { N2_FRACTION, WATER_VAPOR_PRESSURE } = window.DiveSim.constants;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function buildTimeline({ points, totalMinutes, stepSec, gfLow, gfHigh }) {
    const timeline = [];
    const model = new BuhlmannModel();
    const ceilingModel = new BuhlmannModel();
    const stepMinutes = Math.max(5, stepSec) / 60;
    const steps = Math.ceil(totalMinutes / stepMinutes);
    const profilePoints = normalizePoints(points);
    const lastNonZeroPoint = [...profilePoints].reverse().find((point) => point.depth > 0.1);
    const lastNonZeroTime = lastNonZeroPoint ? lastNonZeroPoint.t * totalMinutes : 0;
    const surfaceInspired = Math.max(0.0001, (1 - WATER_VAPOR_PRESSURE) * N2_FRACTION);
    const maxProfileDepth = Math.max(...profilePoints.map((point) => point.depth));
    const maxInspired = Math.max(
      surfaceInspired + 0.0001,
      (1 + maxProfileDepth / 10 - WATER_VAPOR_PRESSURE) * N2_FRACTION
    );
    const maxAmbient = 1 + maxProfileDepth / 10;
    const low = Math.min(gfLow, gfHigh);
    const high = Math.max(gfLow, gfHigh);

    for (let i = 0; i <= steps; i++) {
      const time = i * stepMinutes;
      const depth = depthAt(time, totalMinutes, profilePoints);
      const ambient = model.updateSegment(depth, stepMinutes);
      if (time <= lastNonZeroTime + stepMinutes * 0.5) {
        ceilingModel.updateSegment(depth, stepMinutes);
      }
      const fraction = maxAmbient > 1 ? (maxAmbient - ambient) / (maxAmbient - 1) : 1;
      const gf = lerp(low, high, clamp(fraction, 0, 1));
      const ceilingAmbient = ceilingModel.getCeiling(gf);
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
        tissues: tissueSaturation(pressures, ambient),
        stops: buildStops(ceilingMeters),
        ceiling: ceilingMeters,
        saturation
      });
    }

    return timeline;
  }

  window.DiveSim.sim = {
    buildTimeline
  };
})();
