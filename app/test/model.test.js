// Checks the model against the figures in the brief (chats/chat1.md).
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../model.js');

const defaults = () => JSON.parse(JSON.stringify(M.DEFAULTS));

test('trip totals at 105 km/h and 6.2 L/100 km', () => {
  const r = M.compute(defaults());
  assert.equal(r.total.km, 2405);
  assert.equal(Math.round(r.total.litres), 149);
  assert.equal(M.eur0(r.total.fuel), '€289');
  assert.equal(M.eur2(r.total.fees), '€85.25');
  assert.equal(M.eur0(r.cost), '€374');
  assert.equal(r.tanks.toFixed(1), '4.1');
  assert.equal(r.rangeKm, 581);
});

test('day cards match the brief', () => {
  const [d1, d2, d3] = M.compute(defaults()).days;
  assert.equal(M.eur0(d1.fuel), '€92');
  assert.equal(M.eur0(d1.fees), '€29');
  assert.equal(M.eur0(d1.cash), '€121');
  assert.equal(M.eur0(d2.fuel), '€90');
  assert.equal(M.eur2(d2.fees), '€5.30');
  assert.equal(M.eur0(d2.cash), '€95');
  assert.equal(M.eur0(d3.fuel), '€107');
  assert.equal(M.eur2(d3.fees), '€50.95');
  assert.equal(M.eur0(d3.cash), '€158');
  assert.equal(M.hm(d2.pureH), '7 h 37');
  assert.equal(M.hm(d3.elapsedH), '8 h 01');
});

test('country fuel splits', () => {
  const fuel = M.COUNTRIES.map(c => M.eur0(c.km * 6.2 / 100 * c.price));
  // The brief lists Romania as €80; 695 × 0.062 × 1.87 = €80.58, which rounds to €81.
  assert.deepEqual(fuel, ['€2', '€43', '€81', '€41', '€122']);
  assert.equal(M.COUNTRIES.reduce((a, c) => a + c.km, 0), 2405);
});

test('Greek booths add up to €50.95 across 17 stations', () => {
  const items = M.TOLLS.flatMap(g => g.items);
  assert.equal(items.length, 17);
  assert.equal(M.eur2(items.reduce((a, x) => a + x[1], 0)), '€50.95');
  const s = defaults();
  s.paid = { Malgara: true, Thiva: true };
  assert.equal(M.eur2(M.compute(s).tollsLeft), '€45.25');
});

test('optional adders raise the fees', () => {
  const s = Object.assign(defaults(), { huTen: true, bgWeek: true, bridge: true });
  assert.equal(M.eur2(M.compute(s).total.fees), '€96.65');
});

test('maps directions follow the picked hotels', () => {
  const s = defaults();
  s.hotel.n1 = 'exclusive';
  const [d1, d2] = M.dayMapsUrls(s);
  assert.match(decodeURIComponent(d1), /destination=Exclusive Hotel and More, Sibiu, Romania/);
  assert.match(decodeURIComponent(d2), /origin=Exclusive Hotel and More, Sibiu, Romania/);
  assert.match(decodeURIComponent(d2), /destination=Ramada Plaza by Wyndham Thraki, Alexandroupoli, Greece/);
});
