(() => {
  window.DiveSim = window.DiveSim || {};

  const N2_FRACTION = 0.79;
  const WATER_VAPOR_PRESSURE = 0.0627;

  const COMPARTMENTS = [
    { halfTime: 4.0, a: 1.2599, b: 0.5050 },
    { halfTime: 8.0, a: 1.0000, b: 0.6514 },
    { halfTime: 12.5, a: 0.8618, b: 0.7222 },
    { halfTime: 18.5, a: 0.7562, b: 0.7825 },
    { halfTime: 27.0, a: 0.6667, b: 0.8125 },
    { halfTime: 38.3, a: 0.5933, b: 0.8434 },
    { halfTime: 54.3, a: 0.5282, b: 0.8693 },
    { halfTime: 77.0, a: 0.4701, b: 0.8910 },
    { halfTime: 109.0, a: 0.4187, b: 0.9092 },
    { halfTime: 146.0, a: 0.3798, b: 0.9222 },
    { halfTime: 187.0, a: 0.3497, b: 0.9319 },
    { halfTime: 239.0, a: 0.3223, b: 0.9403 },
    { halfTime: 305.0, a: 0.2971, b: 0.9477 },
    { halfTime: 390.0, a: 0.2737, b: 0.9544 },
    { halfTime: 498.0, a: 0.2523, b: 0.9602 },
    { halfTime: 635.0, a: 0.2327, b: 0.9653 }
  ];

  window.DiveSim.constants = {
    N2_FRACTION,
    WATER_VAPOR_PRESSURE,
    COMPARTMENTS
  };
})();
