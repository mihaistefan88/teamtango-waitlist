// Richer demo data for marketing screenshots. Local throwaway DB only.
const B = '/home/mihai/projects/valet/teamtango/backend';
const postgres = require(`${B}/node_modules/postgres`);
const { scoreResponse } = require(`${B}/src/services/pulse-bank`);

const sql = postgres('postgresql://teamtango_user:local@127.0.0.1:54398/teamtango_db', { max: 2 });
const WS = 1;

let s = 4242;
const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
const pick = (a) => a[Math.floor(rand() * a.length)];
const shuffle = (a) => [...a].sort(() => rand() - 0.5);
const ago = (days, hour) => { const d = new Date(); d.setDate(d.getDate() - days); d.setHours(hour, Math.floor(rand() * 59), 0, 0); return d; };

const NEW_DEPTS = {
  Sales: { color: '#0ea5e9', teams: ['Enterprise', 'SMB'] },
  Marketing: { color: '#8b5cf6', teams: ['Growth'] },
  'Customer Success': { color: '#14b8a6', teams: ['Support'] },
  People: { color: '#f43f5e', teams: [] },
};
const NEW_PEOPLE = [
  ['Mihnea Barbu', 'Sales', 'Enterprise', 'Account Executive'],
  ['Andreea Stoica', 'Sales', 'Enterprise', 'Head of Sales'],
  ['Cristian Lungu', 'Sales', 'SMB', 'Sales Development Rep'],
  ['Bianca Matei', 'Sales', 'SMB', 'Account Executive'],
  ['Diana Petrescu', 'Marketing', 'Growth', 'Marketing Lead'],
  ['Sorin Neagu', 'Marketing', 'Growth', 'Content Strategist'],
  ['Laura Enache', 'Marketing', 'Growth', 'Product Marketer'],
  ['Paul Ilie', 'Customer Success', 'Support', 'Support Engineer'],
  ['Irina Toma', 'Customer Success', 'Support', 'CS Manager'],
  ['George Munteanu', 'Customer Success', 'Support', 'Onboarding Specialist'],
  ['Alexandra Dinu', 'People', null, 'People Partner'],
  ['Victor Zamfir', 'Engineering', 'Platform', 'Staff Engineer'],
  ['Oana Mihai', 'Engineering', 'Mobile', 'iOS Engineer'],
  ['Stefan Costea', 'Engineering', 'Platform', 'DevOps Engineer'],
  ['Carmen Badea', 'Design', 'Brand', 'Product Designer'],
  ['Robert Florea', 'Operations', null, 'Finance Manager'],
];
const TITLES = {
  'ana@teamtango.io': 'Engineering Manager', 'radu@teamtango.io': 'Backend Engineer',
  'elena@teamtango.io': 'Senior Mobile Engineer', 'vlad@teamtango.io': 'Android Engineer',
  'ioana@teamtango.io': 'Design Lead', 'tudor@teamtango.io': 'Brand Designer',
  'maria@teamtango.io': 'Operations Manager', 'andrei@teamtango.io': 'CEO',
};

