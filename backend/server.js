import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/ask-ai", async (req, res) => {
  try {
    const { prompt } = req.body;

    const completion = await groq.chat.completions.create({
  model: "openai/gpt-oss-20b",
  messages: [
    {
      role: "system",
      content: "You are a helpful AI that explains its reasoning clearly in steps, then gives a final answer."
    },
    {
      role: "user",
      content: `
                Question: ${prompt}

                Please respond in plain text using this style:

                Step 1: ...
                Step 2: ...
                Step 3: ...

                Final Answer: ...`
        }
      ],
      temperature: 0.3
    });

    const text = completion.choices[0].message.content;

    const reasoning = text.split("FINAL_ANSWER:")[0]
      .replace("REASONING:", "")
      .trim();

    const answer = text.split("FINAL_ANSWER:")[1]?.trim();

    res.json({
      reasoning: reasoning.split("\n").filter(Boolean),
      answer,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("AI error");
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
