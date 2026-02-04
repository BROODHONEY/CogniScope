// ═══════════════════════════════════════════════════════════
// AI Reasoning Visualizer - Backend Server
// Node.js + Express + Groq API
// ═══════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Groq API Helper ──────────────────────────────────────
async function callGroqAPI(prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [{
      role: "system",
      content: `
      You are an AI reasoning assistant.

      DO NOT reveal private chain-of-thought.

      Instead provide a SHORT, HIGH-LEVEL reasoning summary.

      Respond ONLY in this JSON format:

      {
        "reasoning": ["step 1", "step 2", "step 3"],
        "answer": "final answer"
      }
      `
      },
      {
      role: "user",
      content: prompt
      }
      ],
      temperature: 0.3  // We'll process the full response
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error (${response.status}): ${error}`);
  }

  return await response.json();
}

// ─── Parse <think> tags ───────────────────────────────────
function parseReasoning(text) {
  try {
    const parsed = JSON.parse(text);
    return {
      reasoning: parsed.reasoning || [],
      answer: parsed.answer || text
    };
  } catch {
    return {
      reasoning: ["Model returned unstructured output"],
      answer: text
    };
  }
}



// ─── API Routes ───────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    groqConfigured: !!process.env.GROQ_API_KEY
  });
});

// Main reasoning endpoint
app.post('/ask-ai', async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validation
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Prompt is required and must be a string' 
      });
    }

    if (prompt.length > 5000) {
      return res.status(400).json({ 
        error: 'Prompt too long', 
        message: 'Maximum prompt length is 5000 characters' 
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'Server misconfiguration', 
        message: 'GROQ_API_KEY not set in environment' 
      });
    }

    console.log(`[${new Date().toISOString()}] Received prompt: "${prompt.substring(0, 50)}..."`);

    // Call Groq API
    const groqResponse = await callGroqAPI(prompt);
    const fullText = groqResponse.choices[0].message.content;

    // Parse reasoning and answer
    const { reasoning, answer } = parseReasoning(fullText);

    console.log(`[${new Date().toISOString()}] Parsed ${reasoning.length} reasoning steps`);

    // Return structured response
    res.json({
      reasoning,
      answer,
      model: groqResponse.model,
      usage: groqResponse.usage
    });

  } catch (error) {
    console.error('Error in /ask-ai:', error);

    // Send appropriate error response
    if (error.message.includes('Groq API')) {
      res.status(502).json({ 
        error: 'External API error', 
        message: error.message 
      });
    } else if (error.message.includes('fetch')) {
      res.status(503).json({ 
        error: 'Network error', 
        message: 'Could not connect to Groq API' 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }
});

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🧠 AI Reasoning Visualizer - Backend Server');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  🚀 Server running on http://localhost:${PORT}`);
  console.log(`  🔑 Groq API Key: ${process.env.GROQ_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log('═══════════════════════════════════════════════════════');
});

// ─── Graceful Shutdown ────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});