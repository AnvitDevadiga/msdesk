import express from 'express';
import cors from 'cors';
import { Readable } from 'stream';

function stripThinkingContent(text) {
    if (typeof text !== 'string') return text;
    let result = text;
    result = result.replace(/<\?[\s\S]*?<\/think>/gi, '').trim();
    result = result.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
    result = result.replace(/```(?:thinking|reasoning)[\s\S]*?```/gi, '').trim();
    return result;
}

const app = express();
app.use(cors());
app.use((req, res, next) => {
    console.log(`[PROXY] ${req.method} ${req.url}`);
    next();
});
app.use(express.json({ limit: '50mb' }));

app.post(['/v1/chat/completions', '/chat/completions'], async (req, res) => {
    console.log("Intercepted chat completions request");
    
    const body = req.body;
    
    // Cap max_tokens: Qwen3 uses ~800-1000 tokens for internal thinking before responding.
    // Must be high enough for thinking + tool call JSON to fit in one response.
    // Groq Qwen models support up to 16384 completion tokens.
    // BUT free tier has 8000 TPM limit - cap lower to avoid rate limits.
    const MAX_TPM_SAFE = 7000; // Leave headroom for prompt tokens
    if (body.max_tokens && body.max_tokens > MAX_TPM_SAFE) {
        console.log(`Capping max_tokens from ${body.max_tokens} to ${MAX_TPM_SAFE} (TPM limit)`);
        body.max_tokens = MAX_TPM_SAFE;
    }

    // Strip reasoning_content AND inline thinking blocks from message history.
    // This prevents thinking tokens from accumulating in the prompt on every turn,
    // which would push us over the 8000 TPM limit.
    if (body.messages && Array.isArray(body.messages)) {
        let stripped = 0;
        body.messages = body.messages.map(msg => {
            if (msg.reasoning_content !== undefined) {
                delete msg.reasoning_content;
                stripped++;
            }
            if (typeof msg.content === 'string') {
                const original = msg.content;
                msg.content = stripThinkingContent(msg.content);
                if (msg.content !== original) stripped++;
            }
            // Also handle content as array (for multimodal)
            if (Array.isArray(msg.content)) {
                msg.content = msg.content.map(part => {
                    if (part.type === 'text' && typeof part.text === 'string') {
                        const originalText = part.text;
                        part.text = stripThinkingContent(part.text);
                        if (part.text !== originalText) stripped++;
                    }
                    return part;
                });
            }
            return msg;
        });
        if (stripped > 0) console.log(`Stripped thinking from ${stripped} messages.`);
    }

    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const authHeader = req.headers.authorization || `Bearer ${process.env.GROQ_API_KEY}`;

    try {
        let groqResponse = await fetch(groqUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(body)
        });

        // If we hit the 429 Rate Limit, intercept it, sleep for the required time, and retry transparently!
        // We use a while loop to ensure we keep sleeping if the retry fails again!
        while (groqResponse.status === 429) {
            const retryAfter = groqResponse.headers.get('retry-after') || '20';
            const waitSec = parseFloat(retryAfter);
            console.log(`[PROXY] Hit 429 Rate Limit. Automatically sleeping for ${waitSec} seconds to bypass limit...`);
            await new Promise(r => setTimeout(r, waitSec * 1000 + 500));
            console.log(`[PROXY] Waking up and retrying request...`);
            groqResponse = await fetch(groqUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(body)
            });
        }

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
app.get(['/v1/models', '/models'], async (req, res) => {
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