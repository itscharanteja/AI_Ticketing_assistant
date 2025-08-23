import { EmailService } from '../src/emailService.js';

describe('EmailService', () => {
  let emailService;

  beforeEach(() => {
    // Set up test environment variables
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'testpassword';

    emailService = new EmailService();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  describe('Constructor', () => {
    it('should initialize with SMTP configuration', () => {
      expect(emailService.transporter).toBeDefined();
    });

    it('should handle missing environment variables gracefully', () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      expect(() => new EmailService()).not.toThrow();
    });
  });

  describe('Email Templates', () => {
    it('should generate valid HTML for AI response email', () => {
      const emailData = {
        to: 'user@example.com',
        ticketId: 123,
        title: 'Test Ticket',
        description: 'Test Description',
        aiResponse: 'AI response content',
        id: 123,
      };

      const template = emailService.generateAIResponseTemplate(emailData, emailData.aiResponse);
      
      // Check for valid HTML structure
      expect(template).toContain('<html>');
      expect(template).toContain('<body>');
      expect(template).toContain('</html>');
      expect(template).toContain('</body>');
      
      // Check for content
      expect(template).toContain('AI Response');
      expect(template).toContain('Test Ticket');
      expect(template).toContain('AI response content');
    });

    it('should generate valid HTML for human escalation email', () => {
      const emailData = {
        to: 'user@example.com',
        ticketId: 123,
        title: 'Test Ticket',
        description: 'Test Description',
        id: 123,
      };

      const template = emailService.generateHumanEscalationTemplate(emailData);
      
      // Check for valid HTML structure
      expect(template).toContain('<html>');
      expect(template).toContain('<body>');
      expect(template).toContain('</html>');
      expect(template).toContain('</body>');
      
      // Check for content
      expect(template).toContain('Human Support');
      expect(template).toContain('Test Ticket');
      expect(template).toContain('Escalated to Human');
    });
  });

  describe('Email Methods', () => {
    it('should have sendAIResponseEmail method', () => {
      expect(typeof emailService.sendAIResponseEmail).toBe('function');
    });

    it('should have sendHumanEscalationEmail method', () => {
      expect(typeof emailService.sendHumanEscalationEmail).toBe('function');
    });

    it('should have generateAIResponseTemplate method', () => {
      expect(typeof emailService.generateAIResponseTemplate).toBe('function');
    });

    it('should have generateHumanEscalationTemplate method', () => {
      expect(typeof emailService.generateHumanEscalationTemplate).toBe('function');
    });
  });
});
