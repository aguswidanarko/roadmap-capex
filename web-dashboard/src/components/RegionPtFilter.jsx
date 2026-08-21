import { useFilters } from '../context/FilterContext';

// The "button dropdown Region" + "button dropdown PT/Kebun" pair required on Dashboard,
// Roadmap, Bangunan, Peta Kampus and Foto pages.
export default function RegionPtFilter() {
  const { region, pt, regions, pts, setRegion, setPt } = useFilters();
  return (
    <div className="filters-row">
      <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
        <option value="">All Region</option>
        {regions.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <select value={pt} onChange={(e) => setPt(e.target.value)} aria-label="PT/Kebun">
        <option value="">All PT</option>
        {pts.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  );
}
