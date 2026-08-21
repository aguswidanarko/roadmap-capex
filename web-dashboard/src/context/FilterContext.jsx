import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api';

// Shared Region / PT (Kebun) filter state, used by Dashboard, Roadmap, Bangunan, Peta
// Kampus and Foto so a selection made on one page carries over to the others (BRD update:
// "button dropdown untuk memilih region/PT" on every one of those pages).
const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [region, setRegionState] = useState(() => localStorage.getItem('capex_filter_region') || '');
  const [pt, setPt] = useState(() => localStorage.getItem('capex_filter_pt') || '');
  const [regions, setRegions] = useState([]);
  const [pts, setPts] = useState([]);

  useEffect(() => { api.get('/master/regions').then((r) => setRegions(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    api.get('/master/pts', { params: region ? { region } : {} }).then((r) => setPts(r.data)).catch(() => {});
  }, [region]);

  useEffect(() => { localStorage.setItem('capex_filter_region', region); }, [region]);
  useEffect(() => { localStorage.setItem('capex_filter_pt', pt); }, [pt]);

  // Selecting a region resets PT (the PT list is scoped to the chosen region), matching the
  // "All Region / Region Riau / ..." then "All PT / PT AAA / ..." cascading dropdown pattern.
  const setRegion = useCallback((val) => {
    setRegionState(val);
    setPt('');
  }, []);

  const params = {};
  if (region) params.region = region;
  if (pt) params.pt = pt;

  return (
    <FilterContext.Provider value={{ region, pt, regions, pts, setRegion, setPt, params }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
  return ctx;
}
