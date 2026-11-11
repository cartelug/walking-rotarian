export function rankSearch(documents, query, limit = 8) {
  const normalise = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const terms = normalise(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return documents.slice(0, limit);
  return documents.map((document, order) => {
    const title = normalise(document.title), text = normalise([document.title, document.body, document.place, document.route].join(' '));
    if (!terms.every(term => text.includes(term))) return null;
    const score = terms.reduce((total, term) => total + (title === term ? 50 : title.startsWith(term) ? 20 : title.includes(term) ? 10 : 1), 0);
    return {document, score, order};
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.order - b.order).slice(0, limit).map(result => result.document);
}
