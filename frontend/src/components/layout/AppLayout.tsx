import { ReactNode, useEffect, useState } from "react";
import { History, Home, Moon, Sun } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "../ui/Button";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-50">
      <header className="border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                MeetWise AI
              </p>
              <h1 className="text-xl font-semibold">Meeting Summarizer</h1>
            </div>
            <nav className="flex gap-2 text-sm">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `inline-flex h-9 items-center gap-2 rounded-md px-3 ${
                    isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`
                }
              >
                <Home size={16} />
                Dashboard
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `inline-flex h-9 items-center gap-2 rounded-md px-3 ${
                    isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`
                }
              >
                <History size={16} />
                History
              </NavLink>
            </nav>
          </div>
          <Button
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
            variant="secondary"
            onClick={() => setDarkMode((current) => !current)}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </header>
      <main className="fade-up mx-auto max-w-7xl px-5 py-6">{children}</main>
      <footer className="mx-auto flex max-w-7xl items-center justify-between px-5 pb-6 text-xs text-slate-500 dark:text-slate-400">
        <span>Groq transcription and structured summaries</span>
        <span>SQLite local history</span>
      </footer>
    </div>
  );
}
