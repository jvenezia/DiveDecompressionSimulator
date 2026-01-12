(() => {
  window.DiveSim = window.DiveSim || {};

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function formatTime(minutes) {
    const totalSeconds = Math.max(0, Math.round(minutes * 60));
    const minutesPart = Math.floor(totalSeconds / 60);
    const secondsPart = totalSeconds % 60;
    return `${minutesPart}:${String(secondsPart).padStart(2, "0")}`;
  }

  function getTranslation(key, fallback) {
    if (window.i18next && typeof window.i18next.t === "function") {
      return window.i18next.t(key);
    }
    return fallback;
  }

  function drawScene(canvasContext, canvas, state, profilePoints, timeline) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvasContext.clearRect(0, 0, width, height);

    canvasContext.save();
    canvasContext.strokeStyle = "rgba(16, 36, 58, 0.08)";
    canvasContext.lineWidth = 1;
    const gridRows = 6;
    const gridColumns = 8;
    for (let index = 1; index < gridRows; index++) {
      const yPosition = (index / gridRows) * height;
      canvasContext.beginPath();
      canvasContext.moveTo(0, yPosition);
      canvasContext.lineTo(width, yPosition);
      canvasContext.stroke();
    }
    for (let index = 1; index < gridColumns; index++) {
      const xPosition = (index / gridColumns) * width;
      canvasContext.beginPath();
      canvasContext.moveTo(xPosition, 0);
      canvasContext.lineTo(xPosition, height);
      canvasContext.stroke();
    }
    canvasContext.restore();

    if (timeline && timeline.length > 1) {
      const maxSaturation = 1;
      canvasContext.save();
      const gradient = canvasContext.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, "rgba(34, 197, 94, 0.8)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0.8)");
      canvasContext.strokeStyle = gradient;
      canvasContext.lineWidth = 2;
      canvasContext.beginPath();
      timeline.forEach((point, index) => {
        const xPosition = (point.time / state.totalMinutes) * width;
        const yPosition = height - clamp(point.saturation / maxSaturation, 0, 1) * height;
        if (index === 0) {
          canvasContext.moveTo(xPosition, yPosition);
        } else {
          canvasContext.lineTo(xPosition, yPosition);
        }
      });
      canvasContext.stroke();

      canvasContext.restore();
    }

    if (timeline && timeline.length > 1) {
      canvasContext.save();
      let firstXPosition = 0;
      let lastXPosition = 0;
      canvasContext.beginPath();
      timeline.forEach((point, index) => {
        const ceiling = Number.isFinite(point.ceiling) ? point.ceiling : 0;
        const xPosition = (point.time / state.totalMinutes) * width;
        const yPosition = (ceiling / state.maxDepth) * height;
        if (index === 0) {
          firstXPosition = xPosition;
          canvasContext.moveTo(xPosition, yPosition);
        } else {
          canvasContext.lineTo(xPosition, yPosition);
        }
        lastXPosition = xPosition;
      });
      canvasContext.lineTo(lastXPosition, 0);
      canvasContext.lineTo(firstXPosition, 0);
      canvasContext.closePath();
      canvasContext.fillStyle = "rgba(239, 68, 68, 0.2)";
      canvasContext.fill();
      canvasContext.beginPath();
      timeline.forEach((point, index) => {
        const ceiling = Number.isFinite(point.ceiling) ? point.ceiling : 0;
        const xPosition = (point.time / state.totalMinutes) * width;
        const yPosition = (ceiling / state.maxDepth) * height;
        if (index === 0) {
          canvasContext.moveTo(xPosition, yPosition);
        } else {
          canvasContext.lineTo(xPosition, yPosition);
        }
      });
      canvasContext.strokeStyle = "rgba(239, 68, 68, 0.65)";
      canvasContext.lineWidth = 2;
      canvasContext.stroke();
      canvasContext.restore();
    }

    canvasContext.beginPath();
    profilePoints.forEach((point, index) => {
      const xPosition = point.timeFraction * width;
      const yPosition = (point.depth / state.maxDepth) * height;
      if (index === 0) {
        canvasContext.moveTo(xPosition, yPosition);
      } else {
        canvasContext.lineTo(xPosition, yPosition);
      }
    });
    canvasContext.strokeStyle = "#2563eb";
    canvasContext.lineWidth = 3;
    canvasContext.stroke();

    if (state.points.length) {
      canvasContext.fillStyle = "rgba(37, 99, 235, 0.85)";
      state.points.forEach((point) => {
        const xPosition = point.timeFraction * width;
        const yPosition = (point.depth / state.maxDepth) * height;
        canvasContext.beginPath();
        canvasContext.arc(xPosition, yPosition, 3.5, 0, Math.PI * 2);
        canvasContext.fill();
      });
    }

    if (Number.isFinite(state.hoverTime)) {
      const cursorX = (state.hoverTime / state.totalMinutes) * width;
      canvasContext.beginPath();
      canvasContext.moveTo(cursorX, 0);
      canvasContext.lineTo(cursorX, height);
      canvasContext.strokeStyle = "rgba(148, 163, 184, 0.6)";
      canvasContext.lineWidth = 2;
      canvasContext.stroke();
    }

    if (Number.isInteger(state.hoverIndex) && state.points[state.hoverIndex]) {
      const hoverPoint = state.points[state.hoverIndex];
      const hoverX = hoverPoint.timeFraction * width;
      const hoverY = (hoverPoint.depth / state.maxDepth) * height;
      canvasContext.beginPath();
      canvasContext.arc(hoverX, hoverY, 6, 0, Math.PI * 2);
      canvasContext.fillStyle = "rgba(37, 99, 235, 0.9)";
      canvasContext.fill();
      canvasContext.beginPath();
      canvasContext.arc(hoverX, hoverY, 9, 0, Math.PI * 2);
      canvasContext.strokeStyle = "rgba(37, 99, 235, 0.25)";
      canvasContext.lineWidth = 2;
      canvasContext.stroke();
    }
  }

  function updateReadouts({ snapshot, depthReadout, timeReadout }) {
    if (!snapshot) {
      return;
    }
    const depth = snapshot.depth || 0;
    const depthUnit = getTranslation("units.metersShort", "m");
    depthReadout.textContent = `${depth.toFixed(1)} ${depthUnit}`;
    timeReadout.textContent = formatTime(snapshot.time);
  }

  window.DiveSim.ui = {
    clamp,
    formatTime,
    drawScene,
    updateReadouts
  };
})();
