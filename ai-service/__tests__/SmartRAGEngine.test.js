import { SmartRAGEngine } from '../src/SmartRAGEngine.js';

describe('SmartRAGEngine', () => {
  let ragEngine;

  beforeEach(() => {
    ragEngine = new SmartRAGEngine();
  });

  describe('Constructor', () => {
    it('should initialize with empty collections', () => {
      expect(ragEngine.documents).toEqual([]);
      expect(ragEngine.keywordIndex).toEqual({});
      expect(ragEngine.semanticIndex).toEqual({});
    });
  });

  describe('addDocument', () => {
    it('should add a document to the collection', () => {
      const document = {
        id: 'doc1',
        content: 'Test content',
        category: 'test',
      };

      ragEngine.addDocument(document);

      expect(ragEngine.documents).toHaveLength(1);
      expect(ragEngine.documents[0]).toEqual(document);
    });

    it('should index the document after adding', () => {
      const document = {
        id: 'doc1',
        content: 'password reset help',
        category: 'password',
      };

      const indexDocumentSpy = jest.spyOn(ragEngine, 'indexDocument');
      ragEngine.addDocument(document);

      expect(indexDocumentSpy).toHaveBeenCalledWith(document);
    });
  });

  describe('extractKeywords', () => {
    it('should extract meaningful keywords', () => {
      const text = 'How do I reset my password?';
      const keywords = ragEngine.extractKeywords(text);

      expect(keywords).toContain('reset');
      expect(keywords).toContain('password');
      expect(keywords).not.toContain('how');
      expect(keywords).not.toContain('do');
      expect(keywords).not.toContain('i');
    });

    it('should handle empty text', () => {
      const keywords = ragEngine.extractKeywords('');
      expect(keywords).toEqual([]);
    });

    it('should handle text with only stop words', () => {
      const keywords = ragEngine.extractKeywords('the and or but');
      expect(keywords).toEqual([]);
    });
  });

  describe('isStopWord', () => {
    it('should identify common stop words', () => {
      expect(ragEngine.isStopWord('the')).toBe(true);
      expect(ragEngine.isStopWord('and')).toBe(true);
      expect(ragEngine.isStopWord('or')).toBe(true);
      expect(ragEngine.isStopWord('but')).toBe(true);
      expect(ragEngine.isStopWord('password')).toBe(false);
      expect(ragEngine.isStopWord('reset')).toBe(false);
    });
  });

  describe('indexDocument', () => {
    it('should create keyword index entries', () => {
      const document = {
        id: 'doc1',
        content: 'password reset instructions',
        category: 'password',
      };

      ragEngine.indexDocument(document);

      expect(ragEngine.keywordIndex['password']).toContain('doc1');
      expect(ragEngine.keywordIndex['reset']).toContain('doc1');
      expect(ragEngine.keywordIndex['instructions']).toContain('doc1');
    });

    it('should create semantic index entries', () => {
      const document = {
        id: 'doc1',
        content: 'password reset instructions',
        category: 'password',
      };

      ragEngine.indexDocument(document);

      const semanticKey = ragEngine.generateSemanticKey(document.content);
      expect(ragEngine.semanticIndex[semanticKey]).toContain('doc1');
    });
  });

  describe('generateSemanticKey', () => {
    it('should generate consistent keys for similar content', () => {
      const content1 = 'password reset help';
      const content2 = 'help with password reset';

      const key1 = ragEngine.generateSemanticKey(content1);
      const key2 = ragEngine.generateSemanticKey(content2);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different content', () => {
      const content1 = 'password reset help';
      const content2 = 'network connection issues';

      const key1 = ragEngine.generateSemanticKey(content1);
      const key2 = ragEngine.generateSemanticKey(content2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      // Add test documents
      ragEngine.addDocument({
        id: 'doc1',
        content: 'To reset your password, visit the login page and click "Forgot Password".',
        category: 'password',
      });

      ragEngine.addDocument({
        id: 'doc2',
        content: 'For network issues, check your internet connection and restart your router.',
        category: 'network',
      });

      ragEngine.addDocument({
        id: 'doc3',
        content: 'If you forgot your password, you can reset it by following these steps.',
        category: 'password',
      });
    });

    it('should find relevant documents by keyword matching', () => {
      const query = 'I forgot my password';
      const results = ragEngine.search(query);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(doc => doc.id === 'doc1')).toBe(true);
      expect(results.some(doc => doc.id === 'doc3')).toBe(true);
    });

    it('should return empty results for irrelevant queries', () => {
      const query = 'completely unrelated topic';
      const results = ragEngine.search(query);

      expect(results).toEqual([]);
    });

    it('should handle empty query', () => {
      const results = ragEngine.search('');
      expect(results).toEqual([]);
    });

    it('should return results sorted by relevance', () => {
      const query = 'password reset';
      const results = ragEngine.search(query);

      // Results should be sorted by relevance score (highest first)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(results[i].relevanceScore);
      }
    });
  });

  describe('calculateSemanticSimilarity', () => {
    it('should return high similarity for related terms', () => {
      const similarity = ragEngine.calculateSemanticSimilarity('password', 'password');
      expect(similarity).toBe(1.0);
    });

    it('should return lower similarity for related but different terms', () => {
      const similarity = ragEngine.calculateSemanticSimilarity('password', 'reset');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should return low similarity for unrelated terms', () => {
      const similarity = ragEngine.calculateSemanticSimilarity('password', 'network');
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('calculateContentRelevance', () => {
    it('should calculate relevance based on keyword matches', () => {
      const document = {
        id: 'doc1',
        content: 'password reset instructions help',
        category: 'password',
      };

      const query = 'password reset';
      const relevance = ragEngine.calculateContentRelevance(document, query);

      expect(relevance).toBeGreaterThan(0);
      expect(relevance).toBeLessThanOrEqual(1);
    });

    it('should return zero relevance for no matches', () => {
      const document = {
        id: 'doc1',
        content: 'network connection issues',
        category: 'network',
      };

      const query = 'password reset';
      const relevance = ragEngine.calculateContentRelevance(document, query);

      expect(relevance).toBe(0);
    });
  });

  describe('extractPhrases', () => {
    it('should extract meaningful phrases from text', () => {
      const text = 'How do I reset my password? Please help me.';
      const phrases = ragEngine.extractPhrases(text);

      expect(phrases).toContain('reset my password');
      expect(phrases).toContain('help me');
    });

    it('should handle short text', () => {
      const text = 'password reset';
      const phrases = ragEngine.extractPhrases(text);

      expect(phrases).toContain('password reset');
    });

    it('should handle empty text', () => {
      const phrases = ragEngine.extractPhrases('');
      expect(phrases).toEqual([]);
    });
  });
});
