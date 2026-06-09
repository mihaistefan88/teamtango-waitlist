const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Behind nginx — trust the first proxy hop so req.ip is the real client
// (required for per-IP rate limiting; otherwise every request appears as 127.0.0.1)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(bodyParser.json());
// 301 *.html -> clean URLs (avoid duplicate-content URLs alongside canonicals)
app.use((req, res, next) => {
    if (req.method === 'GET' && req.path.endsWith('.html')) {
        const clean = req.path === '/index.html' ? '/' : req.path.slice(0, -5);
        return res.redirect(301, clean);
    }
    next();
});

// Only the public/ dir is web-served — keeps emails.json and server source private
// extensions: clean URLs (/roadmap -> roadmap.html)
// Assets cache for a year (filenames are stable, content changes with deploys are
// rare and tolerable); HTML/xml/txt revalidate so content updates show immediately
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html'],
    maxAge: '365d',
    immutable: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else if (/\.(xml|txt)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
}));

const waitlistLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }
});

// Path to store emails
const EMAILS_FILE = path.join(__dirname, 'emails.json');

// Initialize emails file if it doesn't exist
async function initEmailsFile() {
    try {
        await fs.access(EMAILS_FILE);
    } catch {
        await fs.writeFile(EMAILS_FILE, JSON.stringify([], null, 2));
    }
}

// Read emails from file
async function readEmails() {
    try {
        const data = await fs.readFile(EMAILS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading emails:', error);
        return [];
    }
}

// Write emails to file
async function writeEmails(emails) {
    try {
        await fs.writeFile(EMAILS_FILE, JSON.stringify(emails, null, 2));
    } catch (error) {
        console.error('Error writing emails:', error);
        throw error;
    }
}

// Normalize for duplicate detection: lowercase; for Gmail, dots and +suffixes
// are ignored by Google, so a.b+x@gmail.com === ab@gmail.com (the dotted-Gmail
// trick is how the 2025-2026 bot signups bypassed dedup)
function normalizeEmail(email) {
    let [local, domain] = email.toLowerCase().split('@');
    if (domain === 'googlemail.com') domain = 'gmail.com';
    if (domain === 'gmail.com') {
        local = local.split('+')[0].replace(/\./g, '');
    }
    return `${local}@${domain}`;
}

// API endpoint to submit email
app.post('/api/waitlist', waitlistLimiter, async (req, res) => {
    try {
        const { email, website } = req.body;

        // Honeypot: the "website" field is invisible to humans; bots fill it.
        // Reply with fake success so bots don't learn they were filtered.
        if (website) {
            return res.status(201).json({
                message: 'Successfully added to waitlist',
                success: true
            });
        }

        // Validate email
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Read existing emails
        const emails = await readEmails();

        // Check if email already exists (normalized comparison)
        const normalized = normalizeEmail(email);
        const existingEntry = emails.find(entry => normalizeEmail(entry.email) === normalized);
        if (existingEntry) {
            return res.status(200).json({
                message: 'Email already registered',
                alreadyExists: true
            });
        }

        // Add new email with timestamp
        const newEntry = {
            email,
            timestamp: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress
        };

        emails.push(newEntry);

        // Save to file
        await writeEmails(emails);

        res.status(201).json({
            message: 'Successfully added to waitlist',
            success: true
        });

    } catch (error) {
        console.error('Error processing waitlist submission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to get waitlist count (optional - for admin)
app.get('/api/waitlist/count', async (req, res) => {
    try {
        const emails = await readEmails();
        res.json({ count: emails.length });
    } catch (error) {
        console.error('Error getting count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to get all emails (optional - for admin, should be protected)
app.get('/api/waitlist/all', async (req, res) => {
    try {
        const emails = await readEmails();
        res.json({ emails });
    } catch (error) {
        console.error('Error getting emails:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Custom 404 (registered after static + API routes)
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Start server
async function startServer() {
    await initEmailsFile();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Emails will be stored in: ${EMAILS_FILE}`);
    });
}

startServer();