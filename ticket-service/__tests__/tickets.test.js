const request = require('supertest');
const { Sequelize } = require('sequelize');
const app = require('../src/server');

// Mock the database connection for testing
jest.mock('../src/models/index', () => {
  const mockTicketModel = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  return {
    Ticket: mockTicketModel,
    sequelize: {
      sync: jest.fn().mockResolvedValue(),
      authenticate: jest.fn().mockResolvedValue(),
    },
  };
});

describe('Ticket Service API', () => {
  let server;

  beforeAll(async () => {
    server = app.listen(0); // Use random port for testing
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /tickets', () => {
    it('should return all tickets', async () => {
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
      ];

      const { Ticket } = require('../src/models/index');
      Ticket.findAll.mockResolvedValue(mockTickets);

      const response = await request(app)
        .get('/tickets')
        .expect(200);

      expect(response.body).toEqual(mockTickets);
      expect(Ticket.findAll).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const { Ticket } = require('../src/models/index');
      Ticket.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/tickets')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /tickets', () => {
    it('should create a new ticket', async () => {
      const newTicket = {
        title: 'New Test Ticket',
        description: 'New Test Description',
      };

      const createdTicket = {
        id: 3,
        ...newTicket,
        status: 'open',
        ai_response: null,
        created_at: '2023-01-03T00:00:00.000Z',
        updated_at: '2023-01-03T00:00:00.000Z',
      };

      const { Ticket } = require('../src/models/index');
      Ticket.create.mockResolvedValue(createdTicket);

      const response = await request(app)
        .post('/tickets')
        .send(newTicket)
        .expect(201);

      expect(response.body).toEqual(createdTicket);
      expect(Ticket.create).toHaveBeenCalledWith({
        title: newTicket.title,
        description: newTicket.description,
        status: 'open',
      });
    });

    it('should validate required fields', async () => {
      const invalidTicket = {
        title: '', // Empty title
        description: 'Test Description',
      };

      const response = await request(app)
        .post('/tickets')
        .send(invalidTicket)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors during creation', async () => {
      const newTicket = {
        title: 'New Test Ticket',
        description: 'New Test Description',
      };

      const { Ticket } = require('../src/models/index');
      Ticket.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/tickets')
        .send(newTicket)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /tickets/:id', () => {
    it('should return a specific ticket', async () => {
      const mockTicket = {
        id: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        status: 'open',
        ai_response: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      const { Ticket } = require('../src/models/index');
      Ticket.findByPk.mockResolvedValue(mockTicket);

      const response = await request(app)
        .get('/tickets/1')
        .expect(200);

      expect(response.body).toEqual(mockTicket);
      expect(Ticket.findByPk).toHaveBeenCalledWith("1");
    });

    it('should return 404 for non-existent ticket', async () => {
      const { Ticket } = require('../src/models/index');
      Ticket.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/tickets/999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /tickets/:id', () => {
    it('should update a ticket', async () => {
      const updateData = {
        status: 'auto-resolved',
        ai_response: 'AI resolved this ticket',
      };

      const updatedTicket = {
        id: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        ...updateData,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      const { Ticket } = require('../src/models/index');
      const mockTicketInstance = {
        ...updatedTicket,
        update: jest.fn().mockResolvedValue(updatedTicket),
      };
      Ticket.findByPk.mockResolvedValue(mockTicketInstance);

      const response = await request(app)
        .put('/tickets/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedTicket);
      expect(mockTicketInstance.update).toHaveBeenCalledWith({
        title: 'Test Ticket',
        description: 'Test Description',
        status: 'auto-resolved',
        ai_response: 'AI resolved this ticket',
      });
    });

    it('should return 404 for non-existent ticket', async () => {
      const { Ticket } = require('../src/models/index');
      Ticket.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put('/tickets/999')
        .send({ status: 'resolved' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /tickets/:id', () => {
    it('should delete a ticket', async () => {
      const mockTicket = {
        id: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        status: 'open',
        ai_response: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      const { Ticket } = require('../src/models/index');
      const mockTicketInstance = {
        ...mockTicket,
        destroy: jest.fn().mockResolvedValue(),
      };
      Ticket.findByPk.mockResolvedValue(mockTicketInstance);

      const response = await request(app)
        .delete('/tickets/1')
        .expect(204);

      expect(mockTicketInstance.destroy).toHaveBeenCalled();
    });

    it('should return 404 for non-existent ticket', async () => {
      const { Ticket } = require('../src/models/index');
      Ticket.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .delete('/tickets/999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
