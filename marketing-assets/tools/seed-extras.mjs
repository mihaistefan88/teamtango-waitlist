const API = 'http://localhost:3099/api';
if (!API.includes('localhost:3099')) throw new Error('refusing: not the local screenshot API');

const tokens = {};
async function login(name) {
  if (tokens[name]) return tokens[name];
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: `${name}@teamtango.io`, password: 'password123' }),
  });
  const j = await r.json();
  if (!j.success) throw new Error(`login ${name}: ${JSON.stringify(j)}`);
  tokens[name] = j.data.token || j.data.accessToken;
  return tokens[name];
}
async function call(who, method, path, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${await login(who)}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let j; try { j = JSON.parse(text); } catch { j = text; }
  if (!r.ok) console.error(`${who} ${method} ${path} -> ${r.status}`, text.slice(0, 300));
  return j;
}
const at = (date, hm) => new Date(`${date}T${hm}:00`).toISOString();
const ids = { andrei: 1, radu: 2, elena: 3, vlad: 4, ioana: 5, tudor: 6, maria: 7, ana: 8 };

// Events
await call('ana', 'POST', '/events', {
  title: 'Friday demo day', location: 'Main room + Meet',
  description: 'Each team shows one thing they shipped this sprint. Five minutes, no slides.',
  startAt: at('2026-10-23', '15:00'), endAt: at('2026-10-23', '16:30'),
  attendeeIds: [2, 3, 4, 5, 6, 7, 1],
});
await call('maria', 'POST', '/events', {
  title: 'Autumn team dinner', location: 'Origo, Old Town',
  description: 'Company dinner to close Q3. Plus-ones welcome.',
  startAt: at('2026-10-29', '19:00'), endAt: at('2026-10-29', '22:30'),
  attendeeIds: [1, 2, 3, 4, 5, 6, 8],
});
await call('ioana', 'POST', '/events', {
  title: 'Design crit: onboarding v2', location: 'Design corner',
  startAt: at('2026-10-20', '11:00'), endAt: at('2026-10-20', '12:00'),
  attendeeIds: [6, 3, 8],
});
const events = await call('ana', 'GET', '/events');
const evList = events?.data?.events || events?.data || [];
for (const ev of Array.isArray(evList) ? evList : []) {
  for (const who of ['radu', 'elena', 'vlad', 'tudor', 'andrei']) {
    await call(who, 'POST', `/events/${ev.id}/rsvp`, { status: who === 'vlad' ? 'declined' : 'confirmed' });
  }
}

// Gift fund for Elena's anniversary (she can't see it)
const fund = await call('ana', 'POST', '/gift-funds', {
  recipientUserId: ids.elena, goalAmount: 300, currency: 'EUR',
  description: "Two years with us! Let's get Elena the espresso machine she keeps talking about.",
});
const fundId = fund?.data?.id || fund?.data?.giftFund?.id || fund?.data?.fund?.id;
for (const [who, amount, note] of [
  ['radu', 40, 'Best mentor on the team'], ['vlad', 30, null], ['ioana', 50, 'For the coffee runs'],
  ['tudor', 25, null], ['maria', 40, 'Happy anniversary!'], ['andrei', 50, null],
]) {
  if (fundId) await call(who, 'POST', `/gift-funds/${fundId}/contribute`, { amount, note });
}

// Time off
const req = async (who, type, startDate, endDate, reason) =>
  (await call(who, 'POST', '/timeoff', { type, startDate, endDate, reason }))?.data;
const toApprove = [
  await req('radu', 'vacation', '2026-10-26', '2026-10-30', 'Hiking in the Apuseni mountains'),
  await req('ioana', 'vacation', '2026-11-02', '2026-11-06', 'Lisbon'),
  await req('vlad', 'personal', '2026-10-19', '2026-10-19', 'Moving apartments'),
  await req('elena', 'sick', '2026-10-14', '2026-10-15', null),
];
await req('tudor', 'vacation', '2026-11-16', '2026-11-20', 'Family visit');
await req('maria', 'vacation', '2026-12-21', '2026-12-31', 'Winter holidays');
for (const r of toApprove) {
  const id = r?.id || r?.request?.id || r?.timeOffRequest?.id;
  if (id) await call('ana', 'PUT', `/timeoff/${id}/review`, { status: 'approved', reviewNotes: 'Enjoy!' });
}

// Active pulse answers
const cur = await call('ana', 'GET', '/pulse/current');
console.log('pulse current:', JSON.stringify(cur).slice(0, 400));

console.log('done', { fundId });
