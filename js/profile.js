(() => {
  window.DiveSim = window.DiveSim || {};

  function normalizePoints(points) {
    if (!points.length) {
      return [{ t: 0, depth: 0 }, { t: 1, depth: 0 }];
    }
    const sorted = [...points].sort((a, b) => a.t - b.t);
    const deduped = [];
    for (const point of sorted) {
      const last = deduped[deduped.length - 1];
      if (!last || point.t - last.t > 0.002) {
        deduped.push({ t: point.t, depth: point.depth });
      } else {
        last.depth = point.depth;
      }
    }
    if (deduped[0].t > 0) {
      deduped.unshift({ t: 0, depth: deduped[0].depth });
    }
    if (deduped[deduped.length - 1].t < 1) {
      deduped.push({ t: 1, depth: deduped[deduped.length - 1].depth });
    }
    return deduped;
  }

  function depthAt(minutes, totalMinutes, profilePoints) {
    const total = totalMinutes || 1;
    const t = Math.min(Math.max(minutes / total, 0), 1);
    for (let i = 0; i < profilePoints.length - 1; i++) {
      const a = profilePoints[i];
      const b = profilePoints[i + 1];
      if (t >= a.t && t <= b.t) {
        const span = b.t - a.t || 1;
        const mix = (t - a.t) / span;
        return a.depth + (b.depth - a.depth) * mix;
      }
    }
    return profilePoints[profilePoints.length - 1].depth;
  }

  window.DiveSim.profile = {
    normalizePoints,
    depthAt
  };
})();
