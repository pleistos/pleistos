// Trip model: static plan data and the pure cost/time calculations.
// Loaded as a classic script in the browser (window.TripModel) and via
// require() in the Node tests.
(function (root) {
  const COUNTRIES = [
    { code: 'SK', name: 'Slovakia', km: 20, price: 1.85, stops: [{ n: 'Bratislava', note: 'Start · leave full' }] },
    { code: 'HU', name: 'Hungary', km: 390, price: 1.77, stops: [{ n: 'M1', note: 'Motorway' }, { n: 'Nădlac', note: 'Border into Romania', border: true }] },
    { code: 'RO', name: 'Romania', km: 695, price: 1.87, stops: [{ n: 'A1', note: 'Motorway' }, { n: 'Sibiu', note: 'Night 1', night: true }, { n: 'Pitești', note: 'Day 2' }, { n: 'Giurgiu–Ruse', note: 'Bridge into Bulgaria', border: true }] },
    { code: 'BG', name: 'Bulgaria', km: 400, price: 1.66, tag: 'Cheapest fill', tagCls: 'tag tag-accent', stops: [{ n: 'Veliko Tarnovo', note: 'A2' }, { n: 'Stara Zagora', note: 'Fill to the brim' }, { n: 'Ormenio', note: 'Border into Greece', border: true }] },
    { code: 'GR', name: 'Greece', km: 900, price: 2.19, tag: '+€0.53/L', tagCls: 'tag tag-accent-2', stops: [{ n: 'Alexandroupoli', note: 'Night 2', night: true }, { n: 'Kavala', note: 'A2 Egnatia' }, { n: 'Thessaloniki', note: 'Day 3' }, { n: 'A1', note: 'Fuel stop ~400 km in' }, { n: 'Athens', note: 'Arrive', night: true }] }
  ];

  const PRICE = Object.fromEntries(COUNTRIES.map(c => [c.code, c.price]));

  // Country km per day are planning splits for fuel pricing, not an odometer.
  const DAYS = [
    { km: 815, split: { SK: 20, HU: 390, RO: 405 } },
    { km: 800, split: { RO: 290, BG: 400, GR: 110 } },
    { km: 790, split: { GR: 790 } }
  ];

  const TOLLS = [
    { name: 'A2 Egnatia', items: [['Mesti / Komotini', 2.75], ['Iasmos / Xanthi', 2.25], ['Kavala', 2.30], ['Moustheni', 2.65], ['Asprovalta', 1.40], ['Analipsi', 2.90]] },
    { name: 'A1 to Athens', items: [['Malgara', 1.15], ['Kleidi / Aeginio', 2.60], ['Leptokarya', 3.80], ['Makrychori / Larissa', 3.00], ['Moschochori / Kileler', 4.70], ['Pelasgia', 4.10], ['Mavromantila', 2.25], ['Agios Konstantinos', 2.10], ['Traganas', 4.55], ['Thiva', 4.55], ['Afidnes', 3.90]] }
  ];
  const GREEK_TOLLS = 50.95;

  const HOTELS = {
    n1: [
      { id: 'merc-air', name: 'Mercure Sibiu Airport', stars: '4★', breakfast: 'Included', parking: 'Free', detour: 'Ring road, ~5 min, on the side you arrive from Deva', price: 'from ~$76', onRoute: true },
      { id: 'arsenal', name: 'Mercure Sibiu Arsenal', stars: 'Not stated', breakfast: 'Not on every rate', parking: 'Not stated', detour: 'In town', price: '$87–113', extra: 'Pool, fitness.' },
      { id: 'exclusive', name: 'Exclusive Hotel and More', stars: '4★', breakfast: 'Included', parking: 'Free', detour: 'Check on map', price: '~$80' }
    ],
    n2: [
      { id: 'ramada', name: 'Ramada Plaza by Wyndham Thraki', stars: '5★', breakfast: 'Buffet', parking: 'Yes', detour: 'Km 4 of the Alexandroupoli–Thessaloniki road', price: '$104–133', onRoute: true, extra: 'Beach, spa, two pools, gym.' },
      { id: 'plaza', name: 'Plaza Hotel', stars: '2★', breakfast: 'Included', parking: 'Not stated', detour: 'Km 2, beachfront', price: '~$85', extra: 'Weaker reviews.' }
    ]
  };
  const NIGHTS = [
    { key: 'n1', label: 'Night 1', city: 'Sibiu', place: 'Sibiu, Romania' },
    { key: 'n2', label: 'Night 2', city: 'Alexandroupoli', place: 'Alexandroupoli, Greece' }
  ];

  const ADDERS = [
    { key: 'huTen', label: 'Still in Hungary after midnight: 10-day D1', delta: '+€3.70' },
    { key: 'bgWeek', label: 'Bulgarian leg crosses the 24-hour window: weekly vignette', delta: '+€4.70' },
    { key: 'bridge', label: 'Giurgiu booth still asks: 15 lei', delta: '+€3' }
  ];

  const PRESETS = [[5.2, 'careful'], [6.2, 'this trip'], [6.7, '130 cruise']];

  const TANK_L = 36;
  const STOPS_H = 0.5; // 3 stops × 10 min a day

  const DEFAULTS = {
    tab: 'days', speed: 105, cons: 6.2,
    huTen: false, bgWeek: false, bridge: false,
    bought: {}, paid: {}, hotel: { n1: 'merc-air', n2: 'ramada' }
  };

  const eur0 = v => '€' + Math.round(v).toLocaleString('en-GB');
  const eur2 = v => '€' + v.toFixed(2);
  const hm = h => { const m = Math.round(h * 60); return Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0'); };

  function feePrices(s) {
    return { hu: s.huTen ? 18.90 : 15.20, bg: s.bgWeek ? 10 : 5.30, bridge: s.bridge ? 3 : 0 };
  }

  function vignettes(s) {
    const p = feePrices(s);
    return [
      { id: 'sk', country: 'Slovakia', price: 8.10, shop: 'eznamka.sk', url: 'https://eznamka.sk/en', what: '1-day e-známka. The D2 spur from the D4 to the Hungarian border at Čunovo is tolled.' },
      { id: 'hu', country: 'Hungary', price: p.hu, shop: 'ematrica.nemzetiutdij.hu', url: 'https://ematrica.nemzetiutdij.hu/en', what: s.huTen ? 'D1 e-matrica, 10 days.' : 'D1 e-matrica, 1 day. Official price HUF 5,550.' },
      { id: 'ro', country: 'Romania', price: 5.70, shop: 'erovinieta.ro', url: 'https://www.erovinieta.ro', what: 'Rovinieta category A, Euro 6, 10 days. Official price 30 lei. Enter Euro 6: a blank Euro class is charged as Euro 0.' },
      { id: 'bg', country: 'Bulgaria', price: p.bg, shop: 'web.bgtoll.bg', url: 'https://web.bgtoll.bg', what: s.bgWeek ? 'e-vignette, weekly, car up to 3.5 t.' : 'e-vignette, 1 day, car up to 3.5 t.' }
    ];
  }

  // Fees paid on each day, in the order the day card lists them.
  function dayFeeLines(s) {
    const p = feePrices(s);
    return [
      [{ label: 'Slovakia e-známka, 1 day', price: 8.10 }, { label: s.huTen ? 'Hungary D1 e-matrica, 10 days' : 'Hungary D1 e-matrica, 1 day', price: p.hu }, { label: 'Romania Rovinieta, 10 days', price: 5.70 }],
      [{ label: s.bgWeek ? 'Bulgaria e-vignette, week' : 'Bulgaria e-vignette, 1 day', price: p.bg }, { label: 'Giurgiu–Ruse bridge', price: p.bridge }],
      [{ label: 'Greece, 17 toll stations', price: GREEK_TOLLS }]
    ];
  }

  function hotelPick(s, key) {
    return HOTELS[key].find(h => h.id === (s.hotel || {})[key]) || HOTELS[key][0];
  }
  const hotelQuery = (h, key) => h.name + ', ' + NIGHTS.find(n => n.key === key).place;

  const E = encodeURIComponent;
  const gdir = (o, d, w) => 'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=' + E(o) + '&destination=' + E(d) + (w.length ? '&waypoints=' + E(w.join('|')) : '');
  const bookingUrl = q => 'https://www.booking.com/searchresults.html?ss=' + E(q);
  const mapUrl = q => 'https://www.google.com/maps/search/?api=1&query=' + E(q);

  function dayMapsUrls(s) {
    const p1 = hotelQuery(hotelPick(s, 'n1'), 'n1'), p2 = hotelQuery(hotelPick(s, 'n2'), 'n2');
    return [
      gdir('Bratislava, Slovakia', p1, ['Nădlac, Romania']),
      gdir(p1, p2, ['Pitești, Romania', 'Giurgiu, Romania', 'Ruse, Bulgaria', 'Veliko Tarnovo, Bulgaria', 'Stara Zagora, Bulgaria', 'Ormenio, Greece']),
      gdir(p2, 'Athens, Greece', ['Kavala, Greece', 'Thessaloniki, Greece'])
    ];
  }

  function compute(s) {
    const c = s.cons, v = s.speed;
    const lines = dayFeeLines(s);
    const total = { km: 0, litres: 0, fuel: 0, fees: 0 };
    const days = DAYS.map((d, i) => {
      const litres = d.km * c / 100;
      const fuel = Object.entries(d.split).reduce((a, [k, km]) => a + km * c / 100 * PRICE[k], 0);
      const fees = lines[i].reduce((a, x) => a + x.price, 0);
      const pure = d.km / v;
      total.km += d.km; total.litres += litres; total.fuel += fuel; total.fees += fees;
      return { km: d.km, split: d.split, pureH: pure, elapsedH: pure + STOPS_H, litres, fuel, fees, cash: fuel + fees, lines: lines[i] };
    });
    const tollsLeft = TOLLS.flatMap(g => g.items).filter(([n]) => !(s.paid || {})[n]).reduce((a, x) => a + x[1], 0);
    return {
      days, total, cost: total.fuel + total.fees,
      tanks: total.litres / TANK_L, rangeKm: Math.round(TANK_L / c * 100), tollsLeft
    };
  }

  const api = {
    COUNTRIES, PRICE, DAYS, TOLLS, GREEK_TOLLS, HOTELS, NIGHTS, ADDERS, PRESETS, TANK_L, DEFAULTS,
    eur0, eur2, hm, feePrices, vignettes, dayFeeLines, hotelPick, hotelQuery,
    dayMapsUrls, bookingUrl, mapUrl, compute
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TripModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
