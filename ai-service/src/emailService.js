import nodemailer from 'nodemailer';

class EmailService {
  constructor () {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Send AI response email
  async sendAIResponseEmail (userEmail, ticketData, aiResponse) {
    const mailOptions = {
      from: `"AI Support Team" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Ticket #${ticketData.id} - AI Response: ${ticketData.title}`,
      html: this.generateAIResponseTemplate(ticketData, aiResponse),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('AI Response email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending AI response email:', error);
      throw error;
    }
  }

  // Send human escalation email
  async sendHumanEscalationEmail (userEmail, ticketData) {
    const mailOptions = {
      from: `"AI Support Team" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Ticket #${ticketData.id} - Escalated to Human Support: ${ticketData.title}`,
      html: this.generateHumanEscalationTemplate(ticketData),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Human escalation email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending human escalation email:', error);
      throw error;
    }
  }

  // Generate AI response email template
  generateAIResponseTemplate (ticketData, aiResponse) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; border-radius: 8px; }
          .content { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .ticket-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #007bff; }
          .ai-response { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤖 AI Ticket Response</h1>
            <p>Your ticket has been automatically resolved by our AI assistant</p>
            <p style="font-size: 14px; opacity: 0.8;">From: AI Support Team</p>
          </div>
          
          <div class="ticket-info">
            <h3>Ticket Details</h3>
            <p><strong>Ticket ID:</strong> #${ticketData.id}</p>
            <p><strong>Title:</strong> ${ticketData.title}</p>
            <p><strong>Description:</strong> ${ticketData.description}</p>
            <p><strong>Status:</strong> <span style="color: #28a745;">Auto-Resolved</span></p>
          </div>
          
          <div class="ai-response">
            <h3>AI Response</h3>
            <p>${aiResponse.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div class="footer">
            <p>This is an automated response. If you need further assistance, please reply to this email.</p>
            <p>Ticket ID: #${ticketData.id}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate human escalation email template
  generateHumanEscalationTemplate (ticketData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #856404; padding: 20px; border-radius: 8px; }
          .content { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .ticket-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
          .notice { background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #ffeaa7; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Ticket Escalated to Human Support</h1>
            <p>Your ticket requires human assistance</p>
            <p style="font-size: 14px; opacity: 0.8;">From: AI Support Team</p>
          </div>
          
          <div class="ticket-info">
            <h3>Ticket Details</h3>
            <p><strong>Ticket ID:</strong> #${ticketData.id}</p>
            <p><strong>Title:</strong> ${ticketData.title}</p>
            <p><strong>Description:</strong> ${ticketData.description}</p>
            <p><strong>Status:</strong> <span style="color: #ffc107;">Escalated to Human</span></p>
          </div>
          
          <div class="notice">
            <h3>What Happens Next?</h3>
            <p>Our AI system couldn't automatically resolve your ticket. A human support representative will review your case and contact you within 24 hours.</p>
            <p>You'll receive another email once a human agent has reviewed and responded to your ticket.</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your patience. We're working to resolve your issue as quickly as possible.</p>
            <p>Ticket ID: #${ticketData.id}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export { EmailService };
export default EmailService;
