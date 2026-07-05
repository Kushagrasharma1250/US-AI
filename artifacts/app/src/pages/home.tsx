import { UploadZone } from '@/components/upload-zone';
import { AnalysisCard } from '@/components/analysis-card';
import { useListAnalyses } from '@workspace/api-client-react';
import { Database, Network } from 'lucide-react';

export function Home() {
  const { data: analyses, isLoading } = useListAnalyses();

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="border-b border-border bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Network className="w-6 h-6 text-primary glow-amber" />
            <h1 className="font-mono font-bold text-xl tracking-tighter uppercase text-white">File Insight</h1>
          </div>
          <div className="font-mono text-xs text-muted-foreground tracking-widest hidden sm:block">
            Neural Document Interface
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-12 space-y-16">
        {/* Upload Section */}
        <section className="max-w-3xl mx-auto">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-mono font-bold uppercase tracking-tight text-white flex items-center">
              <Database className="w-5 h-5 mr-3 text-secondary" />
              New Synthesis
            </h2>
            <p className="font-mono text-sm text-muted-foreground">
              Establish a new knowledge graph from unstructured data.
            </p>
          </div>
          <UploadZone />
        </section>

        {/* Previous Analyses */}
        <section className="max-w-6xl mx-auto">
          <div className="mb-6 space-y-2 border-b border-border pb-4">
            <h2 className="text-xl font-mono font-bold uppercase tracking-tight text-white">
              Data Vault
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : analyses && analyses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map((analysis) => (
                <AnalysisCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-border bg-black/20">
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-mono text-lg font-bold text-white mb-2">Vault Empty</h3>
              <p className="font-mono text-sm text-muted-foreground">
                No analyses have been performed yet. Drop files above to begin.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}