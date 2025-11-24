import { GoogleGenAI } from "@google/genai";
import type { InsightResponse, PredictionInput } from "../types";

const createClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    console.warn("API Key not found via process.env.API_KEY");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getExploratoryInsights = async (
  summaryStats: string
): Promise<string> => {
  const ai = createClient();
  if (!ai)
    return "Gemini API Key is missing. Please configure your environment.";

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Act as a Senior Data Scientist specializing in wearable biosignals. 
      Analyze the following statistical summary of a stress monitoring dataset with 3 classes:
      0 = Baseline/Relaxed
      1 = Moderate Stress/Cognitive Load
      2 = High Stress/Fear
      
      Features: HR (Heart Rate), EDA (Skin Conductance), BVP, Accelerometer.
      
      Summary Stats:
      ${summaryStats}
      
      Provide 3 high-level insights about the feature separability and physiological patterns. 
      Use technical but accessible language.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Failed to generate AI insights at this time.";
  }
};

export const predictStressExplanation = async (
  input: PredictionInput
): Promise<InsightResponse> => {
  const ai = createClient();

  // Fallback if no API key
  if (!ai) {
    let riskLevel: "Baseline" | "Elevated" | "High Risk" = "Baseline";
    if (input.hr > 100 || input.eda > 2.0) riskLevel = "High Risk";
    else if (input.hr > 85 || input.eda > 1.0) riskLevel = "Elevated";

    return {
      analysis:
        "API Key missing. Local heuristic based on HR/EDA thresholds applied.",
      riskLevel,
    };
  }

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are an advanced stress analysis engine. Predict the stress level (0, 1, or 2) based on these sensor readings:
      
      - Heart Rate (HR): ${input.hr} bpm
      - Electrodermal Activity (EDA): ${input.eda} microsiemens
      - Blood Volume Pulse (BVP): ${input.bvp}
      - Accelerometer (X,Y,Z): ${input.x}, ${input.y}, ${input.z}

      Context:
      0 = Baseline
      1 = Moderate Stress
      2 = High Stress

      Return a JSON object:
      {
        "analysis": "2 concise sentences explaining the physiological markers triggering this prediction.",
        "riskLevel": "Baseline" | "Elevated" | "High Risk"
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const json = JSON.parse(text);
    return {
      analysis: json.analysis || "Analysis unavailable.",
      riskLevel: json.riskLevel || "Baseline",
    };
  } catch (error) {
    console.error("Prediction error:", error);
    return {
      analysis: "Error connecting to AI analysis engine.",
      riskLevel: "Elevated",
    };
  }
};
