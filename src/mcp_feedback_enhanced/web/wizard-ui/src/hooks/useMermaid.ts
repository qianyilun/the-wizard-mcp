/**
 * Mermaid diagram rendering hook
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid once
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
});

interface UseMermaidOptions {
  source: string;
  debounceMs?: number;
}

interface UseMermaidResult {
  svg: string | null;
  error: string | null;
  isValid: boolean;
  isRendering: boolean;
}

export const useMermaid = ({
  source,
  debounceMs = 500
}: UseMermaidOptions): UseMermaidResult => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);
  const renderCountRef = useRef(0);

  const renderMermaid = useCallback(async (code: string) => {
    if (!code.trim()) {
      setSvg(null);
      setError(null);
      return;
    }

    setIsRendering(true);
    setError(null);

    try {
      // Generate unique ID for this render
      const id = `mermaid-${Date.now()}-${renderCountRef.current++}`;

      // Render the diagram
      const { svg: renderedSvg } = await mermaid.render(id, code);

      setSvg(renderedSvg);
      setError(null);

      console.log('[WIZARD] Mermaid diagram rendered successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid Mermaid syntax';
      console.error('[WIZARD] Mermaid render error:', errorMessage);

      setSvg(null);
      setError(errorMessage);
    } finally {
      setIsRendering(false);
    }
  }, []);

  // Debounced render effect
  useEffect(() => {
    // Clear any pending timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set up new debounced render
    debounceTimeoutRef.current = setTimeout(() => {
      renderMermaid(source);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [source, debounceMs, renderMermaid]);

  return {
    svg,
    error,
    isValid: svg !== null && error === null,
    isRendering,
  };
};
