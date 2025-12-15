export interface StressDataResponse {
  data: StressDataPoint[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  details: {
    avg_hr: number;
    avg_eda: number;
    labels: {
      "0": number;
      "1": number;
      "2": number;
    };
  };
}

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
  accMagnitude?: number; // Optional derived property
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

export interface PCADataPoint {
  id: number;
  pc1: number;
  pc2: number;
  pc3: number;
  label: number;
}

export interface PCAResponse {
  data: PCADataPoint[];
  variance: {
    pc1: number;
    pc2: number;
    pc3: number;
    total: number;
  };
}
