import { useState } from 'react';
import { Search, Boxes, ChevronRight } from 'lucide-react';
import type { ToolGroup } from '../../tools';

interface Props {
  groups: ToolGroup[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function Sidebar({ groups, activeId, onSelect }: Props) {
  const [filter, setFilter] = useState('');

  const filteredGroups = filter
    ? groups
        .map((g) => ({
          ...g,
          tools: g.tools.filter((t) =>
            (t.name + ' ' + t.description)
              .toLowerCase()
              .includes(filter.toLowerCase())
          ),
        }))
        .filter((g) => g.tools.length > 0)
    : groups;

  return (
    <aside className="hidden md:flex w-72 shrink-0 flex-col border-r bg-white border-slate-200 dark:bg-navy-900/40 dark:border-navy-700/60">
      <div className="p-4 border-b border-slate-200 dark:border-navy-700/60">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent to-accent-dark grid place-items-center shadow-md shadow-accent/30">
            <Boxes className="w-5 h-5 text-white dark:text-navy-950" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-slate-900 dark:text-white">
              CPI Toolkit
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              All-in-one · Offline · Private
            </div>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search tools..."
            className="input pl-8 py-1.5 text-sm"
            spellCheck={false}
          />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {filteredGroups.map((g) => (
          <div key={g.id}>
            <div className="px-2 mb-1.5 text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              {g.label}
            </div>
            <div className="space-y-0.5">
              {g.tools.map((t) => {
                const Icon = t.icon;
                const isActive = t.id === activeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className={`nav-item w-full text-left ${
                      isActive ? 'nav-item-active' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{t.name}</span>
                    {t.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                        {t.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <div className="px-2 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No tools match "{filter}".
          </div>
        )}
      </nav>
      <div className="p-3 border-t border-slate-200 dark:border-navy-700/60 text-[11px] text-slate-500 dark:text-slate-400">
        <div>100% client-side · no data leaves your machine</div>
      </div>
    </aside>
  );
}
