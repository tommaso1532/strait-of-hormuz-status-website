const CLOSURE_KEYWORDS = ['closed', 'blocked', 'seized', 'halted', 'shut', 'disrupted', 'attack', 'mine', 'blockade'];
const OPEN_KEYWORDS = ['open', 'transit', 'shipping', 'resumed', 'passage', 'normal'];

const MS_24H = 24 * 60 * 60 * 1000;
const MS_48H = 48 * 60 * 60 * 1000;

function scoreNewsItems(items) {
  const now = Date.now();
  let closureScore = 0;
  let openScore = 0;

  for (const item of items) {
    const age = now - item.pubDate;
    if (age < 0 || age > MS_48H) continue;
    const weight = age < MS_24H ? 2 : 1;
    const text = `${item.title ?? ''} ${item.description ?? ''}`.toLowerCase();

    if (CLOSURE_KEYWORDS.some(kw => text.includes(kw))) closureScore += weight;
    if (OPEN_KEYWORDS.some(kw => text.includes(kw))) openScore += weight;
  }

  return { closureScore, openScore };
}

module.exports = { scoreNewsItems };
