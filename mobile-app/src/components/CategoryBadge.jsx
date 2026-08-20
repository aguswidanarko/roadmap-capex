import { CATEGORY_META } from '../api';

export default function CategoryBadge({ code }) {
  const meta = CATEGORY_META[code] || { label: code, color: '#64748b' };
  return (
    <span className="badge" style={{ background: meta.color + '1c', color: meta.color }}>
      <span className="dot" style={{ background: meta.color }} /> {code}
    </span>
  );
}
