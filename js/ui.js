(() => {
  window.DiveSim = window.DiveSim || {};

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function formatTime(minutes) {
    const totalSeconds = Math.max(0, Math.round(minutes * 60));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function drawScene(ctx, canvas, state, profilePoints, timeline) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.strokeStyle = "rgba(16, 36, 58, 0.08)";
    ctx.lineWidth = 1;
    const gridY = 6;
    const gridX = 8;
    for (let i = 1; i < gridY; i++) {
      const y = (i / gridY) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let i = 1; i < gridX; i++) {
      const x = (i / gridX) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.restore();

    if (timeline && timeline.length > 1) {
      const maxSaturation = 1;
      ctx.save();
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, "rgba(34, 197, 94, 0.8)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0.8)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      timeline.forEach((point, index) => {
        const x = (point.time / state.totalMinutes) * width;
        const y = height - clamp(point.saturation / maxSaturation, 0, 1) * height;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      ctx.restore();
    }

    if (timeline && timeline.length > 1) {
      ctx.save();
      ctx.strokeStyle = "rgba(51, 65, 85, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      let hasSegment = false;
      timeline.forEach((point) => {
        const stops = point.stops || [];
        if (!stops.length) {
          hasSegment = false;
          return;
        }
        const stopDepth = Math.max(...stops.map((stop) => stop.depth));
        const x = (point.time / state.totalMinutes) * width;
        const y = (stopDepth / state.maxDepth) * height;
        if (!hasSegment) {
          ctx.moveTo(x, y);
          hasSegment = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.restore();
    }

    ctx.beginPath();
    profilePoints.forEach((point, index) => {
      const x = point.t * width;
      const y = (point.depth / state.maxDepth) * height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3;
    ctx.stroke();

    if (state.points.length) {
      ctx.fillStyle = "rgba(37, 99, 235, 0.85)";
      state.points.forEach((point) => {
        const x = point.t * width;
        const y = (point.depth / state.maxDepth) * height;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const cursorX = (state.currentTime / state.totalMinutes) * width;
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, height);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function updateReadouts({ snapshot, depthReadout, timeReadout, stopsList, timeline }) {
    if (!snapshot) {
      return;
    }
    const depth = snapshot.depth || 0;
    depthReadout.textContent = `${depth.toFixed(1)} m`;
    timeReadout.textContent = formatTime(snapshot.time);
    stopsList.innerHTML = "";
    const stopTotals = new Map();
    const series = timeline || [];
    for (let i = 0; i < series.length - 1; i++) {
      const point = series[i];
      const next = series[i + 1];
      const stops = point.stops || [];
      if (!stops.length) continue;
      const delta = Math.max(0, (next.time || 0) - (point.time || 0));
      stops.forEach((stop) => {
        if (stop.depth === undefined) return;
        const key = Number(stop.depth).toFixed(1);
        stopTotals.set(key, (stopTotals.get(key) || 0) + delta);
      });
    }

    if (!stopTotals.size) {
      stopsList.textContent = "Clear ascent";
    } else {
      Array.from(stopTotals.entries())
        .map(([depth, minutes]) => ({ depth: Number(depth), minutes }))
        .sort((a, b) => b.depth - a.depth)
        .forEach(({ depth, minutes }) => {
          const el = document.createElement("div");
          el.className = "stop-pill";
          el.textContent = `${depth.toFixed(1)} m · ${formatTime(minutes)}`;
          stopsList.appendChild(el);
        });
    }

  }

  window.DiveSim.ui = {
    clamp,
    formatTime,
    drawScene,
    updateReadouts
  };
})();
