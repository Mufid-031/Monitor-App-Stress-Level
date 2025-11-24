import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { DatasetView } from "./pages/DatasetView";
import { Analytics } from "./pages/Analytics";
import { Prediction } from "./pages/Prediction";
import { MOCK_DATASET } from "./constants";
import { fetchRealDataset } from "./services/api";
import { Menu, Sun, Moon } from "lucide-react";
import "./App.css";
import { NavigationPage, type StressDataPoint } from "./types";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>(
    NavigationPage.DASHBOARD
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // State for data source
  const [appData, setAppData] = useState<StressDataPoint[]>(MOCK_DATASET);
  const [isUsingRealData, setIsUsingRealData] = useState(false);

  // Toggle Dark Mode Class on HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Attempt to fetch real data on mount
  useEffect(() => {
    const loadData = async () => {
      const realData = await fetchRealDataset();
      if (realData && realData.length > 0) {
        console.log("Loaded real dataset from backend");
        setAppData(realData);
        setIsUsingRealData(true);
      } else {
        console.log("Using Mock Dataset (Backend offline or no history)");
      }
    };
    loadData();
  }, []);

  const toggleTheme = () => setDarkMode(!darkMode);

  const renderPage = () => {
    switch (currentPage) {
      case NavigationPage.DASHBOARD:
        return <Dashboard data={appData} isDark={darkMode} />;
      case NavigationPage.DATASET:
        return <DatasetView data={appData} />;
      case NavigationPage.ANALYTICS:
        return <Analytics data={appData} isDark={darkMode} />;
      case NavigationPage.PREDICTION:
        return <Prediction isDark={darkMode} />;
      default:
        return <Dashboard data={appData} isDark={darkMode} />;
    }
  };

  return (
    <div className="flex min-h-screen transition-colors duration-300">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-40 flex items-center justify-between px-4 border-b border-slate-200 dark:border-white/5">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <span className="font-bold text-slate-900 dark:text-white">
          Stress<span className="text-cyan-500">AI</span>
        </span>
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Sidebar (Responsive) */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setIsSidebarOpen(false); // Close mobile sidebar on nav
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main
        className={`flex-1 p-4 lg:p-8 overflow-y-auto h-screen transition-all duration-300 ${
          isSidebarOpen ? "blur-sm lg:blur-0" : ""
        } lg:ml-64 pt-20 lg:pt-8`}
      >
        {/* Desktop Theme Toggle & Data Status */}
        <div className="hidden lg:flex justify-end gap-3 mb-4">
          {isUsingRealData && (
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500">
              REAL DATA LOADED
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? "LIGHT MODE" : "DARK MODE"}
          </button>
        </div>

        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
          {renderPage()}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
