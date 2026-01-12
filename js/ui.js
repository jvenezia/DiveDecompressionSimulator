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

  function drawScene(ctx, canvas, state, profilePoints) {
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
    ctx.fillStyle = "rgba(16, 36, 58, 0.5)";
    ctx.font = "12px \"JetBrains Mono\", ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    for (let i = 0; i <= gridY; i++) {
      const y = (i / gridY) * height;
      const depthValue = (i / gridY) * state.maxDepth;
      ctx.fillText(`${depthValue.toFixed(0)} m`, 8, Math.min(y + 4, height - 14));
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (let i = 0; i <= gridX; i++) {
      const x = (i / gridX) * width;
      const timeValue = (i / gridX) * state.totalMinutes;
      ctx.fillText(`${timeValue.toFixed(0)} min`, x, height - 6);
    }
    ctx.restore();

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
    ctx.strokeStyle = "#0f2b3f";
    ctx.lineWidth = 3;
    ctx.stroke();

    if (state.points.length) {
      ctx.fillStyle = "rgba(255, 123, 84, 0.8)";
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
    ctx.strokeStyle = "rgba(255, 123, 84, 0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function updateReadouts({ snapshot, depthReadout, timeReadout, currentState, decoState, tissueList, stopsList }) {
    if (!snapshot) {
      return;
    }
    const depth = snapshot.depth || 0;
    depthReadout.textContent = `${depth.toFixed(1)} m`;
    timeReadout.textContent = formatTime(snapshot.time);
    currentState.textContent = `${snapshot.depth.toFixed(1)} m · ${formatTime(snapshot.time)}`;

    const stops = snapshot.stops || [];
    if (!stops.length) {
      decoState.textContent = "No stops";
    } else {
      decoState.textContent = `${stops.length} stop${stops.length > 1 ? "s" : ""}`;
    }

    stopsList.innerHTML = "";
    if (!stops.length) {
      stopsList.textContent = "Clear ascent";
    } else {
      stops.forEach((stop) => {
        const el = document.createElement("div");
        el.className = "stop-pill";
        el.textContent = `${stop.depth.toFixed(1)} m · ${formatTime(stop.time)}`;
        stopsList.appendChild(el);
      });
    }

    tissueList.innerHTML = "";
    const tissues = snapshot.tissues || [];
    if (!tissues.length) {
      tissueList.textContent = "No tissue data.";
      return;
    }
    tissues.forEach((tissue, index) => {
      const percent = clamp(tissue.saturation * 100, 0, 160);
      const row = document.createElement("div");
      row.className = "tissue";
      row.innerHTML = `
        <div>#${String(index + 1).padStart(2, "0")}</div>
        <div class="tissue-bar"><span style="width:${percent}%"></span></div>
        <div>${percent.toFixed(0)}%</div>
      `;
      tissueList.appendChild(row);
    });
  }

  window.DiveSim.ui = {
    clamp,
    formatTime,
    drawScene,
    updateReadouts
  };
})();
