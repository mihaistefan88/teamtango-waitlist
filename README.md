# TeamTango Waitlist

A landing page for TeamTango waitlist with email collection functionality.

## Features

- Modern, responsive design matching TeamTango brand
- Email collection with validation
- Node.js backend with Express
- Emails stored in JSON file
- Duplicate email prevention
- Social proof elements

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
http://localhost:3000
```

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

## Production Deployment

For production, consider:
1. Using a proper database (PostgreSQL, MongoDB, etc.)
2. Adding authentication for admin endpoints
3. Setting up proper environment variables
4. Adding rate limiting
5. Implementing email notifications
6. Adding HTTPS
7. Setting up proper logging