"use client";
import { useCallback, useMemo, useState } from 'react';

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (!/\.(epub|pdf)$/i.test(f.name)) {
      setError('Please upload an .epub or .pdf file');
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  const href = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  return (
    <div className="container">
      <div className="card">
        <h2>Upload an eBook</h2>
        <p>Supported: .epub (best), .pdf (basic text selection not supported here).</p>
        <input type="file" accept=".epub,.pdf" onChange={onChange} />
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        {href && (
          <a className="btn primary" href={`/reader?src=${encodeURIComponent(href)}&name=${encodeURIComponent(file?.name || 'book')}`}>
            Open Reader
          </a>
        )}
      </div>
    </div>
  );
}
