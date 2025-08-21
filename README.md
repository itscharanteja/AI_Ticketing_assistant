# AI-Powered Internal Ticketing Assistant

🚀 A backend-first microservice application that manages support tickets and uses **AI with a Retrieval-Augmented Generation (RAG) pipeline** to auto-resolve common issues.  

---

## 📌 Project Overview
This project simulates an **internal ticketing system** for organizations.  
Employees can submit support tickets, and the system automatically searches a knowledge base to provide instant answers using **AI copilots**.  
If the system cannot find a relevant answer, the ticket is flagged for human review.  

This combines **scalable backend engineering** with **AI-driven automation** — directly aligned with modern HR and enterprise tooling needs.  

---

## ✨ Features
- 📩 Submit new support tickets (title + description).  
- 🤖 AI assistant auto-resolves tickets if knowledge base has relevant answers.  
- 🗄️ Tickets stored in PostgreSQL database with status tracking.  
- 🔍 Smart RAG pipeline with custom indexing for document retrieval.  
- 🧩 Modular **microservice architecture**: Ticket Service + AI Service.  
- 🐳 Dockerized setup with Docker Compose.  
- ⚡ Optional lightweight React UI for ticket submission & viewing.  
- 🔄 CI/CD pipeline with GitHub Actions (linting, tests, build).  

---

## 🛠️ Tech Stack
- **Backend:** Node.js + Express  
- **Database:** PostgreSQL  
- **AI / RAG:** Perplexity AI API + Custom SmartRAGEngine  
- **Containerization:** Docker + Docker Compose  
- **Frontend (optional):** React  
- **CI/CD:** GitHub Actions  

---

## 📂 Architecture
```
/ai-service        → AI pipeline (Perplexity AI + Custom RAG Engine)
/ticket-service    → Ticket CRUD APIs (Express + PostgreSQL)
/frontend          → Simple React UI (optional)
/docker-compose.yml
```

**Flow:**  
1. User submits a ticket → Ticket Service stores in DB.  
2. Ticket content sent to AI Service → Searches KB → Returns answer.  
3. If answer found → ticket marked as “auto-resolved” with AI response.  
4. Otherwise → ticket remains “open” for human review.  

---

## 🚀 Getting Started

### 1. Clone the Repo
```bash
git clone https://github.com/your-username/ai-ticketing-assistant.git
cd ai-ticketing-assistant
```

### 2. Setup Environment
Create a `.env` file in both `ai-service/` and `ticket-service/`:
```
PERPLEXITY_API_KEY=your_perplexity_api_key
DB_HOST=localhost
DB_USER=postgres
DB_PASS=password
DB_NAME=ticketdb
```

### 3. Run with Docker
```bash
docker-compose up --build
```

### 4. Access Services
- Ticket Service → `http://localhost:5000`  
- AI Service → `http://localhost:6000`  
- Frontend (if enabled) → `http://localhost:3000`  

---

## 📌 Example API Calls

### Create Ticket
```bash
POST http://localhost:5000/tickets
{
  "title": "Password Reset",
  "description": "I forgot my password and need a reset."
}
```

### List Tickets
```bash
GET http://localhost:5000/tickets
```

### Example AI Auto-Response
```json
{
  "id": 1,
  "title": "Password Reset",
  "status": "auto-resolved",
  "ai_response": "You can reset your password by visiting /reset-password and following the instructions."
}
```

---

## 🧪 Tests
Run backend tests:
```bash
npm test
```

---

## 📸 Demo Screenshots
- API in Postman showing ticket creation + AI response.  
- Database view showing “auto-resolved” status.  
- (Optional) UI screenshot of ticket submission form.  

---

## 📈 Future Improvements
- Add authentication & role-based access.  
- Integrate with Slack or email for notifications.  
- Expand KB ingestion with PDFs/Confluence docs.  
- Analytics dashboard for support ticket trends.  
- Consider upgrading to vector database (FAISS) for larger scale deployments.  

---

## 🎯 Why This Project Matters
This project demonstrates:  
- Strong **backend engineering** (APIs, microservices, DB design).  
- **Scalable architecture** with Docker and modular services.  
- Practical **AI integration** via RAG pipelines.  
- Alignment with real-world enterprise HR/support needs.  

It showcases **both backend focus and AI adoption** — skills critical for modern engineering roles.  
