# Temporal Background Jobs Demo

A comprehensive microservices application demonstrating **Temporal Workflows** for orchestrating complex background job processing. This project showcases how Temporal simplifies building reliable, fault-tolerant distributed systems.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Payment        │    │  Document       │
│   (React)       │    │  Service        │    │  Service        │
│   Port 3000     │    │  Port 3002      │    │  Port 3003      │
└─────────┬───────┘    └─────────────────┘    └─────────────────┘
          │                       ▲                       ▲
          │                       │                       │
          ▼                       │                       │
┌─────────────────┐              │                       │
│  Backend API    │◄─────────────┴───────────────────────┘
│  + Temporal     │
│  Port 3001      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Temporal       │    │   MongoDB       │    │   MailHog       │
│  Server & UI    │    │  (Applications) │    │  (Email Test)   │
│  Port 8080      │    │  Port 27017     │    │  Port 8025      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Why Temporal? Key Benefits

### 1. **Reliability & Fault Tolerance**
- **Automatic Retries**: Failed activities retry with exponential backoff
- **Durable Execution**: Workflows survive service restarts and failures
- **Exactly-Once Semantics**: No duplicate processing even during failures

### 2. **Workflow Orchestration**
- **Complex Business Logic**: Multi-step processes with conditional logic
- **State Management**: Workflow state persisted automatically
- **Long-Running Processes**: Handle workflows that take minutes, hours, or days

### 3. **Observability & Debugging**
- **Visual Workflow UI**: See every step execution in Temporal Web UI
- **Complete History**: Full audit trail of all workflow executions
- **Real-time Monitoring**: Track workflow progress and performance

### 4. **Developer Experience**
- **Write Code, Not Infrastructure**: Focus on business logic, not distributed systems complexity
- **Type Safety**: Full TypeScript support with compile-time safety
- **Local Development**: Easy testing with local Temporal server

### 5. **Scalability**
- **Horizontal Scaling**: Add more workers to handle increased load
- **Load Distribution**: Temporal handles task routing and load balancing
- **Resource Management**: Efficient resource utilization across services

## 🔄 Application Workflow

This demo implements a **Loan Application Processing** workflow:

```mermaid
graph TD
    A[Application Submitted] --> B[Update Status: Processing]
    B --> C[Send Confirmation Email]
    C --> D[Process Payment]
    D --> E{Payment Success?}
    E -->|Yes| F[Generate Documents]
    E -->|No| G[Update Status: Failed]
    F --> H{Documents Created?}
    H -->|Yes| I[Send Success Email]
    H -->|No| G
    I --> J[Update Status: Completed]
    G --> K[Send Failure Email]
```

**Benefits in this workflow:**
- **Fault Tolerance**: If payment service is down, Temporal retries automatically
- **Consistency**: Either all steps complete or workflow is marked as failed
- **Observability**: Track exactly where each application is in the process
- **Compensation**: Easy to add rollback logic for failed payments

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (if running locally)
- pnpm package manager

### 1. Start with Docker (Recommended)

```bash
# Clone and navigate to project
git clone <repository-url>
cd background-jobs

# Start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **Temporal UI**: http://localhost:8080
- **Email Testing**: http://localhost:8025
- **Backend API**: http://localhost:3001/health

### 3. Try the Demo

1. **Submit Application**:
   - Choose application type (loan, mortgage, business, auto)
   - Click "Submit Application"
   - Random fake data is generated automatically

2. **Monitor Progress**:
   - Watch real-time status updates
   - View application details
   - Track workflow in Temporal UI

3. **Check Email**:
   - Open MailHog (localhost:8025)
   - See confirmation and completion emails

## 🛠️ Development Setup

### Local Development (without Docker)

```bash
# 1. Start infrastructure
docker-compose up temporal temporal-ui mongodb mailhog -d

# 2. Install dependencies for each service
cd backend-api && pnpm install
cd ../payment-service && pnpm install
cd ../document-service && pnpm install
cd ../frontend && pnpm install

