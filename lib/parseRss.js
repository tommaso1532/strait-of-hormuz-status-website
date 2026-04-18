function extractTag(xml, tag) {
  const pattern = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`
  );
  const match = xml.match(pattern);
  return match ? (match[1] ?? match[2] ?? '').trim() : '';
}

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = extractTag(content, 'title');
    const description = extractTag(content, 'description');
    const pubDateStr = extractTag(content, 'pubDate');
    const pubDate = pubDateStr ? new Date(pubDateStr).getTime() : 0;
    items.push({ title, description, pubDate });
  }
  return items;
}

module.exports = { extractTag, parseRSSItems };
