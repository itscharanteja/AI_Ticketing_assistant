import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { Document } from "@langchain/core/documents";

// Advanced text similarity and RAG implementation
class SmartRAGEngine {
  constructor() {
    this.knowledgeBase = [];
    this.keywordIndex = new Map();
    this.semanticIndex = new Map();
  }

  // Add document to knowledge base with smart indexing
  addDocument(content, metadata = {}) {
    const doc = {
      id: `doc-${Date.now()}`,
      content,
      metadata,
      keywords: this.extractKeywords(content),
      timestamp: new Date()
    };

    this.knowledgeBase.push(doc);
    this.indexDocument(doc);
    return doc;
  }

  // Extract meaningful keywords from text
  extractKeywords(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word));
    
    return [...new Set(words)];
  }

  // Common stop words to filter out
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);
    return stopWords.has(word);
  }

  // Index document for fast retrieval
  indexDocument(doc) {
    // Keyword indexing
    doc.keywords.forEach(keyword => {
      if (!this.keywordIndex.has(keyword)) {
        this.keywordIndex.set(keyword, []);
      }
      this.keywordIndex.get(keyword).push(doc.id);
    });

    // Semantic indexing (simple but effective)
    const semanticKey = this.generateSemanticKey(doc.content);
    if (!this.semanticIndex.has(semanticKey)) {
      this.semanticIndex.set(semanticKey, []);
    }
    this.semanticIndex.get(semanticKey).push(doc.id);
  }

  // Generate semantic key based on content structure
  generateSemanticKey(content) {
    const words = content.toLowerCase().split(/\s+/);
    const keyWords = words.filter(word => word.length > 4).slice(0, 5);
    return keyWords.sort().join('-');
  }

  // Smart search combining multiple strategies
  search(query, limit = 3) {
    const queryKeywords = this.extractKeywords(query);
    const results = new Map();

    // Strategy 1: Direct keyword matching
    queryKeywords.forEach(keyword => {
      const docIds = this.keywordIndex.get(keyword) || [];
      docIds.forEach(id => {
        const score = results.get(id) || 0;
        results.set(id, score + 2); // High score for exact matches
      });
    });

    // Strategy 2: Semantic similarity
    const querySemanticKey = this.generateSemanticKey(query);
    this.semanticIndex.forEach((docIds, semanticKey) => {
      const similarity = this.calculateSemanticSimilarity(querySemanticKey, semanticKey);
      if (similarity > 0.3) {
        docIds.forEach(id => {
          const score = results.get(id) || 0;
          results.set(id, score + similarity);
        });
      }
    });

    // Strategy 3: Content relevance scoring
    this.knowledgeBase.forEach(doc => {
      const relevanceScore = this.calculateContentRelevance(query, doc.content);
      const currentScore = results.get(doc.id) || 0;
      results.set(doc.id, currentScore + relevanceScore);
    });

    // Convert to array and sort by score
    const scoredDocs = Array.from(results.entries())
      .map(([id, score]) => {
        const doc = this.knowledgeBase.find(d => d.id === id);
        return { ...doc, score };
      })
      .filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredDocs;
  }

  // Calculate semantic similarity between two semantic keys
  calculateSemanticSimilarity(key1, key2) {
    const words1 = key1.split('-');
    const words2 = key2.split('-');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // Calculate content relevance using advanced text analysis
  calculateContentRelevance(query, content) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let score = 0;
    
    // Exact word matches
    queryWords.forEach(word => {
      if (contentWords.includes(word)) {
        score += 1;
      }
    });

    // Partial word matches
    queryWords.forEach(queryWord => {
      contentWords.forEach(contentWord => {
        if (contentWord.includes(queryWord) || queryWord.includes(contentWord)) {
          score += 0.5;
        }
      });
    });

    // Phrase matching
    const queryPhrases = this.extractPhrases(query);
    const contentPhrases = this.extractPhrases(content);
    
    queryPhrases.forEach(phrase => {
      if (contentPhrases.includes(phrase)) {
        score += 2;
      }
    });

    return score;
  }

  // Extract meaningful phrases
  extractPhrases(text) {
    const sentences = text.split(/[.!?]+/);
    return sentences
      .map(sentence => sentence.trim().toLowerCase())
      .filter(sentence => sentence.length > 10)
      .slice(0, 3);
  }

  // Get all documents
  getAllDocuments() {
    return this.knowledgeBase;
  }

  // Get document by ID
  getDocument(id) {
    return this.knowledgeBase.find(doc => doc.id === id);
  }
}

const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(cors());
app.use(express.json());

if (!process.env.PERPLEXITY_API_KEY) {
  console.error("PERPLEXITY_API_KEY not set");
  process.exit(1);
}

// Initialize clients
const model = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

// Initialize Smart RAG Engine
const ragEngine = new SmartRAGEngine();

// Initialize knowledge base with sample documents
function initializeKnowledgeBase() {
  try {
    // Add sample documents to the RAG engine
    ragEngine.addDocument(
      "To reset your password, visit the login page and click 'Forgot Password'. You'll receive an email with reset instructions within 5 minutes.",
      { category: "authentication", priority: "high" }
    );
    
    ragEngine.addDocument(
      "For network connectivity issues, try these steps: 1) Restart your router 2) Check cable connections 3) Run network diagnostics 4) Contact IT if issues persist",
      { category: "network", priority: "medium" }
    );
    
    ragEngine.addDocument(
      "To request new hardware, submit a ticket with your manager's approval. Include: device type, justification, budget code, and delivery timeline.",
      { category: "hardware", priority: "low" }
    );
    
    console.log("Smart RAG Engine initialized successfully");
  } catch (error) {
    console.error("Error initializing knowledge base:", error);
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    ragEngine: "initialized",
    totalDocuments: ragEngine.getAllDocuments().length,
    searchStrategies: ["keyword", "semantic", "content-relevance"]
  });
});

// RAG-enhanced ticket processing
app.post("/process-ticket", async (req, res) => {
  try {
    const { title, description } = req.body;

    // Create search query from title and description
    const searchQuery = `${title} ${description}`;

    // Retrieve relevant documents using Smart RAG Engine
    const relevantDocs = ragEngine.search(searchQuery, 3);

    // Extract content from retrieved documents
    const contextDocs = relevantDocs.map((doc) => doc.content);

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

// Add document to knowledge base
app.post("/add-knowledge", async (req, res) => {
  try {
    const { content, category = "general", priority = "medium" } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Add to Smart RAG Engine
    const newDoc = ragEngine.addDocument(content, { category, priority });

    res.json({
      message: "Knowledge base entry added successfully",
      total_documents: ragEngine.getAllDocuments().length,
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

    const results = ragEngine.search(query, limit);

    res.json({
      query,
      results: results.map((doc) => ({
        content: doc.content,
        metadata: doc.metadata,
        similarity_score: doc.score,
        keywords: doc.keywords
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

// Initialize knowledge base before starting server
initializeKnowledgeBase();
app.listen(PORT, () => {
  console.log(`AI Service with Smart RAG running on port ${PORT}`);
});
