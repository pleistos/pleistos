// Bratislava → Athens trip planner: state, rendering and event wiring.
// The sticky totals bar and its sliders are static markup updated in place
// (so a slider keeps its drag); the active tab is re-rendered into #view.
(function () {
  const M = window.TripModel;
  const { eur0, eur2, hm } = M;
  const KEY = 'bta-trip-v1';
  const TABS = [['days', 'Days'], ['route', 'Route'], ['fees', 'Fees'], ['hotels', 'Hotels']];
  const PERSIST = ['tab', 'speed', 'cons', 'huTen', 'bgWeek', 'bridge', 'bought', 'paid', 'hotel'];

  const params = new URLSearchParams(location.search);
  const plates = params.get('numerals') !== 'plain';

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  const startTab = TABS.some(([id]) => id === params.get('tab')) ? params.get('tab') : null;
  const state = Object.assign({}, M.DEFAULTS, saved, { adjust: false, tollsOpen: false });
  if (startTab) state.tab = startTab;

  const $ = id => document.getElementById(id);
  const esc = v => String(v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const attr = esc;

  function set(patch) {
    Object.assign(state, patch);
    try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(PERSIST.map(k => [k, state[k]])))); } catch (e) {}
    render();
  }

  // — fragments —

  const ext = (href, cls, label) => `<a class="${cls}" href="${attr(href)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;

  function dayNum(n) {
    if (!plates) return `<span class="day-num plain">${n}</span>`;
    return `<span class="day-num cmyk-num"><span class="paper">${n}</span><span class="plate plate-c" aria-hidden="true">${n}</span><span class="plate plate-m" aria-hidden="true">${n}</span><span class="plate plate-y" aria-hidden="true">${n}</span></span>`;
  }

  function stats(d, feesLabel, feesFmt) {
    const cells = [
      ['Distance', d.km + ' km'], ['Pure', hm(d.pureH)], ['Elapsed', hm(d.elapsedH)],
      ['Fuel', d.litres.toFixed(1) + ' L'], ['Fuel cost', eur0(d.fuel)], [feesLabel, feesFmt(d.fees)]
    ];
    return `<div class="stats">${cells.map(([k, v]) => `<div><div class="stat-label">${k}</div><div class="stat-value">${esc(v)}</div></div>`).join('')}</div>`;
  }

  const feeLines = (lines, title) => `<div class="fee-lines">${title ? `<div class="title">${title}</div>` : ''}${lines.map(l => `<div class="row"><span>${esc(l.label)}</span><span>${eur2(l.price)}</span></div>`).join('')}</div>`;

  const cash = d => `<div class="cash"><span>Day cash</span><strong>${eur0(d.cash)}</strong></div>`;

  function sleepBtn(key, city) {
    const h = M.hotelPick(state, key);
    return `<button class="btn btn-secondary wide-btn sleep-btn" data-act="tab" data-arg="hotels"><span class="stack"><span>Sleep — ${city}</span><span>${esc(h.name)}</span></span><span>${esc(h.price)} →</span></button>`;
  }

  function tollGroups(cls) {
    return `<div class="toll-groups ${cls || ''}">${M.TOLLS.map(g => `
      <div>
        <div class="caps"><span>${esc(g.name)}</span><span>${eur2(g.items.reduce((a, x) => a + x[1], 0))}</span></div>
        ${g.items.map(([name, price]) => {
          const paid = !!state.paid[name];
          return `<label class="check${paid ? ' paid' : ''}"><input type="checkbox" data-act="paid" data-arg="${attr(name)}"${paid ? ' checked' : ''}><span class="name">${esc(name)}</span><span class="price">€${price.toFixed(2)}</span></label>`;
        }).join('')}
      </div>`).join('')}</div>`;
  }

  // — screens —

  function daysView(r) {
    const [d1, d2, d3] = r.days;
    const maps = M.dayMapsUrls(state);
    return `<div class="screen days">
      <section data-screen-label="Day 1">
        <div class="day-head">${dayNum(1)}<div><div class="eyebrow accent">Day 1</div><h2>Bratislava → Sibiu</h2></div></div>
        <div class="day-roads">Short Slovak motorway, Hungary M1, into Romania at Nădlac, Romanian A1 to Sibiu.</div>
        ${ext(maps[0], 'btn btn-primary maps-btn', 'Directions in Google Maps')}
        ${stats(d1, 'Fees', eur0)}
        ${feeLines(d1.lines, 'Buy all three vignettes this morning')}
        ${cash(d1)}
        <div class="small muted">Fuel split: Slovakia 20 · Hungary 390 · Romania 405 km</div>
        ${sleepBtn('n1', 'Sibiu')}
      </section>

      <section data-screen-label="Day 2">
        <div class="day-head">${dayNum(2)}<div><div class="eyebrow accent">Day 2</div><h2>Sibiu → Alexandroupoli</h2></div></div>
        <div class="day-roads">Pitești → Giurgiu–Ruse → Bulgarian A2 via Veliko Tarnovo and Stara Zagora → Ormenio. Not via Sofia. Not via Kulata–Promachonas.</div>
        ${ext(maps[1], 'btn btn-primary maps-btn', 'Directions in Google Maps')}
        ${stats(d2, 'Fees', eur2)}
        <div class="note"><strong>Fill to the brim in Bulgaria before Ormenio.</strong> Bulgaria is €1.66/L, Greece €2.19. A full 36 L tank bought in Bulgaria saves about €19.</div>
        ${feeLines(d2.lines)}
        ${cash(d2)}
        <div class="small muted">Fuel split: Romania 290 · Bulgaria 400 · Greece 110 km</div>
        <p class="bridge-note">Single-lane works on the Ruse bridge were scheduled 19–22 and 26–29 Oct 2026, daytime. If those dates apply, add border time.</p>
        ${sleepBtn('n2', 'Alexandroupoli')}
      </section>

      <section data-screen-label="Day 3">
        <div class="day-head">${dayNum(3)}<div><div class="eyebrow accent-2">Day 3 · the heavy day</div><h2>Alexandroupoli → Athens</h2></div></div>
        <div class="day-roads">Kavala → Thessaloniki → Athens, Greek A2 then A1. All of it in Greece.</div>
        ${ext(maps[2], 'btn btn-primary maps-btn', 'Directions in Google Maps')}
        ${stats(d3, 'Tolls', eur0)}
        <div class="note"><strong>One fuel stop, even if you entered full.</strong> Do it after roughly 400 km, Thessaloniki–Larissa, not in the first hour.</div>
        <div class="note warn"><strong>Wrist.</strong> Longest toll stretch, most expensive fuel, and a full motorway day on the right wrist. Ease off if it is sore.</div>
        <div class="cash" style="margin-top:var(--space-4)"><span>Day cash</span><strong>${eur0(d3.cash)}</strong></div>
        <button class="btn btn-secondary wide-btn" data-act="tolls" aria-expanded="${state.tollsOpen}"><span>17 toll stations · ${eur2(r.tollsLeft)} left to pay</span><span>${state.tollsOpen ? 'Hide' : 'Show'}</span></button>
        ${state.tollsOpen ? `<div>${tollGroups('inline')}<div class="small muted" style="margin-top:var(--space-4)">Car, 2026 prices checked 30 Sep 2026. Cash or card. Same price either direction.</div></div>` : ''}
        <div class="row arrive"><span>Arrive Athens</span><span class="muted">hotel not planned</span></div>
      </section>

      <div class="small muted" style="text-wrap:pretty">Prices indicative, October 2026 plan. Not a live booking or a live pump feed. Country km are planning splits for fuel pricing, not a surveyed odometer.</div>
    </div>`;
  }

  function routeView(r) {
    const c = state.cons;
    return `<div class="screen" data-screen-label="Route">
      <h2>Country rail</h2>
      <p class="prose">${Math.round(r.total.litres)} L over ${r.total.km.toLocaleString('en-GB')} km is about ${r.tanks.toFixed(1)} tanks. Leave full, budget four more fills, the last in Greece.</p>
      <div class="countries">${M.COUNTRIES.map(k => {
        const l = k.km * c / 100;
        return `<div>
          <div class="row-baseline"><h3>${esc(k.name)}</h3>${k.tag ? `<span class="${k.tagCls}">${esc(k.tag)}</span>` : ''}</div>
          <div class="cstats">
            <div><div class="k">km</div><strong>${k.km}</strong></div>
            <div><div class="k">€/L</div><strong>${k.price.toFixed(2)}</strong></div>
            <div><div class="k">litres</div><strong>${l.toFixed(1)}</strong></div>
            <div><div class="k">fuel</div><strong>${eur0(l * k.price)}</strong></div>
          </div>
          <div class="rail">${k.stops.map(s => `<div class="stop${s.night ? ' night' : s.border ? ' border' : ''}"><span class="dot"></span><span class="n">${esc(s.n)}</span><span class="note-txt">${esc(s.note)}</span></div>`).join('')}</div>
        </div>`;
      }).join('')}</div>
    </div>`;
  }

  function feesView(r) {
    const vig = M.vignettes(state);
    const bought = vig.filter(f => state.bought[f.id]).length;
    const fp = M.feePrices(state);
    return `<div class="screen" data-screen-label="Fees">
      <h2>Road fees</h2>
      <p class="prose">Car, one way. Bought before you roll. Plate-based, nothing on the glass. ${bought} of 4 bought.</p>
      <div class="fees">
        ${vig.map(f => {
          const b = !!state.bought[f.id];
          return `<div class="fee">
            <div class="fee-body">
              <div class="fee-title"><strong>${esc(f.country)}</strong><strong>${eur2(f.price)}</strong></div>
              <div class="fee-what">${esc(f.what)}</div>
              ${ext(f.url, 'fee-shop', 'Official shop: ' + f.shop)}
            </div>
            <button class="btn ${b ? 'btn-primary' : 'btn-secondary'} buy-btn" data-act="bought" data-arg="${f.id}" aria-pressed="${b}">${b ? 'Bought ✓' : 'Buy'}</button>
          </div>`;
        }).join('')}
        <div>
          <div class="fee-title"><strong>Giurgiu–Ruse bridge</strong><strong>${eur2(fp.bridge)}</strong></div>
          <div class="fee-what">Southbound. The Romanian car toll was repealed on 1 Oct 2026. The Bulgarian €2 is charged leaving Bulgaria, not on this direction.</div>
        </div>
        <div>
          <div class="fee-title"><strong>Greece</strong><strong>${eur2(M.GREEK_TOLLS)}</strong></div>
          <div class="fee-what">No vignette. 17 toll stations, cash or card. ${eur2(r.tollsLeft)} left to pay.</div>
        </div>
      </div>

      <h3 class="section-h">If plans change</h3>
      <div>${M.ADDERS.map(a => `<label class="check adder"><input type="checkbox" data-act="adder" data-arg="${a.key}"${state[a.key] ? ' checked' : ''}><span class="name">${esc(a.label)}</span><span class="price">${esc(a.delta)}</span></label>`).join('')}</div>
      <div class="fees-total"><span>Road fees</span><strong>${eur2(r.total.fees)}</strong></div>

      <h3 class="section-h">Greek booths</h3>
      ${tollGroups()}
      <p class="small muted" style="margin-top:var(--space-4)">Indicative, October 2026 plan.</p>
    </div>`;
  }

  function hotelsView() {
    return `<div class="screen nights" data-screen-label="Hotels">
      ${M.NIGHTS.map(n => `<div>
        <div class="eyebrow accent">${n.label}</div>
        <h2>${n.city}</h2>
        <div class="hotel-list">${M.HOTELS[n.key].map(h => {
          const sel = state.hotel[n.key] === h.id;
          const q = M.hotelQuery(h, n.key);
          return `<div class="card hotel${sel ? ' selected' : ''}">
            <button class="hotel-pick" data-act="hotel" data-arg="${n.key}:${h.id}" aria-pressed="${sel}">
              <div class="hotel-tags">${h.onRoute ? '<span class="tag tag-accent">On the route</span>' : ''}${sel ? '<span class="tag tag-neutral">Your pick</span>' : ''}</div>
              <div class="row-baseline"><span class="card-title">${esc(h.name)}</span><span class="hotel-price">${esc(h.price)}</span></div>
              <div class="facts">
                <span class="k">Stars</span><span>${esc(h.stars)}</span>
                <span class="k">Breakfast</span><span>${esc(h.breakfast)}</span>
                <span class="k">Parking</span><span>${esc(h.parking)}</span>
                <span class="k">Detour</span><span>${esc(h.detour)}</span>
              </div>
              ${h.extra ? `<div class="hotel-extra">${esc(h.extra)}</div>` : ''}
            </button>
            <div class="hotel-links">
              ${ext(M.bookingUrl(q), 'btn btn-secondary', 'Booking.com')}
              ${ext(M.mapUrl(q), 'btn btn-secondary', 'Map')}
            </div>
          </div>`;
        }).join('')}</div>
      </div>`).join('')}
      <p class="small muted">Guide prices per night, indicative, October 2026 plan. Not a live booking. Hotels are separate from the driving cost.</p>
    </div>`;
  }

  const VIEWS = { days: daysView, route: routeView, fees: feesView, hotels: hotelsView };

  // — render —

  function renderTotals(r) {
    $('t-cost').textContent = eur0(r.cost);
    $('t-km').textContent = r.total.km.toLocaleString('en-GB');
    $('t-litres').textContent = Math.round(r.total.litres);
    $('t-fuel').textContent = eur0(r.total.fuel);
    $('t-fees').textContent = eur0(r.total.fees);
    document.querySelectorAll('.js-speed').forEach(el => { el.textContent = state.speed; });
    document.querySelectorAll('.js-cons').forEach(el => { el.textContent = state.cons.toFixed(1); });
    $('range-km').textContent = r.rangeKm;
    if (+$('speed').value !== state.speed) $('speed').value = state.speed;
    if (+$('cons').value !== state.cons) $('cons').value = state.cons;
    $('adjust').hidden = !state.adjust;
    $('totals').classList.toggle('open', state.adjust);
    $('adjust-btn').textContent = state.adjust ? 'Done' : 'Adjust';
    $('adjust-btn').setAttribute('aria-expanded', state.adjust);
    $('presets').innerHTML = M.PRESETS.map(([p, label]) =>
      `<button class="btn ${Math.abs(state.cons - p) < 0.01 ? 'btn-primary' : 'btn-secondary'}" data-act="cons" data-arg="${p}"><span>${p.toFixed(1)}</span><span>${label}</span></button>`).join('');
  }

  function render() {
    // Re-rendered markup replaces the focused control; put focus back on its twin.
    const f = document.activeElement && document.activeElement.dataset;
    const refocus = f && f.act ? `[data-act="${f.act}"]${f.arg != null ? `[data-arg="${CSS.escape(f.arg)}"]` : ''}` : null;
    const r = M.compute(state);
    renderTotals(r);
    $('view').innerHTML = (VIEWS[state.tab] || daysView)(r);
    $('tabs').innerHTML = TABS.map(([id, label]) =>
      `<button class="btn" data-act="tab" data-arg="${id}"${state.tab === id ? ' aria-current="page"' : ''}>${label}</button>`).join('');
    if (refocus && !document.activeElement.dataset.act) {
      const el = document.querySelector(refocus);
      if (el) el.focus({ preventScroll: true });
    }
  }

  // — events —

  const ACTIONS = {
    tab: id => { set({ tab: id }); window.scrollTo(0, 0); },
    tolls: () => set({ tollsOpen: !state.tollsOpen }),
    cons: v => set({ cons: +v }),
    paid: name => set({ paid: { ...state.paid, [name]: !state.paid[name] } }),
    bought: id => set({ bought: { ...state.bought, [id]: !state.bought[id] } }),
    adder: k => set({ [k]: !state[k] }),
    hotel: arg => { const [k, id] = arg.split(':'); set({ hotel: { ...state.hotel, [k]: id } }); }
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('button[data-act]');
    if (el) ACTIONS[el.dataset.act](el.dataset.arg);
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('input[type=checkbox][data-act]');
    if (el) ACTIONS[el.dataset.act](el.dataset.arg);
  });
  $('adjust-btn').addEventListener('click', () => set({ adjust: !state.adjust }));
  $('speed').addEventListener('input', e => set({ speed: +e.target.value }));
  $('cons').addEventListener('input', e => set({ cons: Math.round(+e.target.value * 10) / 10 }));

  render();
})();
