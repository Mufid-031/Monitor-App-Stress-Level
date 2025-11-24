import React, { useState, useMemo } from "react";
import {
  Filter,
  Download,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { StressDataPoint } from "../types";

interface DatasetViewProps {
  data: StressDataPoint[];
}

export const DatasetView: React.FC<DatasetViewProps> = ({ data }) => {
  const [filterLabel, setFilterLabel] = useState<number | "all">("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const filteredData = useMemo(() => {
    if (filterLabel === "all") return data;
    return data.filter((d) => d.LABEL === filterLabel);
  }, [data, filterLabel]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const downloadCSV = () => {
    const headers = [
      "id",
      "x",
      "y",
      "z",
      "bvp",
      "eda",
      "hr",
      "label",
      "timestamp",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((row) =>
        [
          row.x,
          row.y,
          row.z,
          row.bvp,
          row.eda,
          row.hr,
          row.LABEL,
          row.timestamp,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "stress_dataset_v3.csv";
    link.click();
  };

  const getLabelBadge = (label: number) => {
    switch (label) {
      case 0:
        return (
          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
            BASELINE (0)
          </span>
        );
      case 1:
        return (
          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
            MED STRESS (1)
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
            HIGH STRESS (2)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Database className="text-purple-600 dark:text-purple-400" />
            Data Terminal
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Raw sensor logs and label classification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterLabel}
              onChange={(e) => {
                setFilterLabel(
                  e.target.value === "all" ? "all" : parseInt(e.target.value)
                );
                setPage(1);
              }}
              className="bg-transparent border-none outline-none text-xs font-mono text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-0"
            >
              <option value="all" className="bg-white dark:bg-slate-900">
                ALL CLASSES
              </option>
              <option value="0" className="bg-white dark:bg-slate-900">
                CLASS 0 (BASE)
              </option>
              <option value="1" className="bg-white dark:bg-slate-900">
                CLASS 1 (MED)
              </option>
              <option value="2" className="bg-white dark:bg-slate-900">
                CLASS 2 (HIGH)
              </option>
            </select>
          </div>

          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all shadow-lg shadow-blue-900/20"
          >
            <Download size={14} />
            EXPORT CSV
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">ACC (X,Y,Z)</th>
                <th className="px-6 py-4">BVP</th>
                <th className="px-6 py-4 text-purple-600 dark:text-purple-400">
                  EDA
                </th>
                <th className="px-6 py-4 text-red-600 dark:text-red-400">
                  HR (BPM)
                </th>
                <th className="px-6 py-4">Label</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {currentData.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    #{idx + 1}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-slate-400 dark:text-slate-500">
                      [
                    </span>
                    {row.x.toFixed(1)}, {row.y.toFixed(1)}, {row.z.toFixed(1)}
                    <span className="text-slate-400 dark:text-slate-500">
                      ]
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-cyan-600 dark:text-cyan-400">
                    {row.bvp.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-purple-600 dark:text-purple-400 font-bold">
                    {row.eda.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-red-600 dark:text-red-400 font-bold">
                    {row.hr.toFixed(1)}
                  </td>
                  <td className="px-6 py-4">{getLabelBadge(row.LABEL)}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                    {row.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-mono">
            DISPLAYING {(page - 1) * itemsPerPage + 1}-
            {Math.min(page * itemsPerPage, filteredData.length)} OF{" "}
            {filteredData.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 text-slate-400 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 text-slate-400 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
