import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

export default function CopyButton({
  value,
  label = 'Copy',
  size = 'sm',
}: {
  value: string;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const onClick = async () => {
    if (!value) {
      toast('Nothing to copy', 'info');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast('Copied to clipboard', 'success');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast('Failed to copy', 'error');
    }
  };
  return (
    <button
      onClick={onClick}
      className={`icon-btn ${size === 'md' ? 'h-9 w-9' : ''}`}
      title={label}
      aria-label={label}
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}
