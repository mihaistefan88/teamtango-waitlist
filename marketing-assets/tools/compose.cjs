const fs = require('fs');
const path = require('path');
const puppeteer = require('/home/mihai/projects/valet/azarix/node_modules/puppeteer-core');

const ROOT = path.join(__dirname, 'final');
const OUT = path.join(ROOT, 'visuals');
fs.mkdirSync(OUT, { recursive: true });
const img = (p) => `file://${path.join(ROOT, p)}`;

const base = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${w}px; height: ${h}px; overflow: hidden; }
  body { font-family: Inter, system-ui, sans-serif; color: #0f172a; position: relative;
    background: radial-gradient(circle at 85% 10%, #ffe3cf 0, transparent 38%),
                radial-gradient(circle at 5% 95%, #ffeede 0, transparent 35%),
                linear-gradient(160deg, #f8fcff, #edf3fa); }
  .abs { position: absolute; }
  .browser { background: #fff; border-radius: 18px; overflow: hidden;
    box-shadow: 0 40px 80px -30px rgba(15,23,42,.35), 0 0 0 1px rgba(15,23,42,.06); }
  .browser .bar { height: 38px; background: #f1f5f9; display: flex; align-items: center; gap: 7px; padding: 0 16px; }
  .browser .bar i { width: 11px; height: 11px; border-radius: 50%; background: #e2e8f0; display: block; }
  .browser .bar .url { margin-left: 18px; flex: 1; max-width: 360px; height: 22px; border-radius: 11px; background: #fff;
    font-size: 12px; color: #64748b; display: flex; align-items: center; padding-left: 12px; }
  .browser img, .phone img, .card img { display: block; width: 100%; }
  .phone { background: #0f172a; padding: 10px; border-radius: 46px;
    box-shadow: 0 40px 70px -25px rgba(15,23,42,.5); }
  .phone .screen { border-radius: 37px; overflow: hidden; background: #fff; }
  .card { border-radius: 22px; overflow: hidden; background: #fff;
    box-shadow: 0 30px 60px -28px rgba(15,23,42,.35), 0 0 0 1px rgba(15,23,42,.05); }
  .crop { overflow: hidden; }
  .eyebrow { font-size: 15px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #f97316; }
  h1 { font-size: 64px; line-height: 1.04; font-weight: 800; letter-spacing: -0.03em; }
  h2 { font-size: 46px; line-height: 1.08; font-weight: 800; letter-spacing: -0.025em; }
  p.lead { font-size: 21px; line-height: 1.5; color: #475569; }
  .logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 22px; }
  .logo img { width: 34px; }
</style></head><body>${body}</body></html>`;

const browser = (src, url = 'app.teamtango.io') =>
  `<div class="bar"><i></i><i></i><i></i><div class="url">${url}</div></div><img src="${img(src)}">`;

const VISUALS = {
  // Product hero: desktop wall + phone
  'hero-app': [1600, 1000, `
    <div class="abs browser crop" style="left:70px; top:50px; width:1240px; height:860px;">
      ${browser('raw/dashboard.png')}
    </div>
    <div class="abs phone" style="left:1180px; top:250px; width:330px;">
      <div class="screen"><img src="${img('raw/team-pulse-mobile.png')}"></div>
    </div>`],

  // Recognition: kudos + celebration + gift fund
  'feature-recognition': [1400, 1000, `
    <div class="abs" style="left:80px; top:90px; width:520px;">
      <div class="eyebrow">Recognition</div>
      <h2 style="margin-top:14px">Kudos that don't scroll away.</h2>
      <p class="lead" style="margin-top:20px">Thank someone in a sentence. It stays on the team wall,
        counts toward Insights, and lands in Slack, Teams or Mattermost too.</p>
    </div>
    <div class="abs card" style="left:80px; top:470px; width:760px;"><img src="${img('cards/dashboard-cardfor_staying_on_the_call.png')}"></div>
    <div class="abs card" style="left:180px; top:720px; width:760px;"><img src="${img('cards/dashboard-cardThree_years_of.png')}"></div>
    <div class="abs card crop" style="left:960px; top:150px; width:360px; height:352px;">
      <img src="${img('cards/dashboard-cardespresso_machine.png')}" style="margin-top:-778px">
    </div>
    <div class="abs" style="left:980px; top:540px; width:330px; font-size:17px; line-height:1.5; color:#475569;">
      <strong style="color:#0f172a">Gift funds</strong> for birthdays and anniversaries, hidden from the person they're for.
    </div>`],

  // Pulse: heartbeat + this week's question
  'feature-pulse': [1400, 880, `
    <div class="abs" style="left:80px; top:90px; width:560px;">
      <div class="eyebrow">Team Pulse</div>
      <h2 style="margin-top:14px">Know how the team is really doing.</h2>
      <p class="lead" style="margin-top:20px">One anonymous question a week, three taps to answer.
        Energy, connection and impact, trended over time.</p>
    </div>
    <div class="abs card" style="left:500px; top:300px; width:840px;"><img src="${img('cards/team-pulse-cardTeam_heartbeat.png')}"></div>
    <div class="abs card" style="left:80px; top:560px; width:600px;"><img src="${img('cards/dashboard-cardThis_week.png')}"></div>`],

  // Time off: team wallchart
  'feature-time-off': [1400, 900, `
    <div class="abs" style="left:80px; top:80px; width:900px;">
      <div class="eyebrow">Time off</div>
      <h2 style="margin-top:14px">Who's out, at a glance.</h2>
      <p class="lead" style="margin-top:16px">Requests, approvals and balances, with public holidays per country built in.</p>
    </div>
    <div class="abs browser crop" style="left:80px; top:250px; width:1240px; height:600px;">
      ${browser('raw/planner-clickTeam_Calendar.png', 'app.teamtango.io/planner')}
    </div>`],

  // Insights
  'feature-insights': [1400, 1000, `
    <div class="abs" style="left:80px; top:90px; width:520px;">
      <div class="eyebrow">Insights</div>
      <h2 style="margin-top:14px">See engagement, not just activity.</h2>
      <p class="lead" style="margin-top:20px">Who's being recognised, how the team reacts, and when people post. No spreadsheets.</p>
    </div>
    <div class="abs card" style="left:640px; top:80px; width:680px;"><img src="${img('cards/insights-cardReaction_Breakdown.png')}"></div>
    <div class="abs card" style="left:80px; top:500px; width:900px;"><img src="${img('cards/insights-cardTop_Contributors.png')}"></div>`],

  // Social card
  'og-image': [1200, 630, `
    <div class="abs logo" style="left:64px; top:60px;"><img src="file:///home/mihai/projects/valet/teamtango-waitlist/public/teamtango-logo.png">TeamTango</div>
    <div class="abs" style="left:64px; top:170px; width:470px;">
      <h1 style="font-size:52px">Recognition that doesn't scroll away.</h1>
      <p class="lead" style="margin-top:22px; font-size:20px">Kudos, celebrations, pulse and time off for small teams.</p>
    </div>
    <div class="abs browser" style="left:590px; top:90px; width:820px;">${browser('raw/dashboard.png')}</div>`],
};

(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome-stable', headless: 'new', args: ['--allow-file-access-from-files'] });
  const page = await b.newPage();
  for (const [name, [w, h, body]] of Object.entries(VISUALS)) {
    if (process.argv[2] && process.argv[2] !== name) continue;
    // Only the social card keeps the gradient: platforms render transparency as black
    const transparent = name !== 'og-image';
    const file = path.join(OUT, `${name}.html`);
    fs.writeFileSync(file, base(w, h, transparent
      ? `<style>html, body { background: transparent !important; }</style>${body}`
      : body));
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.goto(`file://${file}`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), omitBackground: transparent });
    console.log(name);
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
