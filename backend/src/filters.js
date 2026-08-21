// Shared WHERE-clause builder for the region/PT/kebun/rayon/afdeling/blok filters that
// the dashboard, roadmap, and bangunan pages all apply against the `buildings` table.
function buildFilterWhere(query = {}) {
  const { region, pt, kebun, rayon, afdeling, blok } = query;
  const clauses = ['deleted = 0'];
  const params = [];
  if (region) { clauses.push('region = ?'); params.push(region); }
  if (pt) { clauses.push('pt = ?'); params.push(pt); }
  if (kebun) { clauses.push('kebun = ?'); params.push(kebun); }
  if (rayon) { clauses.push('rayon = ?'); params.push(rayon); }
  if (afdeling) { clauses.push('afdeling = ?'); params.push(afdeling); }
  if (blok) { clauses.push('blok = ?'); params.push(blok); }
  return { where: clauses.join(' AND '), params };
}

module.exports = { buildFilterWhere };
