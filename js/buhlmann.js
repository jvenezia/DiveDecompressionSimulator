(() => {
  window.DiveSim = window.DiveSim || {};

  const { COMPARTMENTS, NITROGEN_FRACTION, WATER_VAPOR_PRESSURE } = window.DiveSim.constants;

  const LOG_OF_TWO = Math.log(2);

  function calculateInspiredNitrogenPressure(ambientPressure) {
    return Math.max(0, (ambientPressure - WATER_VAPOR_PRESSURE) * NITROGEN_FRACTION);
  }

  class BuhlmannModel {
    constructor() {
      const surface = calculateInspiredNitrogenPressure(1.0);
      this.compartments = COMPARTMENTS.map((compartment) => ({
        ...compartment,
        pressure: surface
      }));
    }

    updateSegment(depthMeters, minutes) {
      const ambient = 1 + depthMeters / 10;
      const inspired = calculateInspiredNitrogenPressure(ambient);
      this.compartments.forEach((compartment) => {
        const decayConstant = LOG_OF_TWO / compartment.halfTime;
        compartment.pressure =
          inspired + (compartment.pressure - inspired) * Math.exp(-decayConstant * minutes);
      });
      return ambient;
    }

    getTissues() {
      return this.compartments.map((compartment) => compartment.pressure);
    }

    getCeiling(gradientFactor) {
      let maxAmbient = 1.0;
      this.compartments.forEach((compartment) => {
        const denominator =
          gradientFactor / compartment.bCoefficient + (1 - gradientFactor);
        if (denominator <= 0) {
          return;
        }
        const ambient =
          (compartment.pressure - gradientFactor * compartment.aCoefficient) / denominator;
        if (ambient > maxAmbient) {
          maxAmbient = ambient;
        }
      });
      return maxAmbient;
    }
  }

  function calculateTissueSaturation(pressures, ambientPressure) {
    const inspired = calculateInspiredNitrogenPressure(ambientPressure) || 0.0001;
    return pressures.map((pressure) => ({
      saturation: pressure / inspired
    }));
  }

  function buildStops(ceilingMeters) {
    if (ceilingMeters <= 0.1) {
      return [];
    }
    const rounded = Math.ceil(ceilingMeters / 3) * 3;
    return [{ depth: rounded, time: 1 }];
  }

  window.DiveSim.buhlmann = {
    BuhlmannModel,
    calculateTissueSaturation,
    buildStops
  };
})();
