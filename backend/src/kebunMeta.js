// Known kebun -> { pt, region } mapping.
// Used to (a) backfill the new region/pt columns for buildings/photos rows created
// before this feature existed, and (b) default region/pt on Master Data imports and
// manual entries that don't specify them explicitly.
//
// Extend this list whenever a new kebun/estate is onboarded so region/PT filtering
// stays accurate without requiring every import to carry the columns explicitly.
//
// Region assignment is inferred from each kebun's GPS coordinates in its source data:
//  - KAL (PT. XXX / Pondok 1 fixture): lat -0.84, lon 115.88 -> West/Central Kalimantan -> Region Kalbar
//  - PT. SAM 2 (Kebun Senamanenek): lat ~0.9-1.0, lon ~100.7-100.85 -> Riau -> Region Riau
const KEBUN_META = {
  KAL: { pt: 'PT. XXX', region: 'Region Kalbar' },
  'PT. SAM 2': { pt: 'PT. SAM 2', region: 'Region Riau' },
};

function lookupKebunMeta(kebun) {
  if (kebun && KEBUN_META[kebun]) return KEBUN_META[kebun];
  return { pt: kebun || null, region: null };
}

module.exports = { KEBUN_META, lookupKebunMeta };
