/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PredictionInput, StressDataPoint } from "../types";

const API_BASE_URL = "http://127.0.0.1:5000";

export const checkBackendStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const predictWithModel = async (input: PredictionInput) => {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error("Prediction failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Backend API Error:", error);
    throw error;
  }
};

export const fetchRealDataset = async (): Promise<StressDataPoint[] | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/history`);
    if (!response.ok) return null;
    let data = await response.json();

    // Data Processing & Optimization
    // Ensure every row has an ID and numbers are parsed correctly
    return data.map((d: any, index: number) => ({
      id: d.id !== undefined ? d.id : index, // Fallback ID
      x: Number(d.x || 0),
      y: Number(d.y || 0),
      z: Number(d.z || 0),
      bvp: Number(d.bvp || 0),
      eda: Number(d.eda || 0),
      hr: Number(d.hr || 0),
      label: Number(d.label || 0),
      timestamp: d.timestamp || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch dataset:", error);
    return null;
  }
};
