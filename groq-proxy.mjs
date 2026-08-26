import express from 'express';
import cors from 'cors';
import { Readable } from 'stream';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/v1/chat/completions', async (req, res) => {
    console.log("Intercepted chat completions request");
    
    const body = req.body;
    
    // Strip reasoning_content from messages (Groq strictly rejects this OpenAI-incompatible field)
    if (body.messages && Array.isArray(body.messages)) {
        let stripped = 0;
        body.messages = body.messages.map(msg => {
            if (msg.reasoning_content !== undefined) {
                delete msg.reasoning_content;
                stripped++;
            }
            return msg;
        });
        if (stripped > 0) {
            console.log(`Stripped reasoning_content from ${stripped} messages.`);
        }
    }

    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const authHeader = req.headers.authorization || `Bearer ${process.env.GROQ_API_KEY}`;

    try {
        const groqResponse = await fetch(groqUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(body)
        });

        // Forward status
        res.status(groqResponse.status);
        
        // Forward headers (strip encoding to avoid issues)
        groqResponse.headers.forEach((val, key) => {
            if (key.toLowerCase() !== 'content-encoding') {
                res.setHeader(key, val);
            }
        });

        // Forward body
        if (groqResponse.body) {
            Readable.fromWeb(groqResponse.body).pipe(res);
        } else {
            const text = await groqResponse.text();
            res.send(text);
        }
    } catch (err) {
        console.error("Proxy error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Fallback for models list endpoint so TrueForge can list models
app.get('/v1/models', async (req, res) => {
    const authHeader = req.headers.authorization || `Bearer ${process.env.GROQ_API_KEY}`;
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': authHeader }
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const port = process.env.PROXY_PORT || 3002;
app.listen(port, () => {
    console.log(`Groq Anti-Reject Proxy running on http://localhost:${port}/v1`);
});
