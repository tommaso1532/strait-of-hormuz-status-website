const NEWS_RSS_URL = 'https://news.google.com/rss/search?q=strait+of+hormuz&hl=en-US&gl=US&ceid=US:en';
const AIS_URL = 'https://www.marinetraffic.com/en/ais/index/ships/range/minlat:26.0/maxlat:27.0/minlon:56.0/maxlon:57.5/zoom:10';

function makeRSSXml(title, hoursAgo) {
  const pubDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toUTCString();
  return `<rss><channel><item>
    <title><![CDATA[${title}]]></title>
    <description></description>
    <pubDate>${pubDate}</pubDate>
  </item></channel></rss>`;
}

function mockFetch(rssBody, aisBody) {
  return jest.fn(url => {
    if (url === NEWS_RSS_URL) {
      return Promise.resolve({ ok: true, text: () => Promise.resolve(rssBody) });
    }
    if (url === AIS_URL) {
      if (aisBody === null) return Promise.reject(new Error('Network error'));
      return Promise.resolve({ ok: true, text: () => Promise.resolve(aisBody) });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
}

const { createHandler } = require('../api/status');

describe('handler', () => {
  let originalFetch;

  beforeEach(() => { originalFetch = global.fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  function makeResMock() {
    const res = {
      _headers: {},
      _body: null,
      setHeader(k, v) { this._headers[k] = v; },
      json(body) { this._body = body; },
      status(code) { this._statusCode = code; return this; },
    };
    return res;
  }

  // Note: global.fetch must be assigned before the handler is *invoked*, not before require().
  // The module cache means require() returns the same module object every time.
  // Mocking global.fetch before handler() call is what controls which fetch is used.

  it('returns CLOSED high confidence on strong closure news', async () => {
    global.fetch = mockFetch(makeRSSXml('Hormuz blocked by Iran forces', 2), '<p>0 vessels</p>');
    const handler = createHandler();
    const res = makeResMock();
    await handler({}, res);
    expect(res._body.status).toBe('CLOSED');
    expect(res._body.confidence).toBe('high');
    expect(res._body.sources).toContain('news');
  });

  it('returns OPEN when no closure keywords in news', async () => {
    global.fetch = mockFetch(makeRSSXml('Oil tanker transits Hormuz safely', 1), '<p>12 vessels in area</p>');
    const handler = createHandler();
    const res = makeResMock();
    await handler({}, res);
    expect(res._body.status).toBe('OPEN');
    expect(res._body.sources).toContain('ais');
  });

  it('returns OPEN low confidence when both fetches fail', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
    const handler = createHandler();
    const res = makeResMock();
    await handler({}, res);
    expect(res._body.status).toBe('OPEN');
    expect(res._body.confidence).toBe('low');
    expect(res._body.sources).toEqual([]);
    expect(res._statusCode).toBe(200);
  });

  it('includes checkedAt ISO timestamp', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('fail')));
    const handler = createHandler();
    const res = makeResMock();
    await handler({}, res);
    expect(res._body.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('degrades gracefully when AIS HTML has no vessel pattern', async () => {
    global.fetch = mockFetch(makeRSSXml('Oil tanker transits Hormuz safely', 1), '<html><body><script src="app.js"></script></body></html>');
    const handler = createHandler();
    const res = makeResMock();
    await handler({}, res);
    expect(res._body.sources).not.toContain('ais');
    expect(res._body.status).toBe('OPEN');
  });
});
