# AI-Powered Internal Ticketing Assistant

🚀 A comprehensive microservice application that manages support tickets with **AI-powered automation**, **email notifications**, and **modern CI/CD practices**.

---

## 📌 Project Overview
This project implements a **production-ready internal ticketing system** for organizations.  
Employees can submit support tickets through a modern React frontend, and the system automatically:
- 🤖 **AI Resolution**: Searches knowledge base and provides instant answers
- 📧 **Email Notifications**: Sends AI responses or human escalation notifications
- 📊 **Dashboard Management**: View, manage, and delete tickets with real-time updates
- 🔄 **Automated Workflows**: Complete CI/CD pipeline with testing and deployment

This combines **scalable backend engineering**, **AI integration**, and **modern DevOps practices** — directly aligned with enterprise needs.

---

## ✨ Features

### 🎯 Core Functionality
- 📝 **Ticket Submission**: Modern React form with email validation
- 🤖 **AI-Powered Resolution**: Custom SmartRAGEngine with Perplexity AI
- 📧 **Email Notifications**: Automated AI responses and human escalation alerts
- 📊 **Dashboard Management**: Real-time ticket viewing, status tracking, and deletion
- 🔄 **Auto-refresh**: Dashboard updates every 30 seconds

### 🏗️ Architecture & Infrastructure
- 🧩 **Microservices**: Ticket Service + AI Service + Frontend
- 🗄️ **Database**: PostgreSQL with Sequelize ORM
- 🐳 **Containerization**: Docker + Docker Compose
- 🔒 **Security**: CORS configuration, input validation, error handling

### 🚀 DevOps & Quality
- 🔄 **CI/CD Pipeline**: GitHub Actions with automated testing, building, and deployment
- 🧪 **Testing Framework**: Jest + Supertest (36/36 tests passing)
- 📏 **Code Quality**: ESLint configuration for all services
- 🔍 **Security Scanning**: Trivy vulnerability scanner
- 📈 **Performance Testing**: Artillery load testing
- 🔄 **Dependency Management**: Automated updates and security alerts

---

## 🛠️ Tech Stack

### Backend Services
- **Runtime**: Node.js 18 + Express
- **Database**: PostgreSQL + Sequelize ORM
- **AI/ML**: Perplexity AI API + Custom SmartRAGEngine
- **Email**: Nodemailer with HTML templates
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18
- **HTTP Client**: Axios
- **Styling**: CSS3 with modern design
- **Testing**: React Testing Library

### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint + Standard config
- **Security**: Trivy vulnerability scanner
- **Performance**: Artillery load testing

---

## 📂 Architecture

```
MicroserviceProject/
├── ai-service/           → AI pipeline (Perplexity AI + SmartRAGEngine)
│   ├── src/
│   │   ├── server.js     → Main AI service with RAG engine
│   │   ├── SmartRAGEngine.js → Custom RAG implementation
│   │   └── emailService.js → Email templates and sending
│   ├── __tests__/        → Comprehensive test suite
│   └── Dockerfile
├── ticket-service/       → Ticket CRUD APIs (Express + PostgreSQL)
│   ├── src/
│   │   ├── server.js     → Main ticket service
│   │   ├── models/       → Database models
│   │   └── routes/       → API endpoints
│   ├── __tests__/        → API integration tests
│   └── Dockerfile
├── frontend/            → React UI for ticket management
│   ├── src/
│   │   ├── App.js       → Main application component
│   │   ├── Dashboard.js → Ticket dashboard component
│   │   └── Dashboard.css → Modern styling
│   ├── __tests__/       → React component tests
│   └── Dockerfile
├── .github/workflows/   → CI/CD pipeline configurations
│   ├── ci.yml          → Main CI/CD pipeline
│   ├── dependency-update.yml → Automated dependency updates
│   └── release.yml     → Release management
└── docker-compose.yml  → Multi-service orchestration
```

**Flow:**
1. **User submits ticket** → React frontend → Ticket Service → PostgreSQL
2. **AI processing** → Ticket Service → AI Service → SmartRAGEngine → Perplexity AI
3. **Email notification** → AI Service → Email templates → User email
4. **Dashboard update** → Auto-refresh → Real-time status display
5. **CI/CD pipeline** → Automated testing, building, and deployment

