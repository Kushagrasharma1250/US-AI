import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Database, Lightbulb, TrendingUp, Search, Layers } from 'lucide-react';

export function CustomNode({ data }: { data: any }) {
  const typeStyles: Record<string, string> = {
    root: 'border-primary bg-primary/10 text-primary-foreground glow-amber',
    topic: 'border-secondary bg-secondary/10 text-secondary-foreground glow-violet',
    metric: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
    insight: 'border-amber-500 bg-amber-500/10 text-amber-500',
    detail: 'border-border bg-card text-muted-foreground',
  };

  const typeIcons: Record<string, any> = {
    root: Database,
    topic: Layers,
    metric: TrendingUp,
    insight: Lightbulb,
    detail: Search,
  };

  const Icon = typeIcons[data.type] || Database;
  
  return (
    <div className={cn('min-w-[200px] max-w-[300px] border px-4 py-3 shadow-lg font-mono relative backdrop-blur-sm', typeStyles[data.type] || typeStyles.detail)}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div className="flex items-center space-x-2 mb-2">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">{data.type}</span>
      </div>
      
      <div className="font-bold text-sm text-foreground mb-1 leading-tight">{data.label}</div>
      
      {data.value && (
        <div className="text-xs opacity-90 mt-2 bg-black/30 p-2 border border-white/10">
          {data.value}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}