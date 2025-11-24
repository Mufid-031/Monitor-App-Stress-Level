/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */

import type { PredictionInput, StressDataPoint } from "../types";

// Use 127.0.0.1 to avoid localhost DNS resolution issues on some systems
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

// Helper to safely extract properties regardless of case (e.g., 'HR' vs 'hr')
const getSafeValue = (
  obj: any,
  keys: string[],
  defaultValue: number = 0
): number => {
  for (const key of keys) {
    // Check if key exists and is not null/undefined/empty string
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      const parsed = parseFloat(obj[key]);
      return isNaN(parsed) ? defaultValue : parsed;
    }
  }
  return defaultValue;
};

export const fetchRealDataset = async (): Promise<StressDataPoint[] | null> => {
  try {
    console.log(`Attempting to fetch data from ${API_BASE_URL}/history...`);
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      mode: "cors", // Ensure CORS is handled
    });

    if (!response.ok) {
      console.warn(`Backend response not OK: ${response.status}`);
      return null;
    }

    let data = await response.json();
    console.log(`Successfully fetched ${data.length} records.`);

    // Data Processing & Optimization
    // Robust mapping for case-insensitive keys (CSV headers might be CAPS)
    return data.map((d: any, index: number) => ({
      id: d.id !== undefined ? d.id : index, // Fallback ID

      // Try multiple key variations for safety
      x: getSafeValue(d, ["x", "X", "acc_x"]),
      y: getSafeValue(d, ["y", "Y", "acc_y"]),
      z: getSafeValue(d, ["z", "Z", "acc_z"]),
      bvp: getSafeValue(d, ["bvp", "BVP"]),
      eda: getSafeValue(d, ["eda", "EDA", "GSR"]),
      hr: getSafeValue(d, ["hr", "HR", "BPM"]),

      // Fix for missing Labels: check 'label', 'LABEL', 'Label', 'class'
      label: getSafeValue(d, ["label", "LABEL", "Label", "class"]),

      timestamp: d.timestamp || d.time || new Date().toISOString(),
    }));
  } catch (error) {
    // Log error but return null so the app falls back to Mock Data gracefully
    console.warn(
      "Could not connect to Python Backend. Using Mock Data instead.",
      error
    );
    return null;
  }
};
