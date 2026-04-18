function extractVesselCount(html) {
  if (typeof html !== 'string') throw new Error('No vessel data in HTML (likely JS-rendered)');

  const patterns = [
    /(\d+)\s*vessels?/i,
    /showing\s+(\d+)/i,
    /"vessel_count"\s*:\s*(\d+)/i,
    /(\d+)\s*ships?/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return parseInt(match[1], 10);
  }

  throw new Error('No vessel data in HTML (likely JS-rendered)');
}

module.exports = { extractVesselCount };
