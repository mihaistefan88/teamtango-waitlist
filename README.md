# TeamTango Waitlist

Marketing landing page for TeamTango (https://teamtango.io) with email waitlist collection.

## Structure

```
teamtango-waitlist/
├── server.js            # Express 5 server — API + static serving of public/
├── public/              # Everything web-served lives here (and ONLY here)
│   ├── index.html       # The landing page (feed-style layout, app design system)
│   ├── robots.txt       # All crawlers + AI bots explicitly allowed
│   ├── sitemap.xml
│   ├── llms.txt         # AI answer-engine summary of the product
│   ├── og-image.png     # 1200x630 social card (generated from logo)
│   ├── favicon-*.png, apple-touch-icon.png, favicon.ico
│   └── teamtango-logo.png
├── teamtango-logo.png   # Source asset (400x400) for regenerating icons
├── emails.json          # Collected emails — NOT web-accessible (outside public/)
└── deploy.sh            # rsync to nexus.webarch.ro + pm2 restart
```

`emails.json`, `server.js`, and `package.json` are intentionally outside the
static root — only `public/` is served.

## Design

The page mirrors the main app's design system (see
`teamtango/frontend/src/assets/css/main.css`): Inter, custom slate palette,
orange-400 `#fba468` primary, 20px radii, solid white shadowless cards on the
`#f8fcff → #edf3fa` gradient. Layout is feed-style storytelling — features are
presented as Team Wall post cards. Font Awesome icons only, no emoji glyphs.

## SEO / AI search

- Canonical domain is **https://teamtango.io** (NOT teamtango.com — that's someone else's)
- JSON-LD `@graph`: Organization, WebSite, SoftwareApplication, FAQPage (5 Q&As, mirrored by the visible FAQ section)
- `robots.txt` explicitly allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, …) and disallows `/api/`
- `llms.txt` gives answer engines a structured product summary
- OG/Twitter cards point at the generated `og-image.png`

Regenerate icons/OG image from the source logo with ImageMagick:

```bash
magick teamtango-logo.png -resize 32x32 public/favicon-32x32.png   # etc.
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser to:
```
http://localhost:3001
```

(Default port is 3001 — set `PORT` to override. The main TeamTango dev backend occupies 3000.)

## API Endpoints

### POST /api/waitlist
Submit an email to the waitlist
- Body: `{ "email": "user@example.com" }`
- Returns: `{ "success": true, "message": "Successfully added to waitlist" }`

### GET /api/waitlist/count
Get the total number of waitlist signups
- Returns: `{ "count": 123 }`

### GET /api/waitlist/all
Get all waitlist emails (should be protected in production)
- Returns: `{ "emails": [...] }`

## Storage

Emails are stored in `emails.json` with the following structure:
```json
[
  {
    "email": "user@example.com",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "ip": "127.0.0.1"
  }
]
```

## Deployment

```bash
./deploy.sh
```

Rsyncs to `root@nexus.webarch.ro:/var/www/teamtango-waitlist` (excludes
`emails.json`, `node_modules`, `.git`) and restarts via pm2. Served at
https://teamtango.io behind nginx.

## Bot protection (added 2026-06-10)

- Honeypot `website` field — hidden off-screen; if filled, the server returns
  fake success and stores nothing
- `express-rate-limit`: 5 POSTs/hour per IP (`trust proxy 1` for nginx)
- Duplicate check normalizes Gmail addresses (dots and `+suffix` stripped) —
  the dotted-Gmail trick produced ~25 bot "signups" in 2025–2026
- History: 38 of the first 40 signups were bots; purged 2026-06-10
  (backup: `emails.json.bak-20260610` on the server)

## Remaining production TODOs

1. Protect `GET /api/waitlist/all` (and `/count`) with auth
2. Consider a proper database if volume grows
3. Email notifications on signup
