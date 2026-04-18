const { scoreNewsItems } = require('../lib/scoreNews');

const makeItem = (title, hoursAgo) => ({
  title,
  description: '',
  pubDate: Date.now() - hoursAgo * 60 * 60 * 1000,
});

describe('scoreNewsItems', () => {
  it('returns zero scores for empty items', () => {
    expect(scoreNewsItems([])).toEqual({ closureScore: 0, openScore: 0 });
  });

  it('scores closure keyword with weight 2 for item < 24h old', () => {
    const items = [makeItem('Strait of Hormuz blocked by Iran', 2)];
    const { closureScore } = scoreNewsItems(items);
    expect(closureScore).toBe(2);
  });

  it('scores closure keyword with weight 1 for item 24–48h old', () => {
    const items = [makeItem('Hormuz seized by military', 30)];
    const { closureScore } = scoreNewsItems(items);
    expect(closureScore).toBe(1);
  });

  it('scores open keyword', () => {
    const items = [makeItem('Shipping resumes through Hormuz', 5)];
    const { openScore } = scoreNewsItems(items);
    expect(openScore).toBe(2);
  });

  it('ignores items older than 48h', () => {
    const items = [makeItem('Hormuz closed last week', 50)];
    expect(scoreNewsItems(items)).toEqual({ closureScore: 0, openScore: 0 });
  });

  it('scores each item at most once per direction', () => {
    const items = [makeItem('Hormuz closed and blocked and seized', 1)];
    const { closureScore } = scoreNewsItems(items);
    expect(closureScore).toBe(2); // one item, weight 2, not 6
  });
});
