import { Link } from 'wouter';
import { Analysis } from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';
import { FileText, Cpu, Clock, Trash2, ArrowRight } from 'lucide-react';
import { useDeleteAnalysis } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListAnalysesQueryKey } from '@workspace/api-client-react';

export function AnalysisCard({ analysis }: { analysis: Analysis }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteAnalysis({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
      }
    }
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteMutation.mutate({ id: analysis.id });
  };

  const isProcessing = analysis.status === 'processing';
  const isError = analysis.status === 'error';

  return (
    <Link href={`/analyses/${analysis.id}`}>
      <div className="group block h-full border border-border bg-card hover:border-primary/50 transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col">
        {/* Subtle background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-mono font-bold text-lg leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {analysis.title || 'Untitled Synthesis'}
            </h3>
            <Badge 
              variant={isProcessing ? 'processing' : isError ? 'destructive' : 'outline'}
              className={!isProcessing && !isError ? 'border-primary/30 text-primary' : ''}
            >
              {analysis.status}
            </Badge>
          </div>

          <div className="space-y-3 mt-auto pt-4">
            <div className="flex items-center text-xs font-mono text-muted-foreground">
              <FileText className="w-3.5 h-3.5 mr-2 opacity-70" />
              <span>{analysis.fileNames.length} Assets Analyzed</span>
            </div>
            <div className="flex items-center text-xs font-mono text-muted-foreground">
              <Clock className="w-3.5 h-3.5 mr-2 opacity-70" />
              <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
            </div>
            {analysis.nodes && analysis.nodes.length > 0 && (
              <div className="flex items-center text-xs font-mono text-secondary">
                <Cpu className="w-3.5 h-3.5 mr-2 opacity-70" />
                <span>{analysis.nodes.length} Data Nodes</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border p-3 flex justify-between items-center bg-black/20">
          <button 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <div className="flex items-center font-mono text-xs uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
            Access <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>
      </div>
    </Link>
  );
}