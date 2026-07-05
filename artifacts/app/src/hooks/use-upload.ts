import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Analysis } from '@workspace/api-client-react';
import { getListAnalysesQueryKey } from '@workspace/api-client-react';

interface UploadParams {
  files: File[];
  prompt?: string;
}

export function useUploadAnalysis() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation<Analysis, Error, UploadParams>({
    mutationFn: async ({ files, prompt }) => {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      if (prompt) {
        formData.append('prompt', prompt);
      }

      // We'll simulate upload progress since native fetch doesn't support it well without XMLHttpRequest
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      try {
        const res = await fetch(`${BASE}/api/analyses`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error('Upload failed');
        }

        const data = await res.json();
        return data;
      } finally {
        clearInterval(interval);
        setProgress(100);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
    },
  });

  return {
    ...mutation,
    progress,
  };
}