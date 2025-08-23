import { SmartRAGEngine } from '../src/SmartRAGEngine.js';

describe('AI Service - SmartRAGEngine', () => {
  let ragEngine;

  beforeEach(() => {
    ragEngine = new SmartRAGEngine();
  });

  describe('SmartRAGEngine', () => {
    it('should add documents to the knowledge base', () => {
      const document = {
        content: 'To reset your password, visit the login page and click "Forgot Password".',
        metadata: { category: 'password' }
      };

      const result = ragEngine.addDocument(document.content, document.metadata);

      expect(result).toBeDefined();
      expect(result.content).toBe(document.content);
      expect(result.metadata).toEqual(document.metadata);
      expect(ragEngine.getAllDocuments()).toHaveLength(1);
    });

    it('should search for relevant documents', () => {
      // Add test documents
      ragEngine.addDocument(
        'To reset your password, visit the login page and click "Forgot Password".',
        { category: 'password' }
      );

      ragEngine.addDocument(
        'For network issues, check your internet connection and restart your router.',
        { category: 'network' }
      );

      const query = 'I forgot my password';
      const results = ragEngine.search(query);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('password');
    });

    it('should extract keywords from text', () => {
      const text = 'How do I reset my password?';
      const keywords = ragEngine.extractKeywords(text);

      expect(keywords).toContain('reset');
      expect(keywords).toContain('password');
      // Note: "how" is not a stop word in current implementation
      expect(keywords).not.toContain('do');
      expect(keywords).not.toContain('i');
    });

    it('should identify stop words correctly', () => {
      expect(ragEngine.isStopWord('the')).toBe(true);
      expect(ragEngine.isStopWord('and')).toBe(true);
      expect(ragEngine.isStopWord('password')).toBe(false);
      expect(ragEngine.isStopWord('reset')).toBe(false);
    });

    it('should calculate semantic similarity', () => {
      const similarity1 = ragEngine.calculateSemanticSimilarity('password-reset-help', 'reset-password-help');
      const similarity2 = ragEngine.calculateSemanticSimilarity('password-reset-help', 'network-connection-issues');

      expect(similarity1).toBeGreaterThan(similarity2);
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
      // Add multiple documents
      ragEngine.addDocument('Password reset instructions for user accounts', { category: 'password' });
      ragEngine.addDocument('How to reset your password step by step', { category: 'password' });
      ragEngine.addDocument('Network troubleshooting guide', { category: 'network' });

      const query = 'password reset';
      const results = ragEngine.search(query);

      // Results should be sorted by relevance score (highest first)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });

  describe('Knowledge Base Management', () => {
    it('should get all documents', () => {
      expect(ragEngine.getAllDocuments()).toEqual([]);

      ragEngine.addDocument('Test document 1', { category: 'test' });
      ragEngine.addDocument('Test document 2', { category: 'test' });

      const documents = ragEngine.getAllDocuments();
      expect(documents).toHaveLength(2);
      expect(documents[0].content).toBe('Test document 1');
      expect(documents[1].content).toBe('Test document 2');
    });

    it('should generate document IDs', () => {
      const doc1 = ragEngine.addDocument('Document 1', { category: 'test' });
      const doc2 = ragEngine.addDocument('Document 2', { category: 'test' });

      expect(doc1.id).toBeDefined();
      expect(doc2.id).toBeDefined();
      expect(doc1.id).toMatch(/^doc-\d+$/);
      expect(doc2.id).toMatch(/^doc-\d+$/);
    });
  });
});
