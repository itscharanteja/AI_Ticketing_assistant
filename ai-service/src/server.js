import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(cors());
app.use(express.json());

if (!process.env.PERPLEXITY_API_KEY) {
  console.error("PERPLEXITY_API_KEY environment variable is not set");
  process.exit(1);
}

// Initialize OpenAI client with Perplexity's API
const model = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Simple knowledge base
const knowledgeBase = [
  "To reset your password, visit the login page and click 'Forgot Password'",
  "For network connectivity issues, try restarting your router first",
  "To request new hardware, submit a ticket with your manager's approval",
];
console.log("Knowledge base initialized successfully");

// Process ticket endpoint
app.post("/process-ticket", async (req, res) => {
  try {
    const { title, description } = req.body;

    // Generate response using Ollama
    const prompt = `Here is our knowledge base:
${knowledgeBase.join("\n")}

Please help with this support ticket:
Title: ${title}
Description: ${description}

Provide a helpful response based on our knowledge base. If you can't find relevant information, suggest escalating to human support.`;

    const response = await model.chat.completions.create({
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful IT support assistant. Use the knowledge base to help answer questions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const aiResponse = response.choices[0].message.content;

    res.json({
      ai_response: aiResponse,
      status: aiResponse.trim().length > 0 ? "auto-resolved" : "open",
      knowledge_base: knowledgeBase,
    });
  } catch (error) {
    console.error("Error processing ticket:", error);
    res.status(500).json({
      error: "Error processing ticket",
      details: error.message,
    });
  }
});

// Add document to knowledge base endpoint
app.post("/add-knowledge", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    knowledgeBase.push(content);
    res.json({
      message: "Knowledge base entry added successfully",
      knowledge_base: knowledgeBase,
    });
  } catch (error) {
    console.error("Error adding to knowledge base:", error);
    res.status(500).json({
      error: "Error adding to knowledge base",
      details: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`AI Service running on port ${PORT}`);
});