(async () => {
  const [{ password }] = await sql`select password from users where email = 'ana@teamtango.io'`;
  for (const [email, title] of Object.entries(TITLES)) await sql`update users set job_title = ${title} where email = ${email}`;

  const deptId = {};
  const teamId = {};
  for (const r of await sql`select id, name from departments where workspace_id = ${WS}`) deptId[r.name] = r.id;
  for (const r of await sql`select t.id, t.name from teams t join departments d on d.id = t.department_id where d.workspace_id = ${WS}`) teamId[r.name] = r.id;
  for (const [name, conf] of Object.entries(NEW_DEPTS)) {
    if (!deptId[name]) [{ id: deptId[name] }] = await sql`insert into departments (workspace_id, name, color) values (${WS}, ${name}, ${conf.color}) returning id`;
    for (const t of conf.teams) {
      if (!teamId[t]) [{ id: teamId[t] }] = await sql`insert into teams (department_id, workspace_id, name) values (${deptId[name]}, ${WS}, ${t}) returning id`;
    }
  }

  for (const [name, dept, team, title] of NEW_PEOPLE) {
    const email = `${name.split(' ')[0].toLowerCase()}@teamtango.io`;
    const [existing] = await sql`select id from users where email = ${email}`;
    if (existing) continue;
    const [{ id }] = await sql`insert into users (name, email, password, onboarding_completed, current_workspace_id, department_id, job_title, hire_date)
      values (${name}, ${email}, ${password}, true, ${WS}, ${deptId[dept]}, ${title}, ${ago(Math.floor(rand() * 900) + 60, 9)}) returning id`;
    await sql`insert into workspace_user (workspace_id, user_id, role) values (${WS}, ${id}, 'member')`;
    if (team) await sql`insert into team_members (team_id, user_id) values (${teamId[team]}, ${id})`;
  }

  const users = await sql`select u.id, u.name from users u join workspace_user wu on wu.user_id = u.id where wu.workspace_id = ${WS}`;
  const ids = users.map((u) => Number(u.id));
  const byFirst = Object.fromEntries(users.map((u) => [u.name.split(' ')[0].toLowerCase(), u]));
  const types = Object.fromEntries((await sql`select id, slug from post_types`).map((t) => [t.slug, t.id]));

  const POSTS = [
    ['kudos', '@{andreea} closed the Northwind renewal two weeks early — and upsold them to the annual plan. Legend.'],
    ['highlight', 'Q3 pipeline review done: we are at 112% of target with two weeks to spare.'],
    ['kudos', 'Massive thanks to @{paul} for staying on the call with a customer until their import worked. They tweeted about it.'],
    ['celebrate', 'Happy 3rd work anniversary @{victor}! Three years of keeping the platform boring in the best way.'],
    ['highlight', 'The new help center is live. 40 articles, searchable, and the first tickets are already deflecting.'],
    ['kudos', '@{diana} and @{sorin} shipped the autumn campaign in four days. Open rate 48%.'],
    ['celebrate', 'Welcome @{carmen} to the Design team! First week, first Figma file already looking sharp.'],
    ['highlight', 'Zero-downtime deploys are now the default. Thanks to everyone who tested the rollout.'],
    ['lowlight', 'Status page went down during the incident because it lived on the same cluster. Moving it off this week.'],
    ['kudos', 'Shoutout to @{irina} for turning a churn-risk account into our best case study.'],
    ['celebrate', 'Birthday today for @{laura}! Cake at 4 in the kitchen.'],
    ['highlight', 'iOS 3.2 is out with offline mode. App Store rating back up to 4.8.'],
    ['kudos', '@{stefan} cut our CI time from 18 to 6 minutes. Every engineer just got 12 minutes back per push.'],
    ['highlight', 'We hit 50 NPS this quarter for the first time.'],
    ['kudos', 'Thank you @{alexandra} for organising the offsite — the best two days we have had as a team.'],
    ['celebrate', 'One year with us @{cristian}! Top SDR three months running.'],
    ['lowlight', 'We missed the SOC 2 evidence deadline by a week. New owner and a checklist are in place.'],
    ['kudos', '@{george} rebuilt the onboarding checklist from scratch. Time-to-first-value is down to two days.'],
    ['highlight', 'Partnership with Stripe Atlas signed. Co-marketing kicks off in November.'],
    ['kudos', 'Kudos to @{oana} for the accessibility pass on the mobile app. VoiceOver users noticed.'],
    ['highlight', 'Finance close for September done in 3 days, down from 8. Thanks @{robert}.'],
    ['celebrate', 'We just signed our 100th customer.'],
    ['kudos', '@{bianca} booked 14 demos this week. That is a team record.'],
    ['highlight', 'Design system v2 is published. Every component now has dark mode and docs.'],
  ];
  const COMMENTS = ['Huge!', 'Well deserved.', 'This is great news.', 'Love this team.', 'Congrats!!', 'Thanks for sharing the details.',
    'Adding this to the monthly wins.', 'So proud of this one.', 'Let us celebrate on Friday.', 'Amazing work.', 'What a week.', 'Respect.'];
  const KINDS = ['heart', 'heart', 'heart', 'like', 'like', 'funny'];

  await sql`delete from posts where 'rich-seed' = any(tags)`;
  let n = 0;
  for (const [slug, text] of POSTS) {
    const mentioned = [];
    const body = text.replace(/@\{(\w+)\}/g, (_, k) => {
      const u = byFirst[k];
      mentioned.push({ id: String(u.id), name: u.name });
      return `@[id:${u.id}|${u.name}]`;
    });
    const metadata = {};
    if (slug === 'kudos') metadata.recipients = mentioned;
    if (slug === 'celebrate' && mentioned.length) metadata.celebrants = mentioned;
    const author = slug === 'celebrate' && rand() < 0.5 ? Number(byFirst.alexandra.id) : pick(ids.filter((i) => !mentioned.some((m) => Number(m.id) === i)));
    const reactions = {};
    for (const r of shuffle(ids).slice(0, 6 + Math.floor(rand() * 14))) {
      const k = slug === 'lowlight' ? pick(['sad', 'like']) : pick(KINDS);
      reactions[k] = reactions[k] || { count: 0, users: [] };
      reactions[k].count += 1; reactions[k].users.push(r);
    }
    const createdAt = ago(Math.floor(n / 2.2), 9 + Math.floor(rand() * 8));
    const [p] = await sql`insert into posts (workspace_id, user_id, type_id, body, tags, metadata, reactions, created_at, updated_at)
      values (${WS}, ${author}, ${types[slug]}, ${body}, ${['rich-seed']}, ${sql.json(metadata)}, ${sql.json(reactions)}, ${createdAt}, ${createdAt}) returning id`;
    for (let c = 0; c < Math.floor(rand() * 5); c += 1) {
      const at = new Date(createdAt.getTime() + (c + 1) * 25 * 60000);
      await sql`insert into comments (post_id, user_id, body, created_at, updated_at) values (${p.id}, ${pick(ids)}, ${pick(COMMENTS)}, ${at}, ${at})`;
    }
    n += 1;
  }
  await sql`update posts set tags = '{}' where 'rich-seed' = any(tags)`;

  // Gift fund: more contributors
  const [fund] = await sql`select id from gift_funds where workspace_id = ${WS} limit 1`;
  if (fund) {
    const have = new Set((await sql`select user_id from gift_fund_contributions where gift_fund_id = ${fund.id}`).map((r) => Number(r.user_id)));
    for (const uid of shuffle(ids).filter((i) => !have.has(i) && i !== Number(byFirst.elena.id)).slice(0, 8)) {
      await sql`insert into gift_fund_contributions (gift_fund_id, user_id, amount, currency) values (${fund.id}, ${uid}, ${pick([10, 15, 20, 25])}, 'EUR')`;
    }
  }

  // Events: everyone RSVPs
  for (const ev of await sql`select id from events where workspace_id = ${WS}`) {
    const have = new Set((await sql`select user_id from event_attendees where event_id = ${ev.id}`).map((r) => Number(r.user_id)));
    for (const uid of shuffle(ids).filter((i) => !have.has(i)).slice(0, 10)) {
      await sql`insert into event_attendees (event_id, user_id, status) values (${ev.id}, ${uid}, ${rand() < 0.85 ? 'confirmed' : 'pending'})`;
    }
  }

  // Time off spread across the month
  const OFF = [['mihnea', 'vacation', '2026-10-05', '2026-10-09'], ['diana', 'vacation', '2026-10-19', '2026-10-23'],
    ['paul', 'personal', '2026-10-22', '2026-10-22'], ['victor', 'vacation', '2026-10-12', '2026-10-14'],
    ['carmen', 'vacation', '2026-10-27', '2026-10-30'], ['robert', 'sick', '2026-10-07', '2026-10-08'],
    ['tudor', 'vacation', '2026-10-01', '2026-10-02'], ['irina', 'vacation', '2026-10-28', '2026-10-30'],
    ['ioana', 'personal', '2026-10-09', '2026-10-09']];
  for (const [who, type, from, to] of OFF) {
    const uid = byFirst[who].id;
    const [dup] = await sql`select id from time_off_requests where user_id = ${uid} and start_date = ${from}`;
    const days = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
    if (!dup) await sql`insert into time_off_requests (workspace_id, user_id, type, start_date, end_date, days_count, status, reviewed_by, reviewed_at)
      values (${WS}, ${uid}, ${type}, ${from}, ${to}, ${days}, 'approved', ${byFirst.ana.id}, now())`;
  }

  // Pulse: new people answer past and current questions
  for (const q of await sql`select * from pulse_questions where workspace_id = ${WS}`) {
    const have = new Set((await sql`select user_id from pulse_responses where question_id = ${q.id}`).map((r) => Number(r.user_id)));
    for (const uid of ids.filter((i) => !have.has(i) && rand() < 0.8)) {
      const value = q.type === 'scale' ? { choice: pick([2, 3, 3, 4, 4]) }
        : q.type === 'binary' ? { choice: rand() < 0.7 ? 'a' : 'b' }
        : q.type === 'slider' ? { value: Math.round(rand() * 45) / 100 } : { word: 'good' };
      const score = scoreResponse({ type: q.type, options: q.options, dimension: q.dimension }, value);
      const at = q.activated_at ? new Date(new Date(q.activated_at).getTime() + 3600000 * (2 + Math.floor(rand() * 40))) : new Date();
      await sql`insert into pulse_responses (question_id, user_id, value, score, created_at) values (${q.id}, ${uid}, ${sql.json(value)}, ${score === null ? null : String(score)}, ${at > new Date() ? new Date() : at})`;
    }
  }

  const [c] = await sql`select (select count(*) from workspace_user where workspace_id=${WS}) people, (select count(*) from posts) posts, (select count(*) from comments) comments, (select coalesce(sum(amount),0) from gift_fund_contributions) fund, (select count(*) from time_off_requests where status='approved') off, (select count(*) from pulse_responses) pulse`;
  console.log(c);
  await sql.end();
})().catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });
