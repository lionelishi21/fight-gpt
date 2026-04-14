# Fight GPT Node.js Backend 🥋

Express.js + TypeScript API Gateway for Fight GPT platform. This backend follows SOLID principles and provides a clean, maintainable architecture.

## Architecture

This project follows a layered architecture with clear separation of concerns:

```
src/
├── config/          # Application configuration
├── controllers/     # HTTP request/response handlers (ES6 classes)
├── services/        # Business logic (ES6 classes)
├── repositories/    # Data access layer (Repository pattern)
├── models/          # Database models (Mongoose schemas)
├── routes/          # Route definitions
├── middleware/      # Express middleware
├── helpers/         # Utility functions
├── types/           # TypeScript type definitions
└── index.ts         # Application entry point
```

## SOLID Principles

- **Single Responsibility Principle (SRP)**: Each class has one reason to change
- **Open/Closed Principle (OCP)**: Classes are open for extension, closed for modification
- **Liskov Substitution Principle (LSP)**: Derived classes can substitute base classes
- **Interface Segregation Principle (ISP)**: Interfaces are specific and focused
- **Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions

## Features

- ✅ Express.js with TypeScript
- ✅ ES6 Classes for controllers, services, and repositories
- ✅ Repository Pattern for data access
- ✅ Service Layer for business logic
- ✅ Controller Layer for HTTP handling
- ✅ Request validation with express-validator
- ✅ Rate limiting
- ✅ CORS support
- ✅ Security headers with Helmet
- ✅ MongoDB integration with Mongoose
- ✅ Logging with Winston
- ✅ Error handling middleware
- ✅ Audit logging
- ✅ Health check endpoint

## Installation

```bash
npm install
```

## Configuration

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** and replace `<db_password>` with your actual MongoDB password:

   ```env
   PORT=3000
   NODE_ENV=development

   AI_SERVICE_URL=http://localhost:8000
   AI_SERVICE_TIMEOUT=600000

   # Replace <db_password> with your actual database password
   # Username: app_user
   # Cluster: cluster0.f7ssjug.mongodb.net
   # Database: fight_gpt
   MONGODB_URI=mongodb+srv://app_user:<db_password>@cluster0.f7ssjug.mongodb.net/fight_gpt?retryWrites=true&w=majority&appName=Cluster0

   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   CORS_ORIGIN=http://localhost:5173

   LOG_LEVEL=info
   ```

   **MongoDB Connection Details:**
   - Username: `app_user`
   - Cluster: `cluster0.f7ssjug.mongodb.net`
   - Database: `fight_gpt`
   
   See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed setup instructions and troubleshooting.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Start Production Server

```bash
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Analyze Video
```
POST /api/analyze
Content-Type: application/json

{
  "youtube_url": "https://www.youtube.com/watch?v=...",
  "game_id": "sf6"
}
```

Or:

```json
{
  "video_path": "uploads/video.mp4",
  "game_id": "sf6"
}
```

### Get Analysis
```
GET /api/analysis/:id
```

## Project Structure

### Controllers
- `BaseController`: Base class with common functionality
- `AnalysisController`: Handles analysis requests
- `HealthController`: Handles health check requests

### Services
- `BaseService`: Base class with common functionality
- `AiService`: Communicates with Python AI service
- `AnalysisService`: Orchestrates analysis workflow

### Repositories
- `BaseRepository`: Base repository with CRUD operations
- `AnalysisRepository`: Analysis data access
- `AuditLogRepository`: Audit log data access

### Models
- `Analysis`: Analysis document model
- `AuditLog`: Audit log document model

## Testing

```bash
npm test
```

## Linting

```bash
npm run lint
```

## Type Checking

```bash
npm run type-check
```

 
