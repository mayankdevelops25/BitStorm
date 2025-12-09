// server.js - Run with Node 18+
// npm init -y
// npm install express cors dotenv
// set A4F_API_KEY in .env (never commit)

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // enable CORS for dev; tighten in production
app.use(express.json({ limit: '1mb' }));

const A4F_KEY = process.env.A4F_API_KEY;
if (!A4F_KEY) {
  console.warn('Warning: A4F_API_KEY not set in environment variables.');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // Build payload for A4F
    const payload = {
      model: "provider-1/chatgpt-4o-latest",
      messages: [
        { role: "system", content: "You are a helpful assistant providing travel plans." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    };

    // Use global fetch (Node 18+). If you're using older Node, install node-fetch and import accordingly.
    const response = await fetch('https://api.a4f.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${A4F_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error('Upstream error', response.status, bodyText);
      return res.status(502).json({ error: 'Upstream error', detail: bodyText });
    }

    const json = await response.json();

    // Try to extract assistant text robustly
    const aiText = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text ?? JSON.stringify(json);

    // Return safe JSON to client
    return res.json({ text: aiText, raw: json });

  } catch (err) {
    console.error('Server error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy listening on port ${port}`));
