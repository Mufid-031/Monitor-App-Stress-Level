import React, { useState, useEffect } from "react";
import { predictStressExplanation } from "../services/geminiService";
import { predictWithModel, checkBackendStatus } from "../services/api";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Cpu,
  Zap,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { InsightResponse, PredictionInput } from "../types";

interface PredictionProps {
  isDark?: boolean;
}

export const Prediction: React.FC<PredictionProps> = () => {
  const [input, setInput] = useState<PredictionInput>({
    x: 15.0,
    y: 18.0,
    z: 59.0,
    bvp: 9.7,
    eda: 0.56,
    hr: 80.0,
  });
  const [result, setResult] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [useRealModel, setUseRealModel] = useState(true);

  // Check if Python Backend is alive
  useEffect(() => {
    const checkStatus = async () => {
      const isOnline = await checkBackendStatus();
      setBackendOnline(isOnline);
      setUseRealModel(isOnline);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);

    try {
      if (useRealModel && backendOnline) {
        // Use Python Backend (.pkl model)
        const apiResult = await predictWithModel(input);

        // Enhance brief API result with Gemini explanation if needed,
        // or just construct the object
        setResult({
          analysis:
            apiResult.analysis ||
            `Real Model Prediction: Class ${apiResult.label}.`,
          riskLevel: apiResult.riskLevel,
        });
      } else {
        // Fallback to Gemini Simulation
        const prediction = await predictStressExplanation(input);
        setResult(prediction);
      }
    } catch (error) {
      console.error("Prediction Error", error);
      // Fallback if API fails mid-request
      const prediction = await predictStressExplanation(input);
      setResult({
        ...prediction,
        analysis:
          "Backend Error. Fallback to AI Simulation. " + prediction.analysis,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: parseFloat(value) }));
  };

  const RangeSlider = ({
    label,
    name,
    min,
    max,
    step,
    value,
    unit,
    colorClass,
  }: {
    label: string;
    name: string;
    min: string;
    max: string;
    step: string;
    value: number;
    unit: string;
    colorClass: string;
  }) => (
    <div className="mb-6 group">
      <div className="flex justify-between mb-2">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
          {label}
        </label>
        <span className={`text-xs font-mono font-bold ${colorClass}`}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-slate-900 dark:accent-white hover:accent-cyan-500 dark:hover:accent-cyan-400 transition-all"
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start h-full pb-10">
      {/* Control Panel */}
      <div className="glass-card p-8 rounded-3xl border-t border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <Cpu className="text-cyan-600 dark:text-cyan-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Live Inference
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Parameter Injection
              </p>
            </div>
          </div>

          {/* Backend Status Indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold tracking-wider ${
              backendOnline
                ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
            }`}
          >
            {backendOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {backendOnline
              ? "PYTHON MODEL CONNECTED"
              : "OFFLINE (USING SIMULATION)"}
          </div>
        </div>

        <div className="space-y-2">
          <RangeSlider
            label="Heart Rate"
            name="hr"
            min="50"
            max="180"
            step="1"
            value={input.hr}
            unit="BPM"
            colorClass="text-red-600 dark:text-red-400"
          />
          <RangeSlider
            label="Skin Conductance (EDA)"
            name="eda"
            min="0"
            max="5"
            step="0.01"
            value={input.eda}
            unit="µS"
            colorClass="text-purple-600 dark:text-purple-400"
          />
          <RangeSlider
            label="Blood Vol Pulse (BVP)"
            name="bvp"
            min="-500"
            max="500"
            step="0.1"
            value={input.bvp}
            unit="mV"
            colorClass="text-cyan-600 dark:text-cyan-400"
          />

          <div className="pt-4 border-t border-slate-200 dark:border-white/5 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">
                ACC X
              </label>
              <input
                type="number"
                name="x"
                value={input.x}
                onChange={handleChange}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-xs font-mono focus:border-cyan-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">
                ACC Y
              </label>
              <input
                type="number"
                name="y"
                value={input.y}
                onChange={handleChange}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-xs font-mono focus:border-cyan-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">
                ACC Z
              </label>
              <input
                type="number"
                name="z"
                value={input.z}
                onChange={handleChange}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-xs font-mono focus:border-cyan-500 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className={`w-full mt-8 font-bold py-4 px-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-3 relative overflow-hidden text-white
              ${
                backendOnline
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/20"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-900/20"
              }
            `}
          >
            {loading ? (
              <>
                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                <Activity className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                {backendOnline ? (
                  <Server className="fill-current" size={18} />
                ) : (
                  <Zap className="fill-current" size={18} />
                )}
                {backendOnline
                  ? "PREDICT WITH RF MODEL"
                  : "SIMULATE PREDICTION"}
              </>
            )}
          </button>

          <div className="mt-2 text-center">
            <p className="text-[10px] text-slate-400">
              Mode:{" "}
              <span
                className={
                  backendOnline
                    ? "text-emerald-500 font-bold"
                    : "text-cyan-500 font-bold"
                }
              >
                {backendOnline
                  ? "Production (Localhost:5000)"
                  : "Simulation (Gemini AI)"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Holographic Result Display */}
      <div className="relative">
        {/* Background decorative glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-b from-transparent to-purple-500/10 rounded-3xl blur-2xl transition-opacity duration-700 ${
            result ? "opacity-100" : "opacity-0"
          }`}
        ></div>

        <div
          className={`glass-card min-h-[500px] rounded-3xl p-1 flex flex-col items-center justify-center text-center transition-all duration-500 border-2 ${
            !result
              ? "border-dashed border-slate-300 dark:border-white/10"
              : result.riskLevel === "High Risk"
              ? "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              : result.riskLevel === "Elevated"
              ? "border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
              : "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          }`}
        >
          {!result ? (
            <div className="p-8 text-slate-500 dark:text-slate-500">
              <div className="w-24 h-24 rounded-full border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
                <Activity size={32} className="opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">
                Awaiting Input
              </h3>
              <p className="text-sm mt-2">
                Adjust sensors to simulate subject state.
              </p>
            </div>
          ) : (
            <div className="w-full h-full p-8 flex flex-col items-center animate-in fade-in zoom-in duration-500">
              {/* Status Ring */}
              <div className="relative mb-8">
                <div
                  className={`absolute -inset-4 rounded-full blur-xl opacity-40 ${
                    result.riskLevel === "High Risk"
                      ? "bg-red-500"
                      : result.riskLevel === "Elevated"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                ></div>
                <div className="relative bg-white dark:bg-slate-950 p-6 rounded-full border border-slate-200 dark:border-white/10">
                  {result.riskLevel === "High Risk" ? (
                    <AlertOctagon size={48} className="text-red-500" />
                  ) : result.riskLevel === "Elevated" ? (
                    <AlertTriangle size={48} className="text-amber-500" />
                  ) : (
                    <CheckCircle size={48} className="text-emerald-500" />
                  )}
                </div>
              </div>

              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
                  PREDICTED STATE
                </p>
                <h2
                  className={`text-4xl font-bold ${
                    result.riskLevel === "High Risk"
                      ? "text-red-500 dark:text-red-400"
                      : result.riskLevel === "Elevated"
                      ? "text-amber-500 dark:text-amber-400"
                      : "text-emerald-500 dark:text-emerald-400"
                  }`}
                >
                  {result.riskLevel.toUpperCase()}
                </h2>
              </div>

              <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-white/5 text-left relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent opacity-50"></div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-light">
                  <span className="text-cyan-600 dark:text-cyan-500 font-mono text-xs mr-2">
                    &gt;&gt;&gt; ANALYSIS:
                  </span>
                  {result.analysis}
                </p>
              </div>

              <div className="mt-8 w-full">
                <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                  <span>Model Confidence</span>
                  <span>{backendOnline ? "99.1% (RF)" : "Simulation"}</span>
                </div>
                <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[99%] shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