# 3. Start services in separate terminals
cd backend-api && pnpm dev      # Terminal 1
cd payment-service && pnpm dev  # Terminal 2
cd document-service && pnpm dev # Terminal 3
cd frontend && pnpm dev         # Terminal 4

# 4. Start Temporal Worker
cd backend-api && pnpm worker:dev # Terminal 5
```

## 📁 Project Structure

```
background-jobs/
├── backend-api/              # Main API + Temporal workflows
│   ├── src/
│   │   ├── temporal/
│   │   │   ├── workflows/    # Workflow definitions
│   │   │   ├── activities/   # Activity implementations
│   │   │   └── worker.ts     # Temporal worker
│   │   ├── routes/           # Express API routes
│   │   ├── db/              # MongoDB integration
│   │   └── types/           # TypeScript types
│   └── Dockerfile
├── payment-service/          # Payment processing microservice
│   ├── src/
│   │   ├── routes/          # Payment API endpoints
│   │   ├── services/        # Payment gateway logic
│   │   └── types/           # Payment types
│   └── Dockerfile
├── document-service/         # Document generation microservice
│   ├── src/
│   │   ├── routes/          # Document API endpoints
│   │   ├── services/        # Document generator
│   │   └── types/           # Document types
│   └── Dockerfile
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── lib/            # API client
│   │   └── types/          # Frontend types
│   └── Dockerfile
├── docker-compose.yml        # Complete development environment
├── mongo-init/              # MongoDB initialization
└── dynamicconfig/           # Temporal configuration
```

## 🔧 Configuration

### Environment Variables

**Backend API** (`.env`):
```env
PORT=3001
TEMPORAL_ADDRESS=localhost:7233
MONGODB_URI=mongodb://admin:password@localhost:27017/applications
SMTP_HOST=localhost
SMTP_PORT=1025
PAYMENT_SERVICE_URL=http://localhost:3002
DOCUMENT_SERVICE_URL=http://localhost:3003
```

**Services** customize behavior:
- `PAYMENT_SUCCESS_RATE`: Control payment failure rate (0.95 = 95% success)
- `PAYMENT_PROCESSING_DELAY_MS`: Simulate payment processing time
- `DOCUMENT_GENERATION_DELAY_MS`: Simulate document generation time

## 🧪 Testing & Demo Scenarios

### 1. Happy Path
- Submit loan application
- Watch all steps complete successfully
- Check emails in MailHog

### 2. Failure Scenarios
- Lower `PAYMENT_SUCCESS_RATE` to see payment failures
- Stop payment service to see retry behavior
- Check Temporal UI for retry attempts

### 3. Scale Testing
- Submit multiple applications simultaneously
- Watch Temporal distribute work across workers
- Monitor performance in Temporal UI

## 📊 Monitoring & Observability

### Temporal Web UI (localhost:8080)
- **Workflow Executions**: See all running and completed workflows
- **Activity Details**: Drill down into individual activity executions
- **Retry Information**: View retry attempts and failure reasons
- **Performance Metrics**: Monitor workflow duration and throughput

### Application Logs
```bash
# View logs for specific service
docker-compose logs -f backend-api
docker-compose logs -f temporal-worker
docker-compose logs -f payment-service
```

### Email Testing
- **MailHog UI**: http://localhost:8025
- View all emails sent by the application
- Test email templates and content

## 🔄 Workflow Benefits Demonstrated

| Traditional Approach | With Temporal |
|---------------------|---------------|
| Complex retry logic | Automatic retries with policies |
| Manual state management | Durable workflow state |
| Distributed transaction complexity | Simple sequential code |
| Hard to debug failures | Visual workflow execution |
| Custom orchestration logic | Built-in workflow engine |
| Operational overhead | Managed infrastructure |

## 📚 Learning Resources

- **Temporal Documentation**: https://docs.temporal.io/
- **TypeScript SDK**: https://typescript.temporal.io/
- **Temporal Samples**: https://github.com/temporalio/samples-typescript

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using Temporal, TypeScript, React, and Docker**