(() => {
  window.DiveSim = window.DiveSim || {};

  const { BuhlmannModel, buildStops, tissueSaturation } = window.DiveSim.buhlmann;
  const { normalizePoints, depthAt } = window.DiveSim.profile;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function buildTimeline({ points, totalMinutes, stepSec, gfLow, gfHigh }) {
    const timeline = [];
    const model = new BuhlmannModel();
    const stepMinutes = Math.max(5, stepSec) / 60;
    const steps = Math.ceil(totalMinutes / stepMinutes);
    const profilePoints = normalizePoints(points);

    for (let i = 0; i <= steps; i++) {
      const time = i * stepMinutes;
      const depth = depthAt(time, totalMinutes, profilePoints);
      const ambient = model.updateSegment(depth, stepMinutes);
      const progress = Math.min(time / totalMinutes, 1);
      const gf = lerp(gfLow, gfHigh, progress);
      const ceilingAmbient = model.getCeiling(gf);
      const ceilingMeters = Math.max(0, (ceilingAmbient - 1) * 10);
      timeline.push({
        time,
        depth,
        tissues: tissueSaturation(model.getTissues(), ambient),
        stops: buildStops(ceilingMeters),
        ceiling: ceilingMeters
      });
    }

    return timeline;
  }

  window.DiveSim.sim = {
    buildTimeline
  };
})();
