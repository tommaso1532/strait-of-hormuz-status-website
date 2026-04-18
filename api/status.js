const { parseRSSItems } = require('../lib/parseRss');
const { scoreNewsItems } = require('../lib/scoreNews');
const { extractVesselCount } = require('../lib/scrapeAIS');
const { computeStatus } = require('../lib/computeStatus');

const NEWS_RSS_URL = 'https://news.google.com/rss/search?q=strait+of+hormuz&hl=en-US&gl=US&ceid=US:en';
const AIS_URL = 'https://www.marinetraffic.com/en/ais/index/ships/range/minlat:26.0/maxlat:27.0/minlon:56.0/maxlon:57.5/zoom:10';

async function fetchNewsSignal() {
  const response = await fetch(NEWS_RSS_URL, { signal: AbortSignal.timeout(5000) });
  const xml = await response.text();
  const items = parseRSSItems(xml);
  return scoreNewsItems(items);
}

async function fetchAISSignal() {
  const response = await fetch(AIS_URL, {
    signal: AbortSignal.timeout(5000),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; hormuz-status/1.0)' },
  });
  const html = await response.text();
  const vesselCount = extractVesselCount(html);
  return { vesselCount };
}

function createHandler() {
  return async function handler(req, res) {
    const [newsResult, aisResult] = await Promise.allSettled([
      fetchNewsSignal(),
      fetchAISSignal(),
    ]);

    const news = newsResult.status === 'fulfilled' ? newsResult.value : null;
    const ais = aisResult.status === 'fulfilled' ? aisResult.value : null;

    const { status, confidence, sources } = computeStatus(news, ais);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      status,
      confidence,
      sources,
      checkedAt: new Date().toISOString(),
    });
  };
}

// Vercel calls module.exports as a function; tests access .createHandler
const _handler = createHandler();
_handler.createHandler = createHandler;
module.exports = _handler;
