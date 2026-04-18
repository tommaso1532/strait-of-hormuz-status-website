const { extractVesselCount } = require('../lib/scrapeAIS');

describe('extractVesselCount', () => {
  it('extracts count from "12 vessels" pattern', () => {
    expect(extractVesselCount('<p>12 vessels found in area</p>')).toBe(12);
  });

  it('extracts count from "Showing 7" pattern', () => {
    expect(extractVesselCount('<div>Showing 7 results</div>')).toBe(7);
  });

  it('extracts count from "vessel_count":3 JSON-in-HTML pattern', () => {
    expect(extractVesselCount('{"vessel_count":3,"area":"hormuz"}')).toBe(3);
  });

  it('throws when no vessel count found (JS-rendered page)', () => {
    expect(() => extractVesselCount('<html><body><script src="app.js"></script></body></html>')).toThrow('No vessel data');
  });
});
