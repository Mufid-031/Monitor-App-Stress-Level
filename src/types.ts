export interface StressDataPoint {
  id: number;
  x: number;
  y: number;
  z: number;
  bvp: number;
  eda: number;
  hr: number;
  label: number; // 0 = Baseline, 1 = Transient Stress, 2 = High Stress
  timestamp: string;
}

export enum NavigationPage {
  DASHBOARD = "dashboard",
  DATASET = "dataset",
  ANALYTICS = "analytics",
  PREDICTION = "prediction",
}

export interface PredictionInput {
  x: number;
  y: number;
  z: number;
  bvp: number;
  eda: number;
  hr: number;
}

export interface InsightResponse {
  analysis: string;
  riskLevel: "Baseline" | "Elevated" | "High Risk";
}
