import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { ALL_TOOLS, findTool, TOOL_GROUPS } from './tools';

const STORAGE_KEY = 'cpi-toolkit:active-tool';

export default function App() {
  const [activeId, setActiveId] = useState<string>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && ALL_TOOLS.some((t) => t.id === stored)) return stored;
    // Default to text-diff to match the first screenshot
    return 'text-diff';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, activeId);
  }, [activeId]);

  const activeTool = useMemo(() => findTool(activeId)!, [activeId]);
  const ActiveComponent = activeTool.component;

  return (
    <div className="min-h-screen flex">
      <Sidebar
        groups={TOOL_GROUPS}
        activeId={activeId}
        onSelect={setActiveId}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header tool={activeTool} />
        <main className="flex-1 overflow-auto p-4 lg:p-6 animate-fade-in">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