---

## 🚀 Getting Started

### 1. Prerequisites
```bash
# Required software
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Git
```

### 2. Clone the Repository
```bash
git clone https://github.com/itscharanteja/AI_Ticketing_assistant.git
cd AI_Ticketing_assistant
```

### 3. Environment Configuration
Create `.env` files in both `ai-service/` and `ticket-service/`:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASS=password
DB_NAME=ticketdb
DB_PORT=5432

# AI Service Configuration
PERPLEXITY_API_KEY=your_perplexity_api_key

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Start the Application
```bash
# Start all services with Docker Compose
docker-compose up --build -d

# Or start services individually
docker-compose up ticket-service -d
docker-compose up ai-service -d
docker-compose up frontend -d
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Ticket Service API**: http://localhost:5001
- **AI Service API**: http://localhost:6001
- **Database**: localhost:5432

---

## 📌 API Documentation

### Ticket Service Endpoints

#### Create Ticket
```bash
POST http://localhost:5001/tickets
Content-Type: application/json

{
  "title": "Password Reset Issue",
  "description": "I cannot reset my password",
  "email": "user@example.com"
}
```

#### Get All Tickets
```bash
GET http://localhost:5001/tickets
```

#### Get Specific Ticket
```bash
GET http://localhost:5001/tickets/:id
```

#### Update Ticket
```bash
PUT http://localhost:5001/tickets/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "resolved",
  "ai_response": "AI response content"
}
```

#### Delete Ticket
```bash
DELETE http://localhost:5001/tickets/:id
```

### AI Service Endpoints

#### Process Ticket
```bash
POST http://localhost:6001/process-ticket
Content-Type: application/json

