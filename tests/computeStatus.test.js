const { computeStatus } = require('../lib/computeStatus');

describe('computeStatus', () => {
  it('returns OPEN low confidence when both signals null', () => {
    const result = computeStatus(null, null);
    expect(result.status).toBe('OPEN');
    expect(result.confidence).toBe('low');
    expect(result.sources).toEqual([]);
  });

  it('returns CLOSED high confidence on strong closure news (score >= 2)', () => {
    const result = computeStatus({ closureScore: 4, openScore: 0 }, null);
    expect(result.status).toBe('CLOSED');
    expect(result.confidence).toBe('high');
    expect(result.sources).toContain('news');
  });

  it('returns CLOSED medium confidence on weak closure news + no AIS vessel traffic', () => {
    const result = computeStatus({ closureScore: 1, openScore: 0 }, { vesselCount: 0 });
    expect(result.status).toBe('CLOSED');
    expect(result.confidence).toBe('medium');
  });

  it('returns OPEN high confidence when no closure keywords and vessels present', () => {
    const result = computeStatus({ closureScore: 0, openScore: 3 }, { vesselCount: 10 });
    expect(result.status).toBe('OPEN');
    expect(result.confidence).toBe('high');
    expect(result.sources).toContain('news');
    expect(result.sources).toContain('ais');
  });

  it('returns OPEN medium confidence when news has no signal and no AIS', () => {
    const result = computeStatus({ closureScore: 0, openScore: 0 }, null);
    expect(result.status).toBe('OPEN');
    expect(result.confidence).toBe('medium');
  });

  it('includes ais in sources only when ais signal present', () => {
    expect(computeStatus({ closureScore: 0, openScore: 1 }, null).sources).not.toContain('ais');
    expect(computeStatus({ closureScore: 0, openScore: 1 }, { vesselCount: 5 }).sources).toContain('ais');
  });

  it('returns OPEN high confidence with AIS-only vessel traffic', () => {
    const result = computeStatus(null, { vesselCount: 10 });
    expect(result.status).toBe('OPEN');
    expect(result.confidence).toBe('high');
    expect(result.sources).toContain('ais');
  });

  it('returns CLOSED medium confidence with AIS-only zero vessels', () => {
    const result = computeStatus(null, { vesselCount: 0 });
    expect(result.status).toBe('CLOSED');
    expect(result.confidence).toBe('medium');
    expect(result.sources).toContain('ais');
  });

  it('vesselCount 1-4 is neutral — AIS in sources but no signal change', () => {
    const baseResult = computeStatus({ closureScore: 0, openScore: 0 }, null);
    const withAIS = computeStatus({ closureScore: 0, openScore: 0 }, { vesselCount: 3 });
    expect(withAIS.status).toBe(baseResult.status);
    expect(withAIS.confidence).toBe(baseResult.confidence);
    expect(withAIS.sources).toContain('ais');
  });

  it('vesselCount === 5 is neutral — same outcome as vesselCount === 3', () => {
    const withFive = computeStatus({ closureScore: 0, openScore: 1 }, { vesselCount: 5 });
    expect(withFive.confidence).toBe('high'); // openSignals > 0 from news, not from AIS
  });

  it('strong news closure + AIS open still returns CLOSED high confidence', () => {
    const result = computeStatus({ closureScore: 3, openScore: 0 }, { vesselCount: 20 });
    expect(result.status).toBe('CLOSED');
    expect(result.confidence).toBe('high');
  });
});
