const puppeteer = require('/home/mihai/projects/valet/azarix/node_modules/puppeteer-core');

const BASE = 'http://localhost:5181';
const OUT = process.argv[2];
const pages = (process.argv[3] || 'dashboard,people,planner,insights,team-pulse,events,automations,integrations,settings').split(',');
const who = process.argv[4] || 'ana';
const width = Number(process.argv[5] || 1440);
const height = Number(process.argv[6] || 900);
const suffix = process.argv[7] || '';

(async () => {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: `${who}@teamtango.io`, password: 'password123' }),
  });
  const { data } = await r.json();

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--hide-scrollbars', '--force-device-scale-factor=2'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: width < 600, hasTouch: width < 600 });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate((t, u) => {
    localStorage.setItem('auth_token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, data.token, data.user);

  for (const spec of pages) {
    const [p, action] = spec.split(':');
    await page.goto(`${BASE}/${p}`, { waitUntil: 'networkidle0' });
    await new Promise((res) => setTimeout(res, 1500));
    if (action?.startsWith('scroll')) {
      await page.evaluate((y) => {
        const el = [...document.querySelectorAll('.overflow-y-auto')]
          .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
        (el || document.scrollingElement).scrollTop = y;
      }, Number(action.slice(6)));
    } else if (action?.startsWith('click')) {
      const text = action.slice(5).replace(/_/g, ' ');
      await page.evaluate((t) => {
        const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => b.textContent.trim().startsWith(t));
        if (el) el.click();
      }, text);
    }
    if (action) await new Promise((res) => setTimeout(res, 1500));
    const file = `${OUT}/${spec.replace(/\W+/g, '-')}${suffix}.png`;
    if (action?.startsWith('card')) {
      const text = action.slice(4).replace(/_/g, ' ');
      const handle = await page.evaluateHandle((t) => {
        const hit = [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')]
          .filter((e) => e.textContent.includes(t)).pop();
        let el = hit;
        const isCard = (e) => {
          const cs = getComputedStyle(e);
          return parseFloat(cs.borderTopLeftRadius) >= 12 && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && e.offsetWidth > 300;
        };
        while (el && !isCard(el)) el = el.parentElement;
        el?.scrollIntoView({ block: 'center' });
        return el;
      }, text);
      await new Promise((res) => setTimeout(res, 800));
      if (handle.asElement()) { await handle.asElement().screenshot({ path: file }); console.log(file); }
      else console.error('no card for', text);
      continue;
    }
    await page.screenshot({ path: file });
    console.log(file, page.url());
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
