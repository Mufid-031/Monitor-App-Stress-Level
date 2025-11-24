import type { StressDataPoint } from "./types";

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

export const generateMockData = (count: number): StressDataPoint[] => {
  const data: StressDataPoint[] = [];
  const startTime = new Date().getTime();

  for (let i = 0; i < count; i++) {
    // Generate 3 labels: 0 (Baseline), 1 (Transient/Medium), 2 (High Stress)
    const rand = Math.random();
    let label = 0;
    if (rand > 0.6) label = 1;
    if (rand > 0.85) label = 2;

    // Baseline values
    let baseHr = 65 + Math.random() * 15;
    let baseEda = 0.2 + Math.random() * 0.3;
    let baseBvp = 0 + Math.random() * 5;
    let baseX = 15;
    let baseY = 18;
    let baseZ = 59;

    // Adjust characteristics based on label
    if (label === 1) {
      baseHr = 85 + Math.random() * 15; // Elevated HR
      baseEda = 0.6 + Math.random() * 1.0; // Moderate sweating
      baseBvp = -10 + Math.random() * 20; // Irregular BVP
      baseY = 25; // Some movement
    } else if (label === 2) {
      baseHr = 110 + Math.random() * 30; // High HR
      baseEda = 2.0 + Math.random() * 4.0; // High sweating
      baseBvp = -30 + Math.random() * 60; // Chaotic BVP
      baseX = 12 + Math.random() * 10; // High movement
      baseY = 20 + Math.random() * 10;
      baseZ = 55 + Math.random() * 10;
    }

    data.push({
      id: i,
      x: parseFloat((baseX + Math.random()).toFixed(2)),
      y: parseFloat((baseY + Math.random()).toFixed(2)),
      z: parseFloat((baseZ + Math.random()).toFixed(2)),
      bvp: parseFloat(baseBvp.toFixed(2)),
      eda: parseFloat(baseEda.toFixed(6)),
      hr: parseFloat(baseHr.toFixed(2)),
      label: label,
      timestamp: new Date(startTime + i * 1000).toLocaleTimeString(),
    });
  }
  return data;
};

export const MOCK_DATASET = generateMockData(300); // Increased data points for better visuals
