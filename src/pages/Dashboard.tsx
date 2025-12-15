import React, { useMemo } from "react";
import { Users, Activity, Heart, Droplets, Zap } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "../constants";
import type { StressDataResponse } from "../types";

interface DashboardProps {
  data: StressDataResponse;
  isDark?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  isDark = true,
}) => {
  console.log("Dashboard rendering with data:", data);

  const stats = useMemo(() => {
    const total = data.pagination.total;
    const baseline = data.details.labels["0"];
    const transient = data.details.labels["1"];
    const highStress = data.details.labels["2"];

    const avgHr = data.details.avg_hr;
    const avgEda = data.details.avg_eda;
    return { total, baseline, transient, highStress, avgHr, avgEda };
  }, [data]);

  const recentData = data.data.slice(-40);
  const chartText = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end mb-2 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            Live Monitor
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Real-time physiological telemetry stream.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-900/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          LIVE FEED ACTIVE
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Samples */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-blue-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
              <Users size={20} />
            </div>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">
              Samples
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total Datapoints
          </p>
        </div>

        {/* Avg HR */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-red-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-red-500/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-600 dark:text-red-400">
              <Heart size={20} />
            </div>
            <span className="text-xs font-mono text-red-600 dark:text-red-300 bg-red-500/10 px-2 py-0.5 rounded">
              BPM
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats.avgHr.toFixed(0)}{" "}
            <span className="text-lg text-slate-400 dark:text-slate-500 font-normal">
              avg
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Heart Rate
          </p>
        </div>

        {/* Avg EDA */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-purple-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-purple-500/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
              <Droplets size={20} />
            </div>
            <span className="text-xs font-mono text-purple-600 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
              µS
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats.avgEda.toFixed(2)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Electrodermal Activity
          </p>
        </div>

        {/* Stress Distribution Mini-Bar */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-center">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              High Risk Events
            </span>
            <Zap size={16} className="text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex items-end gap-1 h-16 mb-2">
            <div
              className="flex-1 bg-emerald-500/20 rounded-t-sm relative group"
              style={{ height: `${(stats.baseline / stats.total) * 100}%` }}
            >
              <div className="absolute inset-0 hover:bg-emerald-500/40 transition-colors"></div>
            </div>
            <div
              className="flex-1 bg-amber-500/20 rounded-t-sm relative group"
              style={{ height: `${(stats.transient / stats.total) * 100}%` }}
            >
              <div className="absolute inset-0 hover:bg-amber-500/40 transition-colors"></div>
            </div>
            <div
              className="flex-1 bg-red-500/20 rounded-t-sm relative group"
              style={{ height: `${(stats.highStress / stats.total) * 100}%` }}
            >
              <div className="absolute inset-0 hover:bg-red-500/40 transition-colors"></div>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>OK</span>
            <span>WARN</span>
            <span>CRIT</span>
          </div>
        </div>

        {/* Main Chart */}
        <div className="glass-card p-6 rounded-2xl col-span-1 md:col-span-2 lg:col-span-4 h-96">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity
                size={18}
                className="text-cyan-600 dark:text-cyan-400"
              />
              Physiological Telemetry
            </h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>HR
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>EDA
              </div>
            </div>
          </div>
          <div className="h-full w-full pb-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentData}>
                <defs>
                  <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.hr}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.hr}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorEda" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.eda}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.eda}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={gridColor}
                />
                <XAxis
                  dataKey="timestamp"
                  stroke={chartText}
                  fontSize={10}
                  tickMargin={10}
                />
                <YAxis stroke={chartText} fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#fff",
                    borderColor: isDark ? "#1e293b" : "#e2e8f0",
                    color: isDark ? "#fff" : "#0f172a",
                  }}
                  itemStyle={{ color: isDark ? "#fff" : "#0f172a" }}
                />
                <Area
                  type="monotone"
                  dataKey="hr"
                  stroke={CHART_COLORS.hr}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHr)"
                />
                <Area
                  type="monotone"
                  dataKey="eda"
                  stroke={CHART_COLORS.eda}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEda)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
