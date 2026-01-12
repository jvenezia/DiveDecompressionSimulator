(() => {
  window.DiveSim = window.DiveSim || {};

  const NITROGEN_FRACTION = 0.79;
  const WATER_VAPOR_PRESSURE = 0.0627;

  const COMPARTMENTS = [
    { halfTime: 4.0, aCoefficient: 1.2599, bCoefficient: 0.5050 },
    { halfTime: 8.0, aCoefficient: 1.0000, bCoefficient: 0.6514 },
    { halfTime: 12.5, aCoefficient: 0.8618, bCoefficient: 0.7222 },
    { halfTime: 18.5, aCoefficient: 0.7562, bCoefficient: 0.7825 },
    { halfTime: 27.0, aCoefficient: 0.6667, bCoefficient: 0.8125 },
    { halfTime: 38.3, aCoefficient: 0.5933, bCoefficient: 0.8434 },
    { halfTime: 54.3, aCoefficient: 0.5282, bCoefficient: 0.8693 },
    { halfTime: 77.0, aCoefficient: 0.4701, bCoefficient: 0.8910 },
    { halfTime: 109.0, aCoefficient: 0.4187, bCoefficient: 0.9092 },
    { halfTime: 146.0, aCoefficient: 0.3798, bCoefficient: 0.9222 },
    { halfTime: 187.0, aCoefficient: 0.3497, bCoefficient: 0.9319 },
    { halfTime: 239.0, aCoefficient: 0.3223, bCoefficient: 0.9403 },
    { halfTime: 305.0, aCoefficient: 0.2971, bCoefficient: 0.9477 },
    { halfTime: 390.0, aCoefficient: 0.2737, bCoefficient: 0.9544 },
    { halfTime: 498.0, aCoefficient: 0.2523, bCoefficient: 0.9602 },
    { halfTime: 635.0, aCoefficient: 0.2327, bCoefficient: 0.9653 }
  ];

  window.DiveSim.constants = {
    NITROGEN_FRACTION,
    WATER_VAPOR_PRESSURE,
    COMPARTMENTS
  };
})();
