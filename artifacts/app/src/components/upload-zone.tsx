import React, { useCallback, useState } from 'react';
import { useUploadAnalysis } from '@/hooks/use-upload';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileType, Plus, X } from 'lucide-react';

export function UploadZone() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState('');
  const { mutate: upload, isPending, progress } = useUploadAnalysis();
  const [, setLocation] = useLocation();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    upload({ files, prompt }, {
      onSuccess: (data) => {
        setLocation(`/analyses/${data.id}`);
      }
    });
  };

  if (isPending) {
    return (
      <div className="w-full h-64 border border-primary bg-primary/5 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        
        <div className="z-10 flex flex-col items-center space-y-6 w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse rounded-full" />
            <UploadCloud className="w-12 h-12 text-primary animate-bounce relative z-10" />
          </div>
          
          <div className="text-center space-y-2 w-full">
            <h3 className="font-mono text-lg text-primary tracking-widest uppercase">Processing Matrix...</h3>
            <div className="w-full bg-black/50 border border-primary/30 h-2">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-out glow-amber"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="font-mono text-xs text-muted-foreground">Uploading and initiating AI synthesis. This may take 10-30 seconds.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        className={`w-full border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-12 relative cursor-pointer
          ${dragActive ? 'border-primary bg-primary/5 glow-amber' : 'border-border hover:border-primary/50 bg-card'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          multiple 
          onChange={handleChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          data-testid="file-upload-input"
        />
        
        <UploadCloud className={`w-10 h-10 mb-4 transition-colors ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
        <h3 className="text-lg font-mono font-bold tracking-tight mb-2">Initialize Synthesis</h3>
        <p className="text-sm text-muted-foreground font-mono text-center max-w-sm">
          Drop documents, spreadsheets, or images here to extract intelligence.
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-4 p-4 border border-border bg-card">
          <div className="flex items-center justify-between">
            <h4 className="font-mono text-sm tracking-wider text-muted-foreground">Selected Assets ({files.length})</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-black/40 border border-white/5">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <FileType className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-mono text-xs truncate">{file.name}</span>
                </div>
                <button 
                  onClick={() => removeFile(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="font-mono text-xs text-secondary tracking-wider">Custom Directive (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Focus on Q3 revenue risks..." 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-3 py-2 font-mono text-sm focus:outline-none focus:border-secondary transition-colors text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          <Button 
            className="w-full" 
            variant="amber"
            onClick={handleUpload}
            data-testid="button-synthesize"
          >
            Synthesize
          </Button>
        </div>
      )}
    </div>
  );
}