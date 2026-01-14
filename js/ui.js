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

  function formatDepth(depthMeters) {
    const value = Number.isFinite(depthMeters) ? depthMeters : 0;
    const decimals = value % 1 === 0 ? 0 : 1;
    return `${value.toFixed(decimals)}m`;
  }

  function formatPressure(pressureBar) {
    const value = Number.isFinite(pressureBar) ? pressureBar : 0;
    let decimals = 2;
    if (value % 1 === 0) {
      decimals = 0;
    } else if ((value * 10) % 1 === 0) {
      decimals = 1;
    }
    return `${value.toFixed(decimals)}b`;
  }

  function formatSpeed(speedMetersPerMinute, showPlus = false) {
    const value = Number.isFinite(speedMetersPerMinute) ? speedMetersPerMinute : 0;
    const decimals = value % 1 === 0 ? 0 : 1;
    const sign = showPlus && value > 0 ? "+" : "";
    return `${sign}${value.toFixed(decimals)}`;
  }

  function formatPercent(value) {
    const safeValue = Number.isFinite(value) ? value : 0;
    return `${Math.round(safeValue)}%`;
  }

  function getTranslation(key, fallback) {
    if (window.i18next && typeof window.i18next.t === "function") {
      return window.i18next.t(key);
    }
    return fallback;
  }

  function getCanvasSize(canvas) {
    const ratio = window.devicePixelRatio || 1;
    return {
      width: canvas.width / ratio,
      height: canvas.height / ratio
    };
  }

  function getMaxMValuePressure(ambientPressure, compartments) {
    if (!Array.isArray(compartments) || !compartments.length) {
      return ambientPressure;
    }
    let maxValue = ambientPressure;
    compartments.forEach((compartment) => {
      const value = compartment.aCoefficient + compartment.bCoefficient * ambientPressure;
      if (value > maxValue) {
        maxValue = value;
      }
    });
    return maxValue;
  }

  function drawDepthScene(canvasContext, canvas, state, profilePoints, timeline, stopSchedule) {
    const { width, height } = getCanvasSize(canvas);
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
      canvasContext.restore();
    }

    if (stopSchedule && stopSchedule.length) {
      canvasContext.save();
      canvasContext.strokeStyle = "rgba(239, 68, 68, 0.85)";
      canvasContext.lineWidth = 5;
      stopSchedule.forEach((stop) => {
        const startX = (stop.startTime / state.totalMinutes) * width;
        const endX = (stop.endTime / state.totalMinutes) * width;
        const yPosition = (stop.depth / state.maxDepth) * height;
        canvasContext.beginPath();
        canvasContext.moveTo(startX, yPosition);
        canvasContext.lineTo(endX, yPosition);
        canvasContext.stroke();
      });
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
    canvasContext.strokeStyle = "rgba(37, 99, 235, 0.60)";
    canvasContext.lineWidth = 3;
    canvasContext.stroke();

    if (state.points.length) {
      canvasContext.fillStyle = "rgba(37, 99, 235, 0.60)";
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
      canvasContext.fillStyle = "rgba(37, 99, 235, 0.75)";
      canvasContext.fill();
      canvasContext.beginPath();
      canvasContext.arc(hoverX, hoverY, 9, 0, Math.PI * 2);
      canvasContext.strokeStyle = "rgba(37, 99, 235, 0.25)";
      canvasContext.lineWidth = 2;
      canvasContext.stroke();
    }
  }

  function drawSaturationScene(canvasContext, canvas, state, timeline, maxTissuePressure) {
    const { width, height } = getCanvasSize(canvas);
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
      const pressureCeiling = Number.isFinite(maxTissuePressure) && maxTissuePressure > 0
        ? maxTissuePressure
        : 1;
      canvasContext.save();
      const tissueCount = timeline[0]?.tissues?.length ?? 0;
      if (tissueCount > 0) {
        canvasContext.lineWidth = 1.5;
        const compartmentLineColor = "rgba(148, 163, 184, 0.4)";
        for (let tissueIndex = 0; tissueIndex < tissueCount; tissueIndex++) {
          let hasStarted = false;
          canvasContext.strokeStyle = compartmentLineColor;
          canvasContext.beginPath();
          timeline.forEach((point) => {
            const tissuePressure = point.tissues?.[tissueIndex];
            if (!Number.isFinite(tissuePressure)) {
              return;
            }
            const xPosition = (point.time / state.totalMinutes) * width;
            const yPosition = height - clamp(tissuePressure / pressureCeiling, 0, 1) * height;
            if (!hasStarted) {
              canvasContext.moveTo(xPosition, yPosition);
              hasStarted = true;
            } else {
              canvasContext.lineTo(xPosition, yPosition);
            }
          });
          if (hasStarted) {
            canvasContext.stroke();
          }
        }
      }
      const gradient = canvasContext.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, "rgba(34, 197, 94, 0.8)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0.8)");
      canvasContext.strokeStyle = gradient;
      canvasContext.lineWidth = 2;
      canvasContext.beginPath();
      timeline.forEach((point, index) => {
        const xPosition = (point.time / state.totalMinutes) * width;
        const yPosition = height - clamp(point.maxTissuePressure / pressureCeiling, 0, 1) * height;
        if (index === 0) {
          canvasContext.moveTo(xPosition, yPosition);
        } else {
          canvasContext.lineTo(xPosition, yPosition);
        }
      });
      canvasContext.stroke();
      canvasContext.restore();
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
  }

  function drawSpeedScene(canvasContext, canvas, state, timeline, speedSegments, maxSpeed) {
    const { width, height } = getCanvasSize(canvas);
    canvasContext.clearRect(0, 0, width, height);
    const safeMaxSpeed = Number.isFinite(maxSpeed) && maxSpeed > 0 ? maxSpeed : 1;
    const midpoint = height / 2;

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

    const recommendedMinSpeed = 9;
    const recommendedMaxSpeed = 12;
    const zoneMin = clamp(recommendedMinSpeed / safeMaxSpeed, 0, 1);
    const zoneMax = clamp(recommendedMaxSpeed / safeMaxSpeed, 0, 1);
    const zoneHeight = (zoneMax - zoneMin) * (height / 2);
    if (zoneHeight > 0) {
      const zoneTop = midpoint - zoneMax * (height / 2);
      canvasContext.save();
      canvasContext.fillStyle = "rgba(34, 197, 94, 0.22)";
      canvasContext.fillRect(0, zoneTop, width, zoneHeight);
      canvasContext.restore();
    }

    if (timeline && speedSegments && speedSegments.length) {
      const startColor = [191, 219, 254];
      const endColor = [30, 64, 175];

      for (let index = 0; index < speedSegments.length; index++) {
        const speed = speedSegments[index];
        if (!Number.isFinite(speed)) {
          continue;
        }
        const segmentStart = timeline[index];
        const segmentEnd = timeline[index + 1];
        if (!segmentStart || !segmentEnd) {
          continue;
        }
        const startX = (segmentStart.time / state.totalMinutes) * width;
        const endX = (segmentEnd.time / state.totalMinutes) * width;
        const segmentWidth = Math.max(1, endX - startX);
        const magnitude = clamp(Math.abs(speed) / safeMaxSpeed, 0, 1);
        const barHeight = magnitude * (height / 2);
        const red = Math.round(startColor[0] + (endColor[0] - startColor[0]) * magnitude);
        const green = Math.round(startColor[1] + (endColor[1] - startColor[1]) * magnitude);
        const blue = Math.round(startColor[2] + (endColor[2] - startColor[2]) * magnitude);
        canvasContext.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        const barY = speed >= 0 ? midpoint - barHeight : midpoint;
        canvasContext.fillRect(startX, barY, segmentWidth, barHeight);
      }

      canvasContext.save();
      canvasContext.strokeStyle = "rgba(30, 41, 59, 0.3)";
      canvasContext.lineWidth = 1;
      canvasContext.beginPath();
      canvasContext.moveTo(0, midpoint);
      canvasContext.lineTo(width, midpoint);
      canvasContext.stroke();
      canvasContext.restore();
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
  }

  function getDominantCompartment(ambientPressure, compartments) {
    if (!Array.isArray(compartments) || compartments.length === 0) {
      return null;
    }
    let dominant = compartments[0];
    let maxValue = dominant.aCoefficient + dominant.bCoefficient * ambientPressure;
    compartments.forEach((compartment) => {
      const value = compartment.aCoefficient + compartment.bCoefficient * ambientPressure;
      if (value > maxValue) {
        dominant = compartment;
        maxValue = value;
      }
    });
    return dominant;
  }

  function drawRoundedRect(canvasContext, xPosition, yPosition, rectWidth, rectHeight, cornerRadius) {
    const safeRadius = Math.max(
      0,
      Math.min(cornerRadius, Math.abs(rectWidth) / 2, Math.abs(rectHeight) / 2)
    );
    canvasContext.beginPath();
    canvasContext.moveTo(xPosition + safeRadius, yPosition);
    canvasContext.arcTo(
      xPosition + rectWidth,
      yPosition,
      xPosition + rectWidth,
      yPosition + rectHeight,
      safeRadius
    );
    canvasContext.arcTo(
      xPosition + rectWidth,
      yPosition + rectHeight,
      xPosition,
      yPosition + rectHeight,
      safeRadius
    );
    canvasContext.arcTo(
      xPosition,
      yPosition + rectHeight,
      xPosition,
      yPosition,
      safeRadius
    );
    canvasContext.arcTo(
      xPosition,
      yPosition,
      xPosition + rectWidth,
      yPosition,
      safeRadius
    );
    canvasContext.closePath();
  }

  function drawMValueScene(
    canvasContext,
    canvas,
    state,
    compartments,
    nitrogenFraction,
    waterVaporPressure
  ) {
    const { width, height } = getCanvasSize(canvas);
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

    const maxAmbientPressure = Math.max(1, 1 + state.maxDepth / 10);
    const safeNitrogenFraction = Math.max(0.01, nitrogenFraction || 0);
    const safeWaterVaporPressure = Math.max(0, waterVaporPressure || 0);
    const dominantCompartment = getDominantCompartment(maxAmbientPressure, compartments);
    const aCoefficient = dominantCompartment?.aCoefficient ?? 0;
    const bCoefficient = dominantCompartment?.bCoefficient ?? 1;
    const scaleMax = 5;
    const lowGradientFactor = clamp(state.gradientFactorLow, 0, 1);
    const highGradientFactor = clamp(state.gradientFactorHigh, 0, 1);
    const highPointPressure =
      highGradientFactor * (aCoefficient + bCoefficient * safeWaterVaporPressure);

    const slopeMValue = bCoefficient / safeNitrogenFraction;
    const interceptMValue = aCoefficient + bCoefficient * safeWaterVaporPressure;
    const currentStartX = 0;
    const currentStartY = highPointPressure;
    const mValueAtScaleMax = slopeMValue * scaleMax + interceptMValue;
    const currentEndX = scaleMax;
    const currentEndY = scaleMax + lowGradientFactor * (mValueAtScaleMax - scaleMax);
    const currentSlope = Math.abs(currentEndX - currentStartX) > 0.0001
      ? (currentEndY - currentStartY) / (currentEndX - currentStartX)
      : 0;
    const currentIntercept = currentStartY - currentSlope * currentStartX;

    const toScreenX = (value) => (value / scaleMax) * width;
    const toScreenY = (value) => height - (value / scaleMax) * height;
    const toDataX = (value) => (value / width) * scaleMax;
    const toDataY = (value) => ((height - value) / height) * scaleMax;

    const drawLine = (slope, intercept, strokeStyle) => {
      const candidates = [];
      const yAtZero = intercept;
      if (Number.isFinite(yAtZero) && yAtZero >= 0 && yAtZero <= scaleMax) {
        candidates.push({ x: 0, y: yAtZero });
      }
      const yAtMax = slope * scaleMax + intercept;
      if (Number.isFinite(yAtMax) && yAtMax >= 0 && yAtMax <= scaleMax) {
        candidates.push({ x: scaleMax, y: yAtMax });
      }
      if (Math.abs(slope) > 0.0001) {
        const xAtZero = -intercept / slope;
        if (Number.isFinite(xAtZero) && xAtZero >= 0 && xAtZero <= scaleMax) {
          candidates.push({ x: xAtZero, y: 0 });
        }
        const xAtMax = (scaleMax - intercept) / slope;
        if (Number.isFinite(xAtMax) && xAtMax >= 0 && xAtMax <= scaleMax) {
          candidates.push({ x: xAtMax, y: scaleMax });
        }
      }
      const uniquePoints = [];
      candidates.forEach((point) => {
        const exists = uniquePoints.some((stored) =>
          Math.abs(stored.x - point.x) < 0.001 && Math.abs(stored.y - point.y) < 0.001);
        if (!exists) {
          uniquePoints.push(point);
        }
      });
      if (uniquePoints.length < 2) {
        return;
      }
      let first = uniquePoints[0];
      let last = uniquePoints[1];
      if (uniquePoints.length > 2) {
        let maxDistance = -1;
        for (let firstIndex = 0; firstIndex < uniquePoints.length; firstIndex++) {
          for (let secondIndex = firstIndex + 1; secondIndex < uniquePoints.length; secondIndex++) {
            const start = uniquePoints[firstIndex];
            const end = uniquePoints[secondIndex];
            const distance = (start.x - end.x) ** 2 + (start.y - end.y) ** 2;
            if (distance > maxDistance) {
              maxDistance = distance;
              first = start;
              last = end;
            }
          }
        }
      }
      canvasContext.save();
      canvasContext.strokeStyle = strokeStyle;
      canvasContext.lineWidth = 2;
      canvasContext.beginPath();
      canvasContext.moveTo(toScreenX(first.x), toScreenY(first.y));
      canvasContext.lineTo(toScreenX(last.x), toScreenY(last.y));
      canvasContext.stroke();
      canvasContext.restore();
    };

    drawLine(slopeMValue, interceptMValue, "rgba(239, 68, 68, 0.9)");
    drawLine(1, 0, "rgba(34, 197, 94, 0.9)");

    const gradientSteps = 140;
    const ambientColor = [34, 197, 94];
    const mValueColor = [239, 68, 68];
    for (let index = 0; index < gradientSteps; index++) {
      const startX = (index / gradientSteps) * scaleMax;
      const endX = ((index + 1) / gradientSteps) * scaleMax;
      const startY = currentSlope * startX + currentIntercept;
      const endY = currentSlope * endX + currentIntercept;
      if (
        !Number.isFinite(startY) ||
        !Number.isFinite(endY) ||
        startY < 0 ||
        startY > scaleMax ||
        endY < 0 ||
        endY > scaleMax
      ) {
        continue;
      }
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const ambientMidY = midX;
      const mValueMidY = slopeMValue * midX + interceptMValue;
      const range = mValueMidY - ambientMidY;
      const ratio = range !== 0
        ? clamp((midY - ambientMidY) / range, 0, 1)
        : 0;
      const red = Math.round(ambientColor[0] + (mValueColor[0] - ambientColor[0]) * ratio);
      const green = Math.round(ambientColor[1] + (mValueColor[1] - ambientColor[1]) * ratio);
      const blue = Math.round(ambientColor[2] + (mValueColor[2] - ambientColor[2]) * ratio);
      canvasContext.save();
      canvasContext.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
      canvasContext.lineWidth = 2;
      canvasContext.beginPath();
      canvasContext.moveTo(toScreenX(startX), toScreenY(startY));
      canvasContext.lineTo(toScreenX(endX), toScreenY(endY));
      canvasContext.stroke();
      canvasContext.restore();
    }

    const topZoneY = 0;
    const topZoneDataY = toDataY(topZoneY);
    const topZoneStartX = clamp((topZoneDataY - interceptMValue) / slopeMValue, 0, scaleMax);
    const topZoneEndX = clamp(topZoneDataY, 0, scaleMax);
    const topZoneHeight = Math.max(3, Math.round(height * 0.0125));
    const topZoneStartScreenX = toScreenX(Math.min(topZoneStartX, topZoneEndX));
    const topZoneWidth = Math.abs(toScreenX(topZoneEndX) - toScreenX(topZoneStartX));
    const topZoneRadius = Math.min(10, Math.round(topZoneHeight * 0.5));
    const topZonePadding = Math.max(4, Math.round(width * 0.01));
    const topZonePaddedStart = clamp(
      topZoneStartScreenX - topZonePadding,
      0,
      width
    );
    const topZonePaddedEnd = clamp(
      topZoneStartScreenX + topZoneWidth + topZonePadding,
      0,
      width
    );
    const topZonePaddedWidth = Math.max(0, topZonePaddedEnd - topZonePaddedStart);
    canvasContext.save();
    canvasContext.fillStyle = "rgb(168, 85, 247)";
    drawRoundedRect(
      canvasContext,
      topZonePaddedStart,
      topZoneY,
      topZonePaddedWidth,
      topZoneHeight,
      topZoneRadius
    );
    canvasContext.fill();
    canvasContext.restore();

    const leftZoneX = 0;
    const leftZoneDataX = toDataX(leftZoneX);
    const leftZoneStartY = clamp(slopeMValue * leftZoneDataX + interceptMValue, 0, scaleMax);
    const leftZoneEndY = clamp(leftZoneDataX, 0, scaleMax);
    const leftZoneWidth = Math.max(3, Math.round(width * 0.0125));
    const leftZoneStartScreenY = toScreenY(leftZoneStartY);
    const leftZoneEndScreenY = toScreenY(leftZoneEndY);
    const leftZoneTop = Math.min(leftZoneStartScreenY, leftZoneEndScreenY);
    const leftZoneHeight = Math.abs(leftZoneEndScreenY - leftZoneStartScreenY);
    const leftZoneRadius = Math.min(10, Math.round(leftZoneWidth * 0.5));
    const leftZonePadding = Math.max(4, Math.round(height * 0.01));
    const leftZonePaddedTop = clamp(leftZoneTop - leftZonePadding, 0, height);
    const leftZonePaddedBottom = clamp(leftZoneTop + leftZoneHeight + leftZonePadding, 0, height);
    const leftZonePaddedHeight = Math.max(0, leftZonePaddedBottom - leftZonePaddedTop);
    canvasContext.save();
    canvasContext.fillStyle = "rgb(245, 158, 11)";
    drawRoundedRect(
      canvasContext,
      leftZoneX,
      leftZonePaddedTop,
      leftZoneWidth,
      leftZonePaddedHeight,
      leftZoneRadius
    );
    canvasContext.fill();
    canvasContext.restore();
  }

  function updateReadouts({ snapshot, depthReadout, timeReadout }) {
    if (!snapshot) {
      return;
    }
    const depth = snapshot.depth || 0;
    depthReadout.textContent = formatDepth(depth);
    timeReadout.textContent = formatTime(snapshot.time);
  }

  window.DiveSim.ui = {
    clamp,
    formatTime,
    formatDepth,
    formatPressure,
    formatSpeed,
    formatPercent,
    drawDepthScene,
    drawSaturationScene,
    drawSpeedScene,
    drawMValueScene,
    updateReadouts,
    getTranslation
  };
})();
