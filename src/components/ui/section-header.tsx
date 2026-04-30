import * as React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon, action, className }) => (
  <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4', className)}>
    <div className="flex items-start gap-3">
      {icon && <div className="mt-1 text-primary">{icon}</div>}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
