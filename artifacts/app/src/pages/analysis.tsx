import { useRoute, Link, useLocation } from 'wouter';
import { useGetAnalysis, useDeleteAnalysis, getListAnalysesQueryKey, getGetAnalysisQueryKey } from '@workspace/api-client-react';
import { Analysis } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, FileText, AlertTriangle, Loader2, Key, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MindMap } from '@/components/mind-map';

export function AnalysisView() {
  const [, params] = useRoute('/analyses/:id');
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Polling for processing status
  const { data: analysis, isLoading, isError } = useGetAnalysis(id, {
    query: {
      queryKey: getGetAnalysisQueryKey(id),
      refetchInterval: (query) => {
        const data = query.state.data as Analysis | undefined;
        return data?.status === 'processing' ? 2000 : false;
      }
    }
  });

  const deleteMutation = useDeleteAnalysis({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
        setLocation('/');
      }
    }
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <span className="font-mono text-primary animate-pulse uppercase tracking-widest">Establishing neural link...</span>
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center space-y-4 bg-background">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="font-mono text-xl text-destructive uppercase tracking-widest">Connection Failed</h2>
        <Button variant="outline" onClick={() => setLocation('/')}>Return to Hub</Button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex-none h-16 border-b border-border bg-black/60 backdrop-blur-md flex items-center justify-between px-4 z-50">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <h1 className="font-mono font-bold text-lg leading-none text-white line-clamp-1 max-w-md lg:max-w-xl">
              {analysis.title || 'Untitled Synthesis'}
            </h1>
            <div className="text-xs font-mono text-muted-foreground flex items-center mt-1">
              <FileText className="w-3 h-3 mr-1" />
              <span className="line-clamp-1 max-w-[200px] sm:max-w-md">
                {analysis.fileNames.join(', ')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-4">
          {analysis.status === 'processing' && (
            <Badge variant="processing">Processing</Badge>
          )}
          {analysis.status === 'error' && (
            <Badge variant="destructive">Failed</Badge>
          )}
          {analysis.status === 'complete' && (
            <Badge variant="success">Synthesized</Badge>
          )}
          <span className="text-xs font-mono text-muted-foreground hidden md:inline-block">
            {new Date(analysis.createdAt).toLocaleString()}
          </span>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => deleteMutation.mutate({ id })}
            disabled={deleteMutation.isPending}
            title="Delete Synthesis"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Mind Map Canvas */}
        <main className="flex-1 relative bg-black/20 order-2 md:order-1 h-[50vh] md:h-auto">
          {analysis.status === 'processing' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse rounded-full" />
                <div className="w-32 h-32 border-2 border-primary border-t-transparent rounded-full animate-spin relative z-10" />
              </div>
              <p className="mt-8 font-mono text-primary tracking-widest uppercase animate-pulse">
                Extracting Entities & Relations...
              </p>
            </div>
          ) : analysis.status === 'error' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
              <p className="font-mono text-destructive uppercase tracking-widest mb-2">Synthesis Failed</p>
              <p className="font-mono text-sm text-muted-foreground max-w-md">
                {analysis.errorMessage || 'An unknown error occurred during analysis.'}
              </p>
            </div>
          ) : (
            analysis.nodes && analysis.nodes.length > 0 ? (
              <MindMap data={analysis.nodes} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-mono text-muted-foreground bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 to-transparent">
                <div className="text-center">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p>No visualization data generated.</p>
                </div>
              </div>
            )
          )}
        </main>

        {/* Sidebar */}
        {analysis.status === 'complete' && (
          <aside className="w-full md:w-96 border-t md:border-t-0 md:border-l border-border bg-card/95 backdrop-blur-xl overflow-y-auto flex flex-col z-10 order-1 md:order-2 max-h-[50vh] md:max-h-none">
            <div className="p-6 space-y-8">
              {/* Summary */}
              {analysis.summary && (
                <section>
                  <h3 className="font-mono text-xs font-bold text-secondary uppercase tracking-widest mb-3 flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    Executive Summary
                  </h3>
                  <div className="text-sm leading-relaxed text-foreground opacity-90 p-4 bg-black/40 border border-white/5 relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
                    {analysis.summary}
                  </div>
                </section>
              )}

              {/* Key Metrics */}
              {analysis.keyMetrics && analysis.keyMetrics.length > 0 && (
                <section>
                  <h3 className="font-mono text-xs font-bold text-secondary uppercase tracking-widest mb-3">
                    Critical Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {analysis.keyMetrics.map((metric, i) => (
                      <div key={i} className="bg-black/40 border border-white/5 p-3 flex flex-col hover:border-primary/50 transition-colors">
                        <span className="text-xs font-mono text-muted-foreground mb-1 line-clamp-1" title={metric.label}>
                          {metric.label}
                        </span>
                        <span className="font-mono text-lg font-bold text-primary glow-amber-sm">
                          {metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Key Findings */}
              {analysis.keyPoints && analysis.keyPoints.length > 0 && (
                <section>
                  <h3 className="font-mono text-xs font-bold text-secondary uppercase tracking-widest mb-3">
                    Key Findings
                  </h3>
                  <ul className="space-y-4">
                    {analysis.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <span className="text-primary mr-3 mt-0.5 text-xs opacity-70">◆</span>
                        <span className="opacity-90 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}