import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Small auto-rotating slideshow used by the Dashboard's "Peta Kampus" and "Foto Bangunan"
// windows. `items` should already carry a `__caption` string; `renderFrame(item)` returns
// the visual (an <img> or a placeholder icon). Clicking navigates to `to`.
export default function Slideshow({ items, renderFrame, emptyText, to, intervalMs = 4000 }) {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setIdx(0);
    if (items.length < 2) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), intervalMs);
    return () => clearInterval(t);
  }, [items.length, intervalMs]);

  if (!items.length) {
    return (
      <div className="slideshow" onClick={() => to && navigate(to)}>
        <div className="slideshow-empty">{emptyText}</div>
      </div>
    );
  }

  const item = items[idx];
  return (
    <div className="slideshow" onClick={() => to && navigate(to)} role="button" tabIndex={0}>
      <div className="slideshow-frame">{renderFrame(item)}</div>
      <div className="slideshow-caption">{item.__caption}</div>
      {items.length > 1 && (
        <div className="slideshow-dots">
          {items.map((_, i) => <span key={i} className={i === idx ? 'active' : ''} />)}
        </div>
      )}
    </div>
  );
}
