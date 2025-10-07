const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

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

// API endpoint to submit email
app.post('/api/waitlist', async (req, res) => {
    try {
        const { email } = req.body;

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

        // Check if email already exists
        const existingEntry = emails.find(entry => entry.email === email);
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

// Start server
async function startServer() {
    await initEmailsFile();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Emails will be stored in: ${EMAILS_FILE}`);
    });
}

startServer();