import type { StressDataPoint, StressDataResponse } from "./types";

// Web3 / Cyberpunk Color Palette
export const CHART_COLORS = {
  hr: "#ef4444", // Neon Red
  eda: "#8b5cf6", // Neon Purple
  bvp: "#06b6d4", // Cyan
  x: "#f59e0b", // Amber
  y: "#10b981", // Emerald
  z: "#ec4899", // Pink
  grid: "#1e293b", // Dark Slate
  text: "#94a3b8", // Light Slate
};

export const LABEL_COLORS = {
  0: "#10b981", // Baseline - Green
  1: "#f59e0b", // Transient - Orange
  2: "#ef4444", // High - Red
};

export const generateMockStressResponse = (
  limit: number = 100,
  offset: number = 0,
  total: number = 300
): StressDataResponse => {
  const data: StressDataPoint[] = [];
  const startTime = Date.now() - total * 1000;

  for (let i = 0; i < limit; i++) {
    const id = offset + i;

    // Label distribution
    const r = Math.random();
    let label = 0;
    if (r > 0.65) label = 1;
    if (r > 0.85) label = 2;

    // Default (Baseline)
    let hr = 65 + Math.random() * 10;
    let eda = 0.2 + Math.random() * 0.2;
    let bvp = Math.random() * 5;
    let x = 15 + Math.random();
    let y = 18 + Math.random();
    let z = 60 + Math.random();

    // Transient stress
    if (label === 1) {
      hr = 85 + Math.random() * 15;
      eda = 0.6 + Math.random() * 0.8;
      bvp = -10 + Math.random() * 20;
      y += Math.random() * 5;
    }

    // High stress
    if (label === 2) {
      hr = 110 + Math.random() * 25;
      eda = 2.0 + Math.random() * 3.5;
      bvp = -30 + Math.random() * 60;
      x += Math.random() * 8;
      y += Math.random() * 8;
      z -= Math.random() * 6;
    }

    const accMagnitude = Math.sqrt(x * x + y * y + z * z);

    data.push({
      id,
      x: +x.toFixed(2),
      y: +y.toFixed(2),
      z: +z.toFixed(2),
      bvp: +bvp.toFixed(2),
      eda: +eda.toFixed(6),
      hr: +hr.toFixed(2),
      label,
      accMagnitude: +accMagnitude.toFixed(2),
      timestamp: new Date(startTime + id * 1000).toISOString(),
    });
  }

  return {
    data,
    pagination: {
      limit,
      offset,
      total,
    },
    details: {
      avg_hr: data.reduce((sum, point) => sum + point.hr, 0) / data.length,
      avg_eda: data.reduce((sum, point) => sum + point.eda, 0) / data.length,
      labels: {
        "0": data.filter((d) => d.label === 0).length,
        "1": data.filter((d) => d.label === 1).length,
        "2": data.filter((d) => d.label === 2).length,
      },
    },
  };
};

export const MOCK_DATASET = generateMockStressResponse(100, 0, 300);
