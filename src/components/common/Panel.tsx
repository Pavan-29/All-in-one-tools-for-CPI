import { ReactNode } from 'react';

interface Props {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: Props) {
  return (
    <div className={`panel flex flex-col ${className ?? ''}`}>
      {(title || actions) && (
        <div className="panel-header">
          <div className="flex items-center gap-2 truncate">{title}</div>
          {actions && (
            <div className="flex items-center gap-1 shrink-0">{actions}</div>
          )}
        </div>
      )}
      <div className={`p-3 flex-1 min-h-0 ${bodyClassName ?? ''}`}>
        {children}
      </div>
    </div>
  );
}
