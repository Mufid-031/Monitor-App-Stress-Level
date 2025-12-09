/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { CHART_COLORS } from "../constants";
import {
  Sparkles,
  RefreshCw,
  BarChart2,
  Zap,
  Activity,
  Grid,
  Move3d,
  Info,
  X,
  BookOpen,
  Fingerprint,
  Waves,
  Layers,
} from "lucide-react";
import { getExploratoryInsights } from "../services/geminiService";
import { fetchPCAAnalysis } from "../services/api";
import type { PCAResponse, StressDataPoint } from "../types";

interface AnalyticsProps {
  data: StressDataPoint[];
  isDark?: boolean;
}

// Custom lightweight Markdown Renderer for AI responses
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const parseBold = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="text-slate-900 dark:text-white font-bold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-2 text-sm">
      {content.split("\n").map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        if (trimmed.startsWith("#")) {
          const level = trimmed.match(/^#+/)?.[0].length || 0;
          const text = trimmed.replace(/^#+\s*/, "");
          const className =
            level === 3
              ? "text-base font-bold text-purple-600 dark:text-purple-400 mt-4 mb-2"
              : "text-lg font-bold text-slate-900 dark:text-white mt-6 mb-3 border-b border-slate-200 dark:border-white/10 pb-1";
          return (
            <div key={i} className={className}>
              {parseBold(text)}
            </div>
          );
        }

        if (/^\d+\./.test(trimmed)) {
          const number = trimmed.split(".")[0];
          const text = trimmed.replace(/^\d+\.\s*/, "");
          return (
            <div
              key={i}
              className="flex gap-3 mt-3 mb-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-white/5"
            >
              <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold text-base h-6 w-6 flex items-center justify-center bg-cyan-100 dark:bg-cyan-900/30 rounded">
                {number}
              </span>
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                {parseBold(text)}
              </div>
            </div>
          );
        }

        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2 pl-4 items-start">
              <span className="text-slate-400 mt-1.5 text-[8px]">•</span>
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {parseBold(trimmed.replace(/^[\\*\\-]\s*/, ""))}
              </div>
            </div>
          );
        }

        return (
          <p
            key={i}
            className="text-slate-600 dark:text-slate-300 leading-relaxed"
          >
            {parseBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

// --- NEW COMPONENT: Analytics Guide ---
const AnalyticsGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const items = [
    {
      icon: Activity,
      color: "text-cyan-500",
      title: "Temporal Signal Correlation",
      desc: "Menampilkan tren Heart Rate (HR) dan Skin Conductance (EDA) seiring waktu. Tujuannya untuk melihat pola kenaikan/penurunan fisiologis secara sinkron.",
    },
    {
      icon: Move3d,
      color: "text-orange-500",
      title: "Vector3 Movement Correlations",
      desc: "Korelasi antara Intensitas Gerakan (Magnitude XYZ) dengan respon tubuh. Menggunakan 'Balanced Sampling' (porsi kelas setara) agar semua label terlihat jelas.",
    },
    {
      icon: Fingerprint,
      color: "text-pink-500",
      title: "Class Profile Fingerprint (Radar)",
      desc: "Profil 'Bentuk' dari setiap kelas (0, 1, 2). Memvisualisasikan fitur mana yang paling dominan pada setiap level stress (misal: High Stress didominasi EDA & HR tinggi).",
    },
    {
      icon: Layers,
      color: "text-indigo-500",
      title: "Latent Space (PCA)",
      desc: "Reduksi dimensi untuk melihat 'Separability' (Keterpisahan) data. Jika titik warna hijau, kuning, merah terpisah jauh, artinya model ML akan mudah membedakannya.",
    },
    {
      icon: BarChart2,
      color: "text-blue-500",
      title: "HR vs EDA Distribution",
      desc: "Scatter plot untuk melihat sebaran data (Decision Boundary). Menggunakan 'Balanced Sampling' agar kelas minoritas tetap terlihat.",
    },
    {
      icon: Zap,
      color: "text-amber-500",
      title: "Dataset Class Balance",
      desc: "Menghitung jumlah sampel data per label. Penting untuk mengetahui apakah dataset 'Imbalanced' (timpang) yang bisa membuat model bias.",
    },
    {
      icon: Waves,
      color: "text-emerald-500",
      title: "Raw Signal Check (Slice)",
      desc: "Melihat bentuk gelombang asli (Raw Waveform) dari Accelerometer dan BVP pada 200 titik terakhir untuk Quality Control sinyal (Noise detection).",
    },
  ];

  return (
    <div className="glass-card p-6 mb-8 relative border-l-4 border-l-cyan-500 animate-in fade-in slide-in-from-top-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
      >
        <X size={20} />
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <BookOpen className="text-cyan-500" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            System Reference Guide
          </h3>
          <p className="text-xs text-slate-500 uppercase tracking-widest">
            Visualization Documentation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-cyan-500/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon size={16} className={item.color} />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {item.title}
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Analytics: React.FC<AnalyticsProps> = ({
  data,
  isDark = true,
}) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [pcaData, setPcaData] = useState<PCAResponse | null>(null);

  // Theme Constants
  const chartText = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipText = isDark ? "#f8fafc" : "#0f172a";

  // Load PCA Data on mount
  useEffect(() => {
    const loadPCA = async () => {
      const res = await fetchPCAAnalysis();
      setPcaData(res);
    };
    loadPCA();
  }, []);

  // --- PERFORMANCE & BALANCING OPTIMIZATION ---

  // 1. Temporal Data (Line Chart): Needs to be chronological, just downsampled
  const temporalData = useMemo(() => {
    const MAX_POINTS = 150;
    if (data.length <= MAX_POINTS) return data;
    const step = Math.ceil(data.length / MAX_POINTS);
    return data.filter((_, index) => index % step === 0);
  }, [data]);

  // 2. Balanced Analysis Data (Scatter Charts):
  // STRATIFIED SAMPLING: Ensure we get equal parts of Label 0, 1, and 2
  const balancedAnalysisData = useMemo(() => {
    // A. Preprocess with Vector3
    const processed = data.map((d) => ({
      ...d,
      accMagnitude: Math.sqrt(
        Math.pow(d.x, 2) + Math.pow(d.y, 2) + Math.pow(d.z, 2)
      ),
    }));

    // B. Split by Class
    const c0 = processed.filter((d) => d.label === 0);
    const c1 = processed.filter((d) => d.label === 1);
    const c2 = processed.filter((d) => d.label === 2);

    // C. Define Target per class (approx 66 items per class to get ~200 total)
    const TARGET_PER_CLASS = 70;

    // D. Helper to sample evenly from array
    const sampleEvenly = (arr: any[]) => {
      if (arr.length <= TARGET_PER_CLASS) return arr;
      const step = Math.floor(arr.length / TARGET_PER_CLASS);
      // We use step sampling to maintain some variety instead of just the first 70
      return arr.filter((_, i) => i % step === 0).slice(0, TARGET_PER_CLASS);
    };

    const s0 = sampleEvenly(c0);
    const s1 = sampleEvenly(c1);
    const s2 = sampleEvenly(c2);

    // E. Combine and Sort by ID to keep dot rendering consistent
    return [...s0, ...s1, ...s2].sort((a, b) => a.id - b.id);
  }, [data]);

  const rawSliceData = useMemo(() => {
    const ZOOM_POINTS = 200;
    return data.slice(-ZOOM_POINTS);
  }, [data]);

  console.log(data.filter((d) => d.label === 0).length);
  console.log(data.filter((d) => d.label === 1).length)
  console.log(data.filter((d) => d.label === 2).length)

  const labelDist = useMemo(
    () => [
      {
        name: "Base (0)",
        value: data.filter((d) => d.label === 0).length,
        fill: "#10b981",
      },
      {
        name: "Mid (1)",
        value: data.filter((d) => d.label === 1).length,
        fill: "#f59e0b",
      },
      {
        name: "High (2)",
        value: data.filter((d) => d.label === 2).length,
        fill: "#ef4444",
      },
    ],
    [data]
  );

  const radarData = useMemo(() => {
    const sums = {
      0: { hr: 0, eda: 0, bvp: 0, y: 0, count: 0 },
      1: { hr: 0, eda: 0, bvp: 0, y: 0, count: 0 },
      2: { hr: 0, eda: 0, bvp: 0, y: 0, count: 0 },
    };

    data.forEach((d) => {
      const label =
        d.label === 0 || d.label === 1 || d.label === 2 ? d.label : 0;
      if (sums[label] !== undefined) {
        sums[label].hr += d.hr || 0;
        sums[label].eda += d.eda || 0;
        sums[label].bvp += Math.abs(d.bvp || 0);
        sums[label].y += Math.abs(d.y || 0);
        sums[label].count += 1;
      }
    });

    const getAvg = (label: 0 | 1 | 2, key: "hr" | "eda" | "bvp" | "y") => {
      return sums[label].count > 0 ? sums[label][key] / sums[label].count : 0;
    };

    return [
      {
        subject: "HR",
        A: getAvg(0, "hr") / 1.5,
        B: getAvg(1, "hr") / 1.5,
        C: getAvg(2, "hr") / 1.5,
        fullMark: 100,
      },
      {
        subject: "EDA",
        A: getAvg(0, "eda") * 20,
        B: getAvg(1, "eda") * 20,
        C: getAvg(2, "eda") * 20,
        fullMark: 100,
      },
      {
        subject: "BVP",
        A: getAvg(0, "bvp"),
        B: getAvg(1, "bvp"),
        C: getAvg(2, "bvp"),
        fullMark: 100,
      },
      {
        subject: "MOV",
        A: getAvg(0, "y"),
        B: getAvg(1, "y"),
        C: getAvg(2, "y"),
        fullMark: 100,
      },
    ];
  }, [data]);

  // --- PERFORMANCE OPTIMIZATION END ---

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const avgHr = (
      data.reduce((a, b) => a + (b.hr || 0), 0) / (data.length || 1)
    ).toFixed(2);
    const avgEda = (
      data.reduce((a, b) => a + (b.eda || 0), 0) / (data.length || 1)
    ).toFixed(2);

    const summary = `
      Total Samples: ${data.length}
      Avg HR: ${avgHr}
      Avg EDA: ${avgEda}
      Class Balance (0/1/2): ${labelDist.map((d) => d.value).join("/")}
    `;
    const result = await getExploratoryInsights(summary);
    setInsight(result);
    setLoadingInsight(false);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: tooltipBg,
            borderColor: gridColor,
            color: tooltipText,
          }}
          className="border p-3 rounded-lg shadow-xl"
        >
          <p className="font-bold mb-1 opacity-80">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p
              key={idx}
              style={{ color: p.color }}
              className="text-xs font-mono"
            >
              {p.name}:{" "}
              {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CorrelationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: tooltipBg,
            borderColor: gridColor,
            color: tooltipText,
          }}
          className="border p-3 rounded-lg shadow-xl text-xs font-mono"
        >
          <p className="font-bold mb-2">Sample #{data.id}</p>
          <p style={{ color: CHART_COLORS.text }}>
            ACC Vector3: {data.accMagnitude.toFixed(2)} m/s²
          </p>
          <p style={{ color: payload[0].color }}>
            {payload[0].name}: {payload[0].value.toFixed(2)}
          </p>
          <p
            className="mt-1"
            style={{
              color:
                data.label === 0
                  ? LABEL_COLORS[0]
                  : data.label === 1
                  ? LABEL_COLORS[1]
                  : LABEL_COLORS[2],
            }}
          >
            Class: {data.label}
          </p>
        </div>
      );
    }
    return null;
  };

  const LABEL_COLORS: any = {
    0: "#10b981",
    1: "#f59e0b",
    2: "#ef4444",
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            Deep Analytics (EDA)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Multidimensional visualization of sensor fusion data.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-full transition-all"
          >
            <Info size={18} />
            <span className="hidden sm:inline">
              {showGuide ? "Hide Guide" : "Reference"}
            </span>
          </button>
          <button
            onClick={handleGenerateInsight}
            disabled={loadingInsight}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-full shadow-lg shadow-purple-900/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loadingInsight ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Sparkles size={18} />
            )}
            {loadingInsight ? "Processing..." : "Ask AI Scientist"}
          </button>
        </div>
      </div>

      {/* REFERENCE GUIDE (TOGGLEABLE) */}
      {showGuide && <AnalyticsGuide onClose={() => setShowGuide(false)} />}

      {/* AI Insight Box */}
      {insight && (
        <div className="glass-card border-l-4 border-l-purple-500 p-6 rounded-r-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-4 border-b border-purple-500/20 pb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles
                className="text-purple-600 dark:text-purple-400"
                size={20}
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                Gemini Insights
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                Automated EDA Report
              </p>
            </div>
          </div>
          <MarkdownRenderer content={insight} />
        </div>
      )}

      {/* Grid Layout for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1. Time Series Overview */}
        <div className="glass-card p-5 rounded-2xl col-span-1 lg:col-span-2 xl:col-span-3">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-cyan-600 dark:text-cyan-400" />
            Temporal Signal Correlation (Trend View)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temporalData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={gridColor}
                />
                <XAxis
                  dataKey="id"
                  stroke={chartText}
                  fontSize={10}
                  tick={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke={CHART_COLORS.hr}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={CHART_COLORS.eda}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="hr"
                  name="Heart Rate"
                  stroke={CHART_COLORS.hr}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="eda"
                  name="EDA (Skin)"
                  stroke={CHART_COLORS.eda}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- NEW SECTION: PCA Latent Space --- */}
        <div className="col-span-1 lg:col-span-2 xl:col-span-3 mt-4 mb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Layers
                size={20}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Latent Space Analysis (PCA)
              </h3>
              <p className="text-xs text-slate-500">
                Dimensionality Reduction (6D → 3D). Total Variance Explained:{" "}
                <span className="text-indigo-500 font-bold">
                  {(pcaData?.variance?.total
                    ? pcaData.variance.total * 100
                    : 0
                  ).toFixed(1)}
                  %
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* PCA 1: PC1 vs PC2 (Top View) */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex justify-between">
            <span>2D Projection (PC1 vs PC2)</span>
            <span className="text-indigo-500">Top View</span>
          </h3>
          <div className="h-60 w-full">
            {pcaData ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    type="number"
                    dataKey="pc1"
                    name="PC1"
                    stroke={chartText}
                    fontSize={10}
                  />
                  <YAxis
                    type="number"
                    dataKey="pc2"
                    name="PC2"
                    stroke={chartText}
                    fontSize={10}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={<CustomTooltip />}
                  />
                  <Scatter name="Clusters" data={pcaData.data} fill="#8884d8">
                    {pcaData.data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={LABEL_COLORS[entry.label] || "#8884d8"}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs animate-pulse">
                Loading PCA...
              </div>
            )}
          </div>
        </div>

        {/* PCA 2: PC2 vs PC3 (Side View) */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex justify-between">
            <span>Depth Projection (PC2 vs PC3)</span>
            <span className="text-indigo-500">Side View</span>
          </h3>
          <div className="h-60 w-full">
            {pcaData ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    type="number"
                    dataKey="pc2"
                    name="PC2"
                    stroke={chartText}
                    fontSize={10}
                  />
                  <YAxis
                    type="number"
                    dataKey="pc3"
                    name="PC3"
                    stroke={chartText}
                    fontSize={10}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={<CustomTooltip />}
                  />
                  <Scatter name="Clusters" data={pcaData.data} fill="#8884d8">
                    {pcaData.data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={LABEL_COLORS[entry.label] || "#8884d8"}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs animate-pulse">
                Loading PCA...
              </div>
            )}
          </div>
        </div>

        {/* PCA Stats / Explained Variance */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            Variance Explained
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-400">
                <span>PC1 (Primary Axis)</span>
                <span>
                  {(pcaData?.variance.pc1
                    ? pcaData.variance.pc1 * 100
                    : 0
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500"
                  style={{ width: `${(pcaData?.variance.pc1 || 0) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-400">
                <span>PC2 (Secondary Axis)</span>
                <span>
                  {(pcaData?.variance.pc2
                    ? pcaData.variance.pc2 * 100
                    : 0
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400"
                  style={{ width: `${(pcaData?.variance.pc2 || 0) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-400">
                <span>PC3 (Depth Axis)</span>
                <span>
                  {(pcaData?.variance.pc3
                    ? pcaData.variance.pc3 * 100
                    : 0
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-300"
                  style={{ width: `${(pcaData?.variance.pc3 || 0) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION: Vector3 Correlations --- */}
        <div className="col-span-1 lg:col-span-2 xl:col-span-3 mt-4 mb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Move3d
                size={20}
                className="text-orange-600 dark:text-orange-400"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Vector3 Movement Correlations
              </h3>
              <p className="text-xs text-slate-500">
                Analysis of Acceleration Magnitude (sqrt(x²+y²+z²)) vs
                Physiological responses.{" "}
                <span className="text-cyan-500 font-bold">
                  Balanced Sampling (Equal Class Size) applied.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Correlation 1: Motion vs HR */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex justify-between">
            <span>Motion (X) vs Heart Rate (Y)</span>
            <span className="text-red-500">HR Impact</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  type="number"
                  dataKey="accMagnitude"
                  name="ACC Vector"
                  unit="m/s²"
                  stroke={chartText}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <YAxis
                  type="number"
                  dataKey="hr"
                  name="HR"
                  unit="bpm"
                  stroke={chartText}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={<CorrelationTooltip />}
                />
                <Scatter
                  name="HR vs Motion"
                  data={balancedAnalysisData}
                  fill="#ef4444"
                  shape="circle"
                >
                  {balancedAnalysisData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={LABEL_COLORS[entry.label] || "#ef4444"}
                      fillOpacity={0.6}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Correlation 2: Motion vs EDA */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex justify-between">
            <span>Motion (X) vs Skin Cond (Y)</span>
            <span className="text-purple-500">EDA Artifacts</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  type="number"
                  dataKey="accMagnitude"
                  name="ACC Vector"
                  unit="m/s²"
                  stroke={chartText}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <YAxis
                  type="number"
                  dataKey="eda"
                  name="EDA"
                  unit="µS"
                  stroke={chartText}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={<CorrelationTooltip />}
                />
                <Scatter
                  name="EDA vs Motion"
                  data={balancedAnalysisData}
                  fill="#8b5cf6"
                  shape="circle"
                >
                  {balancedAnalysisData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={LABEL_COLORS[entry.label] || "#8b5cf6"}
                      fillOpacity={0.6}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Correlation 3: Motion vs BVP */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex justify-between">
            <span>Motion (X) vs BVP (Y)</span>
            <span className="text-cyan-500">Signal Noise</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  type="number"
                  dataKey="accMagnitude"
                  name="ACC Vector"
                  unit="m/s²"
                  stroke={chartText}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <YAxis
                  type="number"
                  dataKey="bvp"
                  name="BVP"
                  unit="mV"
                  stroke={chartText}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={<CorrelationTooltip />}
                />
                <Scatter
                  name="BVP vs Motion"
                  data={balancedAnalysisData}
                  fill="#06b6d4"
                  shape="circle"
                >
                  {balancedAnalysisData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={LABEL_COLORS[entry.label] || "#06b6d4"}
                      fillOpacity={0.6}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Radar Chart - Feature Profile */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Grid size={16} className="text-pink-600 dark:text-pink-400" />
            Class Profile Fingerprint
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius="70%" data={radarData}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: chartText, fontSize: 10 }}
                />
                <PolarRadiusAxis angle={30} tick={false} axisLine={false} />
                <Radar
                  name="Baseline (0)"
                  dataKey="A"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                />
                <Radar
                  name="Mid Stress (1)"
                  dataKey="B"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.1}
                />
                <Radar
                  name="High Stress (2)"
                  dataKey="C"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                />
                <Legend iconType="star" wrapperStyle={{ fontSize: "10px" }} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Scatter Correlation (HR vs EDA) */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-600 dark:text-blue-400" />
            HR vs EDA Distribution (Balanced)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  type="number"
                  dataKey="hr"
                  name="HR"
                  unit="bpm"
                  stroke={chartText}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <YAxis
                  type="number"
                  dataKey="eda"
                  name="EDA"
                  unit="µS"
                  stroke={chartText}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={<CustomTooltip />}
                />
                <Scatter
                  name="Samples"
                  data={balancedAnalysisData}
                  fill="#8884d8"
                >
                  {balancedAnalysisData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.label === 0
                          ? "#10b981"
                          : entry.label === 1
                          ? "#f59e0b"
                          : "#ef4444"
                      }
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Class Imbalance */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Zap size={16} className="text-amber-500 dark:text-amber-400" />
            Dataset Class Balance
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labelDist} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  stroke={gridColor}
                />
                <XAxis type="number" stroke={chartText} fontSize={10} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke={chartText}
                  fontSize={10}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                  {labelDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Accelerometer Distribution (RAW SLICE) */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Activity
              size={16}
              className="text-emerald-600 dark:text-emerald-400"
            />
            Movement Variance (Raw Slice)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rawSliceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={gridColor}
                />
                <XAxis dataKey="id" hide />
                <YAxis
                  stroke={chartText}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="plainline"
                  wrapperStyle={{ fontSize: "10px" }}
                />
                <Line
                  type="monotone"
                  dataKey="x"
                  stroke={CHART_COLORS.x}
                  dot={false}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke={CHART_COLORS.y}
                  dot={false}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="z"
                  stroke={CHART_COLORS.z}
                  dot={false}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. BVP Volatility (RAW SLICE) */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-cyan-600 dark:text-cyan-400" />
            BVP Signal (Raw Slice)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rawSliceData}>
                <defs>
                  <linearGradient id="colorBvp" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.bvp}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.bvp}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={gridColor}
                />
                <XAxis hide />
                <YAxis
                  stroke={chartText}
                  fontSize={10}
                  domain={["auto", "auto"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="bvp"
                  stroke={CHART_COLORS.bvp}
                  fill="url(#colorBvp)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
