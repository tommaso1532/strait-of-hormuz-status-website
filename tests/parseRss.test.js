const { parseRSSItems, extractTag } = require('../lib/parseRss');

describe('extractTag', () => {
  it('extracts plain tag content', () => {
    expect(extractTag('<title>Hello World</title>', 'title')).toBe('Hello World');
  });

  it('extracts CDATA content', () => {
    expect(extractTag('<title><![CDATA[Iran seizes tanker]]></title>', 'title')).toBe('Iran seizes tanker');
  });

  it('returns empty string when tag absent', () => {
    expect(extractTag('<item></item>', 'title')).toBe('');
  });
});

describe('parseRSSItems', () => {
  const now = Date.now();
  const pubDate = new Date(now - 1000 * 60 * 60).toUTCString(); // 1h ago

  const xml = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title><![CDATA[Iran blocks Hormuz shipping]]></title>
    <description><![CDATA[Reports of blockade]]></description>
    <pubDate>${pubDate}</pubDate>
  </item>
</channel></rss>`;

  it('returns one item', () => {
    const items = parseRSSItems(xml);
    expect(items).toHaveLength(1);
  });

  it('parses title and description', () => {
    const [item] = parseRSSItems(xml);
    expect(item.title).toBe('Iran blocks Hormuz shipping');
    expect(item.description).toBe('Reports of blockade');
  });

  it('parses pubDate as timestamp', () => {
    const [item] = parseRSSItems(xml);
    expect(item.pubDate).toBeGreaterThan(now - 2 * 60 * 60 * 1000);
    expect(item.pubDate).toBeLessThanOrEqual(now);
  });

  it('returns empty array for empty feed', () => {
    expect(parseRSSItems('<rss><channel></channel></rss>')).toEqual([]);
  });

  it('sets pubDate to 0 when pubDate tag is absent', () => {
    const xml = `<rss><channel><item>
    <title>No date item</title>
    <description>desc</description>
  </item></channel></rss>`;
    const [item] = parseRSSItems(xml);
    expect(item.pubDate).toBe(0);
  });

  it('sets pubDate to 0 for malformed date string', () => {
    const xml = `<rss><channel><item>
    <title>Bad date</title>
    <description></description>
    <pubDate>not-a-date</pubDate>
  </item></channel></rss>`;
    const [item] = parseRSSItems(xml);
    expect(item.pubDate).toBe(0);
  });
});
