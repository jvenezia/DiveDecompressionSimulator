(() => {
  window.DiveSim = window.DiveSim || {};

  const { BuhlmannModel, buildStops, tissueSaturation } = window.DiveSim.buhlmann;
  const { normalizePoints, depthAt } = window.DiveSim.profile;
  const { N2_FRACTION, WATER_VAPOR_PRESSURE } = window.DiveSim.constants;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function buildTimeline({ points, totalMinutes, stepSec, gfLow, gfHigh }) {
    const timeline = [];
    const model = new BuhlmannModel();
    const stepMinutes = Math.max(5, stepSec) / 60;
    const steps = Math.ceil(totalMinutes / stepMinutes);
    const profilePoints = normalizePoints(points);
    const surfaceInspired = Math.max(0.0001, (1 - WATER_VAPOR_PRESSURE) * N2_FRACTION);
    const maxProfileDepth = Math.max(...profilePoints.map((point) => point.depth));
    const maxInspired = Math.max(
      surfaceInspired + 0.0001,
      (1 + maxProfileDepth / 10 - WATER_VAPOR_PRESSURE) * N2_FRACTION
    );

    for (let i = 0; i <= steps; i++) {
      const time = i * stepMinutes;
      const depth = depthAt(time, totalMinutes, profilePoints);
      const ambient = model.updateSegment(depth, stepMinutes);
      const progress = Math.min(time / totalMinutes, 1);
      const gf = lerp(gfLow, gfHigh, progress);
      const ceilingAmbient = model.getCeiling(gf);
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
