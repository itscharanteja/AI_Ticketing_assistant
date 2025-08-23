import React, { useState } from 'react';
import axios from 'axios';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHumanButton, setShowHumanButton] = useState(false);
  const [currentView, setCurrentView] = useState('form'); // 'form' or 'dashboard'
  const [submissionMessage, setSubmissionMessage] = useState('');

  // Use environment variables for API endpoints
  const TICKET_API_URL = process.env.REACT_APP_TICKET_API_URL || 'http://localhost:5001';
  const AI_API_URL = process.env.REACT_APP_AI_API_URL || 'http://localhost:6001';
  
  // Debug logging - remove after fixing
  console.log('Environment variables:', {
    REACT_APP_TICKET_API_URL: process.env.REACT_APP_TICKET_API_URL,
    REACT_APP_AI_API_URL: process.env.REACT_APP_AI_API_URL,
    TICKET_API_URL,
    AI_API_URL
  });
  
  // Temporary hardcoded fix - remove once env vars work
  const TICKET_URL = 'http://localhost:5001';
  const AI_URL = 'http://localhost:6001';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.email.trim()) {
      alert('Please fill in title, description, and email');
      return;
    }

    setIsSubmitting(true);
    setShowHumanButton(false);
    setSubmissionMessage('');

    try {
      console.log('Submitting ticket to:', `${TICKET_URL}/tickets`);
      
      // First, create the ticket with timeout and better error handling
      const ticketResponse = await axios.post(
        `${TICKET_URL}/tickets`, 
        {
          title: formData.title,
          description: formData.description
        },
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('Ticket created:', ticketResponse.data);
      const ticketId = ticketResponse.data.id;

      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Processing with AI at:', `${AI_URL}/process-ticket`);

      // Then process with AI
      const aiResponse = await axios.post(
        `${AI_URL}/process-ticket`, 
        {
          title: formData.title,
          description: formData.description,
          userEmail: formData.email,
          ticketId: ticketId
        },
        {
          timeout: 15000, // 15 second timeout for AI processing
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('AI Response:', aiResponse.data);

      if (aiResponse.data.status === 'escalated') {
        setShowHumanButton(true);
        setSubmissionMessage(`Ticket escalated to human support. Check ${formData.email} for details. You can also view the ticket in the dashboard.`);
      } else {
        setSubmissionMessage(`Ticket processed successfully! Check ${formData.email} for the AI response. You can also view the complete ticket details in the dashboard.`);
      }

    } catch (error) {
      console.error('Error details:', error);
      
      let errorMessage = 'Error processing ticket. Please try again.';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error: Unable to connect to the server. Please check if the services are running.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout: The server is taking too long to respond.';
      } else if (error.response) {
        // Server responded with error status
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || 'Please try again.'}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHumanEscalation = () => {
    alert('Ticket escalated to human support team. You will be contacted soon.');
    // Reset form
    setFormData({ title: '', description: '', email: '' });
    setShowHumanButton(false);
    setSubmissionMessage('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 AI Ticket Assistant</h1>
        <p>Submit your support ticket and get instant AI-powered assistance</p>
        <div className="nav-buttons">
          <button 
            onClick={() => setCurrentView('form')}
            className={`nav-btn ${currentView === 'form' ? 'active' : ''}`}
          >
            📝 Submit Ticket
          </button>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          >
            📊 View Dashboard
          </button>
        </div>
      </header>

      <main className="App-main">
        {currentView === 'form' ? (
          <>
            <form onSubmit={handleSubmit} className="ticket-form" autoComplete='off'> 
              <div className="form-group">
                <label htmlFor="title">Ticket Title:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Password Reset Issue"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Your Email Address:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                />
                <small style={{color: '#666', fontSize: '12px'}}>
                  We'll send the AI response to this email address
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Please describe your issue in detail..."
                  rows="4"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="submit-btn"
              >
                {isSubmitting ? 'Processing with AI...' : 'Submit Ticket'}
              </button>
            </form>

            {isSubmitting && (
              <div className="loading">
                <div className="spinner"></div>
                <p>AI is analyzing your ticket... Please wait.</p>
              </div>
            )}

            {submissionMessage && (
              <div className="submission-message">
                <h3>✅ Ticket Submitted</h3>
                <p>{submissionMessage}</p>
                <button 
                  onClick={() => {
                    setFormData({ title: '', description: '', email: '' });
                    setSubmissionMessage('');
                    setShowHumanButton(false);
                  }}
                  className="new-ticket-btn"
                >
                  Submit Another Ticket
                </button>
              </div>
            )}

            {showHumanButton && (
              <div className="human-escalation">
                <h3>⚠️ Human Support Required</h3>
                <p>This ticket requires human assistance as it's not covered in our knowledge base.</p>
                <button 
                  onClick={handleHumanEscalation}
                  className="human-btn"
                >
                  Escalate to Human Support
                </button>
              </div>
            )}
          </>
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
}

export default App;