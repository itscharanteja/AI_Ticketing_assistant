import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import App from './App';

// Mock axios
jest.mock('axios');

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form View', () => {
    it('should render the ticket submission form', () => {
      render(<App />);
      
      expect(screen.getByLabelText(/ticket title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit ticket/i })).toBeInTheDocument();
    });

    it('should handle form input changes', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const titleInput = screen.getByLabelText(/ticket title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.type(titleInput, 'Test Ticket');
      await user.type(descriptionInput, 'Test Description');
      await user.type(emailInput, 'test@example.com');
      
      expect(titleInput.value).toBe('Test Ticket');
      expect(descriptionInput.value).toBe('Test Description');
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should submit ticket successfully', async () => {
      const user = userEvent.setup();
      
      // Mock successful API responses
      axios.post
        .mockResolvedValueOnce({ data: { id: 1, title: 'Test Ticket', status: 'open' } }) // Ticket creation
        .mockResolvedValueOnce({ data: { ai_response: 'AI response content' } }); // AI processing
      
      render(<App />);
      
      const titleInput = screen.getByLabelText(/ticket title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /submit ticket/i });
      
      await user.type(titleInput, 'Test Ticket');
      await user.type(descriptionInput, 'Test Description');
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/ticket submitted successfully/i)).toBeInTheDocument();
      });
      
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('should handle form validation errors', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const submitButton = screen.getByRole('button', { name: /submit ticket/i });
      await user.click(submitButton);
      
      // Should show validation errors for empty fields
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
    });

    it('should handle network errors during submission', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      axios.post.mockRejectedValueOnce(new Error('Network Error'));
      
      render(<App />);
      
      const titleInput = screen.getByLabelText(/ticket title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /submit ticket/i });
      
      await user.type(titleInput, 'Test Ticket');
      await user.type(descriptionInput, 'Test Description');
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      axios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<App />);
      
      const titleInput = screen.getByLabelText(/ticket title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /submit ticket/i });
      
      await user.type(titleInput, 'Test Ticket');
      await user.type(descriptionInput, 'Test Description');
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      expect(screen.getByText(/submitting ticket/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Dashboard View', () => {
    it('should switch to dashboard view when button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const dashboardButton = screen.getByRole('button', { name: /view dashboard/i });
      await user.click(dashboardButton);
      
      expect(screen.getByText(/ticket dashboard/i)).toBeInTheDocument();
    });

    it('should return to form view when button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Go to dashboard first
      const dashboardButton = screen.getByRole('button', { name: /view dashboard/i });
      await user.click(dashboardButton);
      
      // Return to form
      const formButton = screen.getByRole('button', { name: /submit new ticket/i });
      await user.click(formButton);
      
      expect(screen.getByLabelText(/ticket title/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should show navigation buttons', () => {
      render(<App />);
      
      expect(screen.getByRole('button', { name: /view dashboard/i })).toBeInTheDocument();
    });

    it('should show submit another ticket button after successful submission', async () => {
      const user = userEvent.setup();
      
      axios.post
        .mockResolvedValueOnce({ data: { id: 1, title: 'Test Ticket', status: 'open' } })
        .mockResolvedValueOnce({ data: { ai_response: 'AI response content' } });
      
      render(<App />);
      
      const titleInput = screen.getByLabelText(/ticket title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /submit ticket/i });
      
      await user.type(titleInput, 'Test Ticket');
      await user.type(descriptionInput, 'Test Description');
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit another ticket/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      const user = userEvent.setup();
      
      axios.post.mockRejectedValueOnce({ 
        response: { 
          status: 500, 
          data: { error: 'Internal server error' } 
        } 
      });
      
      render(<App />);
      
      const titleInput = screen.getByLabelText(/ticket title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /submit ticket/i });
      
      await user.type(titleInput, 'Test Ticket');
      await user.type(descriptionInput, 'Test Description');
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });

    it('should handle timeout errors', async () => {
      const user = userEvent.setup();
      
      axios.post.mockRejectedValueOnce(new Error('timeout of 5000ms exceeded'));
      
      render(<App />);
      
      const titleInput = screen.getByLabelText(/ticket title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /submit ticket/i });
      
      await user.type(titleInput, 'Test Ticket');
      await user.type(descriptionInput, 'Test Description');
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      });
    });
  });
});
