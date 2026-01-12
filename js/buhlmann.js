(() => {
  window.DiveSim = window.DiveSim || {};

  const { COMPARTMENTS, N2_FRACTION, WATER_VAPOR_PRESSURE } = window.DiveSim.constants;

  const LN2 = Math.log(2);

  function inspiredN2(ambientPressure) {
    return Math.max(0, (ambientPressure - WATER_VAPOR_PRESSURE) * N2_FRACTION);
  }

  class BuhlmannModel {
    constructor() {
      const surface = inspiredN2(1.0);
      this.compartments = COMPARTMENTS.map((compartment) => ({
        ...compartment,
        pressure: surface
      }));
    }

    updateSegment(depthMeters, minutes) {
      const ambient = 1 + depthMeters / 10;
      const inspired = inspiredN2(ambient);
      this.compartments.forEach((compartment) => {
        const k = LN2 / compartment.halfTime;
        compartment.pressure = inspired + (compartment.pressure - inspired) * Math.exp(-k * minutes);
      });
      return ambient;
    }

    getTissues() {
      return this.compartments.map((compartment) => compartment.pressure);
    }

    getCeiling(gf) {
      let maxAmbient = 1.0;
      this.compartments.forEach((compartment) => {
        // Buhlmann M-line uses P_amb = (P_t - a) * b, so GF uses 1/b in the slope.
        const denominator = gf / compartment.b + (1 - gf);
        if (denominator <= 0) {
          return;
        }
        const ambient = (compartment.pressure - gf * compartment.a) / denominator;
        if (ambient > maxAmbient) {
          maxAmbient = ambient;
        }
      });
      return maxAmbient;
    }
  }

  function tissueSaturation(pressures, ambientPressure) {
    const inspired = inspiredN2(ambientPressure) || 0.0001;
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
    tissueSaturation,
    buildStops
  };
})();
