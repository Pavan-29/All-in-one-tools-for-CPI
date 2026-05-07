import { Github, Sun, Moon, Heart } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ToolDef } from '../../tools';

interface Props {
  tool: ToolDef;
}

export default function Header({ tool }: Props) {
  const { theme, toggleTheme } = useTheme();
  const Icon = tool.icon;
  return (
    <header className="border-b border-slate-200 dark:border-navy-700/60 bg-white/70 dark:bg-navy-900/40 backdrop-blur-md sticky top-0 z-20">
      <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
        <Icon className="w-5 h-5 text-accent shrink-0" />
        <div className="min-w-0">
          <h1 className="font-bold text-slate-900 dark:text-white truncate">
            {tool.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {tool.description}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="icon-btn"
            title="View source"
          >
            <Github className="w-4 h-4" />
          </a>
          <button
            onClick={toggleTheme}
            className="icon-btn"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <span
            className="hidden sm:inline-flex ml-2 items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"
            title="Made for SAP CPI developers"
          >
            <Heart className="w-3 h-3 text-rose-400" /> for CPI devs
          </span>
        </div>
      </div>
    </header>
  );
}
