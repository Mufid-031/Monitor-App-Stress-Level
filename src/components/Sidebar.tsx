import React from "react";
import {
  LayoutDashboard,
  Database,
  BarChart2,
  BrainCircuit,
  Activity,
  Cpu,
  X,
} from "lucide-react";
import { NavigationPage } from "../types";

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const navItems = [
    { id: NavigationPage.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
    { id: NavigationPage.DATASET, label: "Dataset", icon: Database },
    { id: NavigationPage.ANALYTICS, label: "Analytics (EDA)", icon: BarChart2 },
    {
      id: NavigationPage.PREDICTION,
      label: "AI Prediction",
      icon: BrainCircuit,
    },
  ];

  return (
    <>
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out p-4
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 lg:block
      `}
      >
        <div className="glass-card h-full rounded-2xl flex flex-col overflow-hidden shadow-2xl dark:shadow-none">
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-40"></div>
                <div className="relative p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                  <Activity
                    size={24}
                    className="text-cyan-600 dark:text-cyan-400"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-wide">
                  Stress
                  <span className="text-cyan-500 dark:text-cyan-400">AI</span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Monitor v3.0
                </p>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? "text-slate-800 dark:text-white bg-white/50 dark:bg-white/5 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-y-0 left-0 w-1 bg-cyan-500 rounded-r-full"></div>
                  )}
                  <Icon
                    size={20}
                    className={`relative z-10 transition-transform group-hover:scale-110 ${
                      isActive ? "text-cyan-600 dark:text-cyan-400" : ""
                    }`}
                  />
                  <span className="relative z-10 font-medium text-sm">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Footer Status */}
          <div className="p-4 border-t border-slate-200 dark:border-white/5">
            <div className="bg-slate-100 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Cpu
                  size={14}
                  className="text-purple-600 dark:text-purple-400"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  SYSTEM STATUS
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Sensors Online
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Gemini 2.5 Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
