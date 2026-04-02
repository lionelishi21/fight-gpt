# Fight GPT Node.js Backend Structure

This document describes the architecture and structure of the Fight GPT Node.js backend, which follows SOLID principles.

## Directory Structure

```
src/
├── config/              # Application configuration
│   ├── app.ts          # App configuration (environment variables)
│   └── database.ts     # Database connection management
│
├── controllers/         # HTTP request/response handlers (ES6 Classes)
│   ├── BaseController.ts       # Base controller with common functionality
│   ├── AnalysisController.ts   # Analysis endpoint handlers
│   └── HealthController.ts     # Health check endpoint handler
│
├── services/           # Business logic (ES6 Classes)
│   ├── BaseService.ts         # Base service with common functionality
│   ├── AiService.ts           # Communication with Python AI service
│   └── AnalysisService.ts     # Analysis workflow orchestration
│
├── repositories/       # Data access layer (Repository Pattern)
│   ├── BaseRepository.ts           # Base repository with CRUD operations
│   ├── AnalysisRepository.ts       # Analysis data access
│   └── AuditLogRepository.ts       # Audit log data access
│
├── models/            # Database models (Mongoose schemas)
│   ├── Analysis.ts    # Analysis document model
│   └── AuditLog.ts    # Audit log document model
│
├── routes/            # Route definitions
│   ├── index.ts              # Main routes configuration
│   ├── analysisRoutes.ts     # Analysis routes
│   └── healthRoutes.ts       # Health check routes
│
├── middleware/        # Express middleware
│   ├── errorMiddleware.ts       # Global error handler
│   ├── notFoundMiddleware.ts    # 404 handler
│   └── validationMiddleware.ts  # Request validation
│
├── helpers/          # Utility functions
│   ├── logger.ts     # Winston logger wrapper
│   └── uuidHelper.ts # UUID generation and validation
│
├── types/            # TypeScript type definitions
│   └── index.ts      # Shared types and interfaces
│
└── index.ts          # Application entry point
```

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)

Each class has a single, well-defined responsibility:

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain business logic only
- **Repositories**: Handle data access only
- **Models**: Define data structures only
- **Routes**: Define routing only
- **Middleware**: Handle cross-cutting concerns only

### Open/Closed Principle (OCP)

Classes are open for extension but closed for modification:

- **BaseController**: Extended by specific controllers without modification
- **BaseService**: Extended by specific services without modification
- **BaseRepository**: Extended by specific repositories without modification

### Liskov Substitution Principle (LSP)

Derived classes can substitute their base classes:

- All controllers extend `BaseController` and can be used interchangeably
- All services extend `BaseService` and follow the same contract
- All repositories extend `BaseRepository` and provide consistent interface

### Interface Segregation Principle (ISP)

Interfaces are specific and focused:

- `IAnalysisService`: Only analysis-related methods
- `IAiService`: Only AI service communication methods
- `IAnalysisRepository`: Only analysis data access methods

### Dependency Inversion Principle (DIP)

High-level modules depend on abstractions, not concretions:

- Controllers depend on service interfaces, not implementations
- Services depend on repository interfaces, not implementations
- All dependencies are injected through constructors

## Class Hierarchy

```
BaseController (abstract)
├── AnalysisController
└── HealthController

BaseService (abstract)
├── AiService
└── AnalysisService

BaseRepository<T> (abstract)
├── AnalysisRepository
└── AuditLogRepository
```

## Data Flow

```
HTTP Request
    ↓
Routes (validation)
    ↓
Controllers (HTTP handling)
    ↓
Services (business logic)
    ↓
Repositories (data access)
    ↓
Models (database)
```

## Example: Analysis Flow

1. **Route** (`analysisRoutes.ts`): Validates request with express-validator
2. **Controller** (`AnalysisController`): Extracts request data, handles HTTP
3. **Service** (`AnalysisService`): Orchestrates workflow:
   - Checks cache via Repository
   - Calls AI Service if needed
   - Caches result via Repository
4. **Repository** (`AnalysisRepository`): Performs data operations
5. **Model** (`Analysis`): Defines data structure
6. **Controller**: Sends HTTP response

## Benefits of This Architecture

1. **Maintainability**: Clear separation of concerns makes code easy to understand and modify
2. **Testability**: Each layer can be tested independently with mock dependencies
3. **Scalability**: Easy to add new features by extending base classes
4. **Flexibility**: Dependencies are injected, making it easy to swap implementations
5. **SOLID Compliance**: Follows all five SOLID principles

