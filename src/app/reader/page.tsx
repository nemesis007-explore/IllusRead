"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

// Lazy import epubjs only on client
let epub: any;
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  epub = require('epubjs');
}

type IllustrationState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  url?: string;
  error?: string;
};

export default function ReaderPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const src = typeof searchParams.src === 'string' ? searchParams.src : '';
  const bookName = typeof searchParams.name === 'string' ? searchParams.name : 'Book';

  const viewerRef = useRef<HTMLDivElement | null>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);

  const [selectionText, setSelectionText] = useState<string>('');
  const [currentCfi, setCurrentCfi] = useState<string>('');
  const [currentToc, setCurrentToc] = useState<string>('');
  const [illustration, setIllustration] = useState<IllustrationState>({ status: 'idle' });

  // Initialize book
  useEffect(() => {
    if (!src || !viewerRef.current || !epub) return;
    const book = epub(src);
    bookRef.current = book;

    const rendition = book.renderTo(viewerRef.current, { width: '100%', height: '100%' });
    renditionRef.current = rendition;

    rendition.display();

    const onRelocated = async (loc: any) => {
      setCurrentCfi(loc?.start?.cfi ?? '');
      const nav = await book.loaded.navigation;
      const current = nav.toc.find((i: any) => loc?.start?.href?.startsWith(i.href));
      setCurrentToc(current?.label ?? '');
    };

    rendition.on('relocated', onRelocated);

    // Track text selections
    const onSelected = async (cfiRange: string, contents: any) => {
      const text = await rendition.getRange(cfiRange).then((r: Range) => r.toString());
      setSelectionText(text);
    };
    rendition.on('selected', onSelected);

    return () => {
      rendition.off('relocated', onRelocated);
      rendition.off('selected', onSelected);
      rendition.destroy();
      book.destroy();
    };
  }, [src]);

  // Generate illustration when selection or page changes
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      const signal = controller.signal;
      const query = selectionText.trim();
      const context = {
        selection: query || undefined,
        cfi: currentCfi || undefined,
        toc: currentToc || undefined,
        bookName,
      };
      setIllustration({ status: 'loading' });
      try {
        const res = await fetch('/api/illustrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(context),
          signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setIllustration({ status: 'ready', url: data.url });
      } catch (e: any) {
        setIllustration({ status: 'error', error: e?.message || 'Failed to generate' });
      }
    };

    // Trigger on selection, otherwise on page change (cfi/toc)
    if (selectionText || currentCfi || currentToc) {
      run();
    }
    return () => controller.abort();
  }, [selectionText, currentCfi, currentToc, bookName]);

  return (
    <div className="split">
      <div className="leftPane" style={{ padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>{bookName}</h3>
        <div style={{ marginBottom: 8, color: '#6b7280' }}>
          <div><strong>Chapter:</strong> {currentToc || '—'}</div>
          <div style={{ fontSize: 12, marginTop: 4, wordBreak: 'break-all' }}>
            <strong>Location:</strong> {currentCfi || '—'}
          </div>
        </div>
        <div className="card" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {illustration.status === 'idle' && <span>Highlight text to generate an illustration</span>}
          {illustration.status === 'loading' && <span>Generating illustration…</span>}
          {illustration.status === 'error' && (
            <div style={{ color: 'crimson' }}>Failed: {illustration.error}</div>
          )}
          {illustration.status === 'ready' && illustration.url && (
            <Image alt="Illustration" src={illustration.url} width={600} height={400} style={{ width: '100%', height: 'auto' }} />
          )}
        </div>
        {selectionText && (
          <div style={{ marginTop: 8, fontSize: 14, color: '#374151' }}>
            <strong>Selected:</strong> {selectionText}
          </div>
        )}
      </div>
      <div className="rightPane">
        <div ref={viewerRef} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}
