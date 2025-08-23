// Advanced text similarity and RAG implementation
export class SmartRAGEngine {
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

    // Convert to sorted results
    const sortedResults = Array.from(results.entries())
      .map(([id, score]) => {
        const doc = this.knowledgeBase.find(d => d.id === id);
        return {
          ...doc,
          score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return sortedResults;
  }

  // Calculate semantic similarity between two keys
  calculateSemanticSimilarity(key1, key2) {
    const words1 = new Set(key1.split('-'));
    const words2 = new Set(key2.split('-'));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  // Get all documents (for testing)
  getAllDocuments() {
    return this.knowledgeBase;
  }
}
