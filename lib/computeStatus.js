function computeStatus(news, ais) {
  const sources = [];
  let closureSignals = 0;
  let openSignals = 0;
  let newsClosureScore = 0;

  if (news !== null) {
    const closureScore = Number(news.closureScore);
    const openScore = Number(news.openScore);
    if (!Number.isFinite(closureScore) || !Number.isFinite(openScore)) {
      // malformed news signal — skip it
    } else {
      sources.push('news');
      newsClosureScore = closureScore;
      closureSignals += closureScore;
      openSignals += openScore;
    }
  }

  if (ais !== null) {
    sources.push('ais');
    if (ais.vesselCount > 5) openSignals += 1;
    else if (ais.vesselCount === 0) closureSignals += 1;
  }

  if (sources.length === 0) {
    return { status: 'OPEN', confidence: 'low', sources };
  }

  // High confidence closure requires strong news signal alone (>= 2 from news)
  if (newsClosureScore >= 2) {
    return { status: 'CLOSED', confidence: 'high', sources };
  }

  if (closureSignals > openSignals && closureSignals > 0) {
    return { status: 'CLOSED', confidence: 'medium', sources };
  }

  const confidence = openSignals > 0 ? 'high' : 'medium';
  return { status: 'OPEN', confidence, sources };
}

module.exports = { computeStatus };
