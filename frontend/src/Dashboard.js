import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Use environment variables for API endpoints
  const TICKET_API_URL = process.env.REACT_APP_TICKET_API_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchTickets();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTickets();
    }, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const fetchTickets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await axios.get(`${TICKET_API_URL}/tickets`);
      setTickets(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteTicket = async (ticketId) => {
    if (!window.confirm(`Are you sure you want to delete ticket #${ticketId}? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${TICKET_API_URL}/tickets/${ticketId}`);
      // Remove the ticket from the local state
      setTickets(tickets.filter(ticket => ticket.id !== ticketId));
    } catch (err) {
      console.error('Error deleting ticket:', err);
      alert('Failed to delete ticket. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'auto-resolved':
        return '#28a745';
      case 'escalated':
        return '#ffc107';
      case 'open':
        return '#007bff';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'auto-resolved':
        return '🤖';
      case 'escalated':
        return '⚠️';
      case 'open':
        return '📝';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={() => fetchTickets(true)} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Ticket Dashboard</h2>
        <button 
          onClick={() => fetchTickets(true)} 
          className="refresh-btn"
          disabled={refreshing}
        >
          {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Tickets</h3>
          <p className="stat-number">{tickets.length}</p>
        </div>
        <div className="stat-card">
          <h3>Auto-Resolved</h3>
          <p className="stat-number">{tickets.filter(t => t.status === 'auto-resolved').length}</p>
        </div>
        <div className="stat-card">
          <h3>Escalated</h3>
          <p className="stat-number">{tickets.filter(t => t.status === 'escalated').length}</p>
        </div>
        <div className="stat-card">
          <h3>Open</h3>
          <p className="stat-number">{tickets.filter(t => t.status === 'open').length}</p>
        </div>
      </div>

      <div className="tickets-list">
        <h3>All Tickets</h3>
        {tickets.length === 0 ? (
          <div className="no-tickets">
            <p>No tickets found. Create your first ticket!</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-header">
                <div className="ticket-id">#{ticket.id}</div>
                <div 
                  className="ticket-status"
                  style={{ backgroundColor: getStatusColor(ticket.status) }}
                >
                  {getStatusIcon(ticket.status)} {ticket.status}
                </div>
              </div>
              
              <div className="ticket-content">
                <h4 className="ticket-title">{ticket.title}</h4>
                <p className="ticket-description">{ticket.description}</p>
                
                {ticket.ai_response && (
                  <div className="ai-response-display">
                    <h5>🤖 AI Response:</h5>
                    <p>{ticket.ai_response}</p>
                  </div>
                )}
                
                <div className="ticket-meta">
                  <div className="ticket-meta-info">
                    <span className="ticket-date">
                      Created: {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                      <span className="ticket-updated">
                        Updated: {new Date(ticket.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => deleteTicket(ticket.id)}
                    className="delete-btn"
                    title="Delete ticket"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
