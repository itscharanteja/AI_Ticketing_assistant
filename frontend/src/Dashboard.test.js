import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Dashboard from './Dashboard';

// Mock axios
jest.mock('axios');

describe('Dashboard Component', () => {
  const mockTickets = [
    {
      id: 1,
      title: 'Test Ticket 1',
      description: 'Test Description 1',
      status: 'open',
      ai_response: null,
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      title: 'Test Ticket 2',
      description: 'Test Description 2',
      status: 'auto-resolved',
      ai_response: 'AI resolved this ticket',
      created_at: '2023-01-02T00:00:00.000Z',
      updated_at: '2023-01-02T00:00:00.000Z',
    },
    {
      id: 3,
      title: 'Test Ticket 3',
      description: 'Test Description 3',
      status: 'escalated',
      ai_response: null,
      created_at: '2023-01-03T00:00:00.000Z',
      updated_at: '2023-01-03T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('should render dashboard with loading state initially', () => {
      axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<Dashboard />);
      
      expect(screen.getByText(/loading tickets/i)).toBeInTheDocument();
    });

    it('should fetch and display tickets successfully', async () => {
      axios.get.mockResolvedValueOnce({ data: mockTickets });
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
        expect(screen.getByText('Test Ticket 2')).toBeInTheDocument();
        expect(screen.getByText('Test Ticket 3')).toBeInTheDocument();
      });
    });

    it('should display correct statistics', async () => {
      axios.get.mockResolvedValueOnce({ data: mockTickets });
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total tickets
        expect(screen.getByText('1')).toBeInTheDocument(); // Open tickets
        expect(screen.getByText('1')).toBeInTheDocument(); // Auto-resolved tickets
        expect(screen.getByText('1')).toBeInTheDocument(); // Escalated tickets
      });
    });
  });

  describe('Ticket Display', () => {
    beforeEach(async () => {
      axios.get.mockResolvedValueOnce({ data: mockTickets });
      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
      });
    });

    it('should display ticket information correctly', () => {
      expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
      expect(screen.getByText('Test Description 1')).toBeInTheDocument();
      expect(screen.getByText('open')).toBeInTheDocument();
    });

    it('should display AI response when available', () => {
      expect(screen.getByText('AI Response:')).toBeInTheDocument();
      expect(screen.getByText('AI resolved this ticket')).toBeInTheDocument();
    });

    it('should display creation date', () => {
      expect(screen.getByText(/created: 1\/1\/2023/i)).toBeInTheDocument();
    });

    it('should display status with correct styling', () => {
      const openStatus = screen.getByText('open');
      const autoResolvedStatus = screen.getByText('auto-resolved');
      const escalatedStatus = screen.getByText('escalated');
      
      expect(openStatus).toBeInTheDocument();
      expect(autoResolvedStatus).toBeInTheDocument();
      expect(escalatedStatus).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh tickets when refresh button is clicked', async () => {
      const user = userEvent.setup();
      axios.get.mockResolvedValueOnce({ data: mockTickets });
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
      });
      
      // Mock new data for refresh
      const newTickets = [
        {
          id: 4,
          title: 'New Ticket',
          description: 'New Description',
          status: 'open',
          ai_response: null,
          created_at: '2023-01-04T00:00:00.000Z',
          updated_at: '2023-01-04T00:00:00.000Z',
        },
      ];
      axios.get.mockResolvedValueOnce({ data: newTickets });
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.getByText('New Ticket')).toBeInTheDocument();
        expect(screen.queryByText('Test Ticket 1')).not.toBeInTheDocument();
      });
    });

    it('should show refreshing state during refresh', async () => {
      const user = userEvent.setup();
      axios.get.mockResolvedValueOnce({ data: mockTickets });
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
      });
      
      // Mock delayed response for refresh
      axios.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: mockTickets }), 100)));
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      
      expect(screen.getByText(/refreshing/i)).toBeInTheDocument();
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Delete Functionality', () => {
    beforeEach(async () => {
      axios.get.mockResolvedValueOnce({ data: mockTickets });
      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
      });
    });

    it('should show delete button for each ticket', () => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(3);
    });

    it('should delete ticket when confirmed', async () => {
      const user = userEvent.setup();
      
      // Mock confirmation dialog
      global.confirm = jest.fn(() => true);
      
      // Mock successful delete
      axios.delete.mockResolvedValueOnce({ status: 204 });
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete ticket #1? This action cannot be undone.');
      expect(axios.delete).toHaveBeenCalledWith('http://localhost:5001/tickets/1');
      
      await waitFor(() => {
        expect(screen.queryByText('Test Ticket 1')).not.toBeInTheDocument();
      });
    });

    it('should not delete ticket when cancelled', async () => {
      const user = userEvent.setup();
      
      // Mock cancelled confirmation dialog
      global.confirm = jest.fn(() => false);
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      expect(global.confirm).toHaveBeenCalled();
      expect(axios.delete).not.toHaveBeenCalled();
      expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
    });

    it('should handle delete errors gracefully', async () => {
      const user = userEvent.setup();
      
      global.confirm = jest.fn(() => true);
      axios.delete.mockRejectedValueOnce(new Error('Delete failed'));
      
      // Mock alert
      global.alert = jest.fn();
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to delete ticket. Please try again.');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      axios.get.mockRejectedValueOnce(new Error('Failed to fetch tickets'));
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load tickets/i)).toBeInTheDocument();
      });
    });

    it('should show retry button when there is an error', async () => {
      axios.get.mockRejectedValueOnce(new Error('Failed to fetch tickets'));
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry fetching tickets when retry button is clicked', async () => {
      const user = userEvent.setup();
      
      // First call fails
      axios.get.mockRejectedValueOnce(new Error('Failed to fetch tickets'));
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
      
      // Second call succeeds
      axios.get.mockResolvedValueOnce({ data: mockTickets });
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh', () => {
    it('should auto-refresh tickets every 30 seconds', async () => {
      jest.useFakeTimers();
      
      axios.get.mockResolvedValueOnce({ data: mockTickets });
      
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
      });
      
      // Mock new data for auto-refresh
      const newTickets = [
        {
          id: 5,
          title: 'Auto-refreshed Ticket',
          description: 'Auto-refreshed Description',
          status: 'open',
          ai_response: null,
          created_at: '2023-01-05T00:00:00.000Z',
          updated_at: '2023-01-05T00:00:00.000Z',
        },
      ];
      axios.get.mockResolvedValueOnce({ data: newTickets });
      
      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);
      
      await waitFor(() => {
        expect(screen.getByText('Auto-refreshed Ticket')).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });
});