{
  "ticketId": 1,
  "title": "Password Reset",
  "description": "I forgot my password",
  "userEmail": "user@example.com"
}
```

#### Health Check
```bash
GET http://localhost:6001/health
```

---

## 🧪 Testing

### Run All Tests
```bash
# Test all services
cd ticket-service && npm test
cd ../ai-service && npm test
cd ../frontend && npm test
```

### Test Coverage
- **Ticket Service**: 11/11 tests passing
- **AI Service**: 36/36 tests passing
- **Frontend**: Component tests included
- **Integration**: Docker Compose integration tests

### CI/CD Pipeline Tests
The GitHub Actions pipeline automatically runs:
- ✅ Unit tests for all services
- ✅ Integration tests with Docker Compose
- ✅ Code quality checks (ESLint)
- ✅ Security vulnerability scanning
- ✅ Docker image building
- ✅ Performance testing

---

## 🔄 CI/CD Pipeline

### Automated Workflows
1. **Main CI Pipeline** (`.github/workflows/ci.yml`)
   - Triggers on push to main/develop branches
   - Runs tests, linting, building, and integration tests
   - Performs security scanning with Trivy
   - Deploys to staging environment

2. **Dependency Updates** (`.github/workflows/dependency-update.yml`)
   - Weekly automated dependency checks
   - Creates pull requests for updates
   - Maintains security and performance

3. **Release Management** (`.github/workflows/release.yml`)
   - Automated releases on version tags
   - Generates release notes
   - Builds and validates releases

### Quality Gates
- ✅ **Test Coverage**: Minimum 80% coverage required
- ✅ **Code Quality**: Zero linting errors
- ✅ **Security**: Zero high/critical vulnerabilities
- ✅ **Performance**: Response time under 2 seconds

---

## 📧 Email System

### Features
- **AI Response Emails**: HTML templates with ticket details and AI solutions
- **Human Escalation**: Professional escalation notifications
- **Customizable Templates**: Modern HTML design with branding
- **Error Handling**: Graceful fallback for email failures

### Email Templates
- **AI Response**: Includes ticket details, AI solution, and next steps
- **Human Escalation**: Professional notification with 24-hour response promise
- **Responsive Design**: Works on desktop and mobile devices

---

## 🎨 Frontend Features

### User Interface
- **Modern Design**: Clean, responsive interface
- **Form Validation**: Real-time input validation
- **Loading States**: User feedback during operations
- **Error Handling**: Graceful error display

### Dashboard
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Ticket Management**: View, filter, and delete tickets
- **Status Tracking**: Visual status indicators
- **Statistics**: Ticket counts and metrics

---

## 🔒 Security Features

### API Security
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: Secure error responses
- **Rate Limiting**: Protection against abuse

### Container Security
- **Vulnerability Scanning**: Automated Trivy scans
- **Base Image Security**: Minimal, secure base images
- **Secret Management**: Environment variable protection
- **Network Security**: Isolated service communication

---

## 📈 Performance & Monitoring

### Performance Metrics
- **Response Time**: < 2 seconds for API calls
- **Throughput**: 100+ requests per minute
- **Uptime**: 99.9% availability target
- **Resource Usage**: Optimized Docker containers

### Monitoring
- **Health Checks**: Automated service health monitoring
- **Logging**: Structured logging for debugging
- **Metrics**: Performance and usage tracking
- **Alerts**: Automated failure notifications

---

## 🚀 Deployment

### Production Ready
- **Docker Containers**: Portable, scalable deployment
- **Environment Configuration**: Flexible environment setup
- **Database Migrations**: Automated schema management
- **Health Monitoring**: Built-in health check endpoints

### Scaling
- **Horizontal Scaling**: Stateless services for easy scaling
- **Load Balancing**: Ready for load balancer integration
- **Database Optimization**: Indexed queries and connection pooling
- **Caching**: Redis-ready architecture

---

## 📚 Documentation

### Additional Resources
- **CI/CD Documentation**: `CI_CD_README.md` - Comprehensive pipeline guide
- **API Documentation**: Interactive API documentation (planned)
- **Deployment Guide**: Production deployment instructions
- **Troubleshooting**: Common issues and solutions

---

## 🤝 Contributing

### Development Workflow
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes**: Follow coding standards and add tests
4. **Run tests**: Ensure all tests pass locally
5. **Submit PR**: Create pull request with detailed description
6. **CI/CD**: Automated pipeline validates changes
7. **Review**: Code review and approval process

### Code Standards
- **ESLint**: Standard JavaScript configuration
- **Testing**: Minimum 80% test coverage
- **Documentation**: Clear code comments and README updates
- **Git**: Conventional commit messages

---

## 📈 Future Roadmap

### Immediate Priorities
- 🔐 **Authentication System**: JWT tokens and user management
- 📚 **API Documentation**: Swagger/OpenAPI specification
- 🎨 **Enhanced UI**: Advanced filtering and search
- 📊 **Analytics Dashboard**: Ticket metrics and trends

### Long-term Goals
- 💬 **Slack Integration**: Real-time notifications
- 📄 **Document Ingestion**: PDF and Confluence integration
- 🤖 **Advanced AI**: Multi-language support and sentiment analysis
- 🌐 **Multi-tenant**: Organization-level isolation
- 📱 **Mobile App**: Native mobile application

---

## 🎯 Why This Project Matters

This project demonstrates **enterprise-grade software development** with:

### Technical Excellence
- **Microservices Architecture**: Scalable, maintainable design
- **AI Integration**: Practical machine learning implementation
- **DevOps Practices**: Modern CI/CD and automation
- **Quality Assurance**: Comprehensive testing and monitoring

### Business Value
- **Cost Reduction**: Automated ticket resolution
- **User Experience**: Modern, responsive interface
- **Scalability**: Ready for enterprise deployment
- **Maintainability**: Clean code and documentation

### Career Impact
- **Full-Stack Development**: Frontend, backend, and DevOps
- **AI/ML Skills**: Practical AI implementation experience
- **Cloud-Native**: Containerization and microservices
- **Enterprise Tools**: Industry-standard technologies

---

## 📞 Support & Community

### Getting Help
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check README and CI/CD documentation
- **Contributing**: Follow contributing guidelines

### Project Status
- **Version**: 1.0.0
- **Status**: Production Ready
- **License**: MIT License
- **Maintenance**: Active development

---

**Built with ❤️ using modern technologies and best practices**
