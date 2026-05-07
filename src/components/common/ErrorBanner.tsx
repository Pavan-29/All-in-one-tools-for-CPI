import { AlertTriangle } from 'lucide-react';

export default function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="font-mono whitespace-pre-wrap break-words">
        {message}
      </span>
    </div>
  );
}
