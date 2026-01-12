(() => {
  window.DiveSim = window.DiveSim || {};

  function normalizePoints(points) {
    if (!points.length) {
      return [{ timeFraction: 0, depth: 0 }, { timeFraction: 1, depth: 0 }];
    }
    const sorted = [...points].sort(
      (firstPoint, secondPoint) => firstPoint.timeFraction - secondPoint.timeFraction
    );
    const deduped = [];
    for (const point of sorted) {
      const last = deduped[deduped.length - 1];
      if (!last || point.timeFraction - last.timeFraction > 0.002) {
        deduped.push({ timeFraction: point.timeFraction, depth: point.depth });
      } else {
        last.depth = point.depth;
      }
    }
    if (deduped[0].timeFraction > 0) {
      deduped.unshift({ timeFraction: 0, depth: deduped[0].depth });
    }
    if (deduped[deduped.length - 1].timeFraction < 1) {
      deduped.push({ timeFraction: 1, depth: deduped[deduped.length - 1].depth });
    }
    return deduped;
  }

  function getDepthAtTime(minutes, totalMinutes, profilePoints) {
    const total = totalMinutes || 1;
    const timeFraction = Math.min(Math.max(minutes / total, 0), 1);
    for (let index = 0; index < profilePoints.length - 1; index++) {
      const startPoint = profilePoints[index];
      const endPoint = profilePoints[index + 1];
      if (
        timeFraction >= startPoint.timeFraction &&
        timeFraction <= endPoint.timeFraction
      ) {
        const span = endPoint.timeFraction - startPoint.timeFraction || 1;
        const mix = (timeFraction - startPoint.timeFraction) / span;
        return startPoint.depth + (endPoint.depth - startPoint.depth) * mix;
      }
    }
    return profilePoints[profilePoints.length - 1].depth;
  }

  window.DiveSim.profile = {
    normalizePoints,
    getDepthAtTime
  };
})();
