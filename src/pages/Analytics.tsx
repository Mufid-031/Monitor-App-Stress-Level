/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */
import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { getExploratoryInsights } from "../services/geminiService";
import type { StressDataPoint } from "../types";

interface AnalyticsProps {
  data: StressDataPoint[];
  isDark?: boolean;
}

// Custom lightweight Markdown Renderer for AI responses
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  // Helper to parse **bold** text inside a string
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
        if (!trimmed) return <div key={i} className="h-2" />; // Spacer for empty lines

        // Headers (### or ##)
        if (trimmed.startsWith("#")) {
          const level = trimmed.match(/^#+/)?.[0].length || 0;
          const text = trimmed.replace(/^#+\s*/, "");
          const className =
            level === 3
              ? "text-base font-bold text-purple-600 dark:text-purple-400 mt-4 mb-2" // h3
              : "text-lg font-bold text-slate-900 dark:text-white mt-6 mb-3 border-b border-slate-200 dark:border-white/10 pb-1"; // h1/h2
          return (
            <div key={i} className={className}>
              {parseBold(text)}
            </div>
          );
        }

        // Numbered List (1. Point)
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

        // Bullet List (* or -)
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2 pl-4 items-start">
              <span className="text-slate-400 mt-1.5 text-[8px]">•</span>
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {parseBold(trimmed.replace(/^[\*\-]\s*/, ""))}
              </div>
            </div>
          );
        }

        // Regular Paragraph
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

export const Analytics: React.FC<AnalyticsProps> = ({
  data,
  isDark = true,
}) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Theme Constants
  const chartText = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipText = isDark ? "#f8fafc" : "#0f172a";

  // --- PERFORMANCE OPTIMIZATION START ---

  // 1. Heavy Sampling for Trend Charts (Scatter & Global Line)
  // Reduced from 400 to 150 to make the charts cleaner and less cluttered.
  const sampledData = useMemo(() => {
    const MAX_POINTS = 150;
    if (data.length <= MAX_POINTS) return data;

    const step = Math.ceil(data.length / MAX_POINTS);
    return data.filter((_, index) => index % step === 0);
  }, [data]);

  // 2. Raw Slice for Waveforms (BVP & Accelerometer)
  // Downsampling ruins waveforms. Instead, we show the last ~200 raw points (Zoomed view).
  const rawSliceData = useMemo(() => {
    const ZOOM_POINTS = 200;
    return data.slice(-ZOOM_POINTS);
  }, [data]);

  // 3. Memoize Class Distribution Calculation
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

  // 4. Memoize Radar Data Calculation
  const radarData = useMemo(() => {
    const sums = {
      0: { hr: 0, eda: 0, bvp: 0, y: 0, count: 0 },
      1: { hr: 0, eda: 0, bvp: 0, y: 0, count: 0 },
      2: { hr: 0, eda: 0, bvp: 0, y: 0, count: 0 },
    };

    data.forEach((d) => {
      // Use fallback if label is missing or not 0/1/2
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

    // Radar charts need data to display something even if a class is empty
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
        {/* 1. Time Series Overview (Downsampled for Trend) */}
        <div className="glass-card p-5 rounded-2xl col-span-1 lg:col-span-2 xl:col-span-3">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-cyan-600 dark:text-cyan-400" />
            Temporal Signal Correlation (Trend View)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sampledData}>
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

        {/* 3. Scatter Correlation (Downsampled) */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-600 dark:text-blue-400" />
            HR vs EDA Distribution (Sampled)
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
                <Scatter name="Samples" data={sampledData} fill="#8884d8">
                  {sampledData.map((entry, index) => (
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
