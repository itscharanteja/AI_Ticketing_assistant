# Frontend - AI Ticket Assistant

A simple React frontend for submitting support tickets and receiving AI-powered responses.

## Features

- 📝 Simple ticket submission form
- 🤖 AI processing with 10-second wait time
- ⚠️ Human escalation for complex tickets
- 🎨 Modern, responsive UI design

## Quick Start

### Development
```bash
cd frontend
npm install
npm start
```

### Docker
```bash
docker-compose up frontend
```

## API Endpoints Used

- `POST /tickets` - Create new ticket (ticket-service:5001)
- `POST /process-ticket` - Process ticket with AI (ai-service:6000)

## UI Components

- **Ticket Form**: Title and description inputs
- **Loading State**: 10-second AI processing indicator
- **AI Response**: Displays AI-generated solution
- **Human Escalation**: Button for tickets requiring human support
