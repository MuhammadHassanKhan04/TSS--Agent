# TSS Agent - The Student Space AI Management System

A complete WhatsApp-integrated student management system for The Student Space Institute.

---

## Prerequisites

Before running, make sure you have installed:
- Node.js v18 or above: https://nodejs.org
- Google Chrome (required by Puppeteer for fee slip generation)
- A WhatsApp account for the bot

---

## Quick Setup (Fresh Install)

### Step 1 - Clone or Download

```
git clone https://github.com/MuhammadHassanKhan04/TSS--Agent.git
cd TSS--Agent
```

### Step 2 - Create .env File

Create a file named .env in the root folder:

```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=production
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

### Step 3 - Install and Build (Run ONE TIME only)

```
npm run setup
```

This will install all dependencies and build the React frontend.

### Step 4 - Start the Server

```
npm run dev
```

NOTE: If you skip Step 3, the server auto-builds frontend on first run (takes 1-2 min).

---

## Open the App

Once server starts, open: http://localhost:5000

---

## WhatsApp Connection

1. A QR code will appear in the terminal
2. Open WhatsApp on phone > Linked Devices > Link a Device
3. Scan the QR code
4. Wait for: WhatsApp Web Client is ready and connected.

---

## Common Issues

| Error | Solution |
|-------|----------|
| ENOENT: no such file client/dist/index.html | Run: npm run setup |
| Cannot find module | Run: npm install |
| WhatsApp QR not appearing | Make sure Chrome is installed |
| Port already in use | Change PORT in .env file |
