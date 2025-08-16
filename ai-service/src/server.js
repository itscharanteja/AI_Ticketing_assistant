import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(cors());
app.use(express.json());

if (!process.env.PERPLEXITY_API_KEY || !process.env.OPENAI_API_KEY) {
  console.error("API keys not set");
  process.exit(1);
}

// Initialize clients
const model = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Initialize vector store
let vectorStore = null;

// Enhanced knowledge base with more detailed documents
const knowledgeBase = [
  {
    id: "password-reset",
    content:
      "To reset your password, visit the login page and click 'Forgot Password'. You'll receive an email with reset instructions within 5 minutes.",
    metadata: { category: "authentication", priority: "high" },
  },
  {
    id: "network-issues",
    content:
      "For network connectivity issues, try these steps: 1) Restart your router 2) Check cable connections 3) Run network diagnostics 4) Contact IT if issues persist",
    metadata: { category: "network", priority: "medium" },
  },
  {
    id: "hardware-request",
    content:
      "To request new hardware, submit a ticket with your manager's approval. Include: device type, justification, budget code, and delivery timeline.",
    metadata: { category: "hardware", priority: "low" },
  },
];

// Initialize vector store on startup
async function initializeVectorStore() {
  try {
    const documents = knowledgeBase.map(
      (item) =>
        new Document({
          pageContent: item.content,
          metadata: item.metadata,
        })
    );

    vectorStore = await FaissStore.fromDocuments(documents, embeddings);
    console.log("Vector store initialized successfully");
  } catch (error) {
    console.error("Error initializing vector store:", error);
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    vectorStore: vectorStore ? "initialized" : "not initialized",
  });
});

// RAG-enhanced ticket processing
app.post("/process-ticket", async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!vectorStore) {
      throw new Error("Vector store not initialized");
    }

    // Create search query from title and description
    const searchQuery = `${title} ${description}`;

    // Retrieve relevant documents using semantic search
    const relevantDocs = await vectorStore.similaritySearch(searchQuery, 3);

    // Extract content from retrieved documents
    const contextDocs = relevantDocs.map((doc) => doc.pageContent);

    // Enhanced prompt with retrieved context
    const prompt = `You are a helpful IT support assistant. Use the following knowledge base entries to help answer the support ticket.

RELEVANT KNOWLEDGE BASE ENTRIES:
${contextDocs.map((doc, index) => `${index + 1}. ${doc}`).join("\n")}

SUPPORT TICKET:
Title: ${title}
Description: ${description}

Instructions:
- Provide a helpful response based primarily on the relevant knowledge base entries above
- If the knowledge base doesn't contain sufficient information, clearly state this and suggest escalating to human support
- Be specific and actionable in your response
- Reference which knowledge base entry you're using if applicable`;

    const response = await model.chat.completions.create({
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful IT support assistant specializing in providing accurate, actionable solutions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const aiResponse = response.choices[0].message.content;

    res.json({
      ai_response: aiResponse,
      status: aiResponse.includes("escalating to human support")
        ? "escalated"
        : "auto-resolved",
      retrieved_documents: relevantDocs.length,
      relevant_context: contextDocs,
    });
  } catch (error) {
    console.error("Error processing ticket:", error);
    res.status(500).json({
      error: "Error processing ticket",
      details: error.message,
    });
  }
});

// Add document to knowledge base with embedding
app.post("/add-knowledge", async (req, res) => {
  try {
    const { content, category = "general", priority = "medium" } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    if (!vectorStore) {
      throw new Error("Vector store not initialized");
    }

    // Create new document
    const newDoc = new Document({
      pageContent: content,
      metadata: { category, priority, id: `doc-${Date.now()}` },
    });

    // Add to vector store
    await vectorStore.addDocuments([newDoc]);

    // Update in-memory knowledge base
    knowledgeBase.push({
      id: `doc-${Date.now()}`,
      content,
      metadata: { category, priority },
    });

    res.json({
      message: "Knowledge base entry added successfully",
      total_documents: knowledgeBase.length,
    });
  } catch (error) {
    console.error("Error adding to knowledge base:", error);
    res.status(500).json({
      error: "Error adding to knowledge base",
      details: error.message,
    });
  }
});

// Search knowledge base endpoint
app.post("/search-knowledge", async (req, res) => {
  try {
    const { query, limit = 3 } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    if (!vectorStore) {
      throw new Error("Vector store not initialized");
    }

    const results = await vectorStore.similaritySearchWithScore(query, limit);

    res.json({
      query,
      results: results.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        similarity_score: score,
      })),
    });
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    res.status(500).json({
      error: "Error searching knowledge base",
      details: error.message,
    });
  }
});

// Initialize vector store before starting server
initializeVectorStore().then(() => {
  app.listen(PORT, () => {
    console.log(`AI Service with RAG running on port ${PORT}`);
  });
});
