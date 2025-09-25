# Certificate Generation System - Complete Project Context

## Project Overview

Project Name: Certification Mails API  
Version: 1.0.0  
Framework: NestJS 11.0.1 + TypeScript  
Database: MySQL (AWS RDS)  
Node Version: 22-alpine  
Port: 3969 (external) → 3000 (internal)  
API Prefix: /api/v1  
Documentation: Available at /api/docs (Swagger)  

### Business Purpose
Sistema de generación y envío automatizado de certificados en PDF para eventos corporativos. Permite:
- Gestión de usuarios administrativos con autenticación JWT
- Configuración de plantillas de certificados personalizables
- Carga masiva de asistentes a eventos
- Generación automática de certificados en PDF usando Puppeteer
- Almacenamiento en Amazon S3 con estructura organizada
- Envío automatizado por email usando SendGrid con templates
- Sistema de trabajos en cola para procesamiento en segundo plano
- Descarga pública de certificados sin autenticación

## Technical Architecture

### Core Technologies Stack
```json
{
  "backend": "NestJS 11.0.1",
  "language": "TypeScript",
  "database": "MySQL 8.0+ (AWS RDS)",
  "orm": "TypeORM 0.3.27",
  "authentication": "JWT (@nestjs/jwt 11.0.0)",
  "password_hashing": "bcryptjs 3.0.2",
  "pdf_generation": "Puppeteer 24.22.3",
  "file_storage": "AWS S3 (@aws-sdk/client-s3 3.896.0)",
  "email_service": "SendGrid (@sendgrid/mail 8.1.6)",
  "api_documentation": "Swagger (@nestjs/swagger 11.2.0)",
  "validation": "class-validator 0.14.2 + class-transformer 0.5.1",
  "testing": "Jest (unit tests integrated in CI/CD)",
  "containerization": "Docker + Docker Compose"
}
```

### Database Schema
All table and column names are in English with snake_case convention

1. users (Administrative users)
   - `id` (PK, auto-increment)
   - `user_name` (unique, varchar(100))
   - `name` (varchar(100))
   - `last_name` (varchar(100))
   - `email` (unique, varchar)
   - `password` (hashed with bcryptjs)
   - `created_at`, `updated_at`

2. certificates (Certificate configuration)
   - `id` (PK, auto-increment)
   - `client` (varchar - client/company name)
   - `name` (varchar - certificate name)
   - `event_name` (varchar - event name)
   - `base_design_url` (varchar - S3 background image URL)
   - `pdf_template` (varchar - internal HTML template reference)
   - `sendgrid_template_id` (varchar - SendGrid template ID)
   - `event_link` (varchar - event URL for emails)
   - `is_active` (boolean - active status)
   - `created_at`, `updated_at`

3. attendees (Event participants)
   - `id` (PK, auto-increment)
   - `full_name` (varchar - complete name)
   - `country` (varchar)
   - `document_type` (varchar)
   - `document_number` (varchar - required)
   - `gender` (varchar)
   - `email` (varchar - required)
   - `created_at`, `updated_at`

4. generated_certificates (Certificate instances)
   - `id` (PK, auto-increment)
   - `certificate_id` (FK → certificates)
   - `attendee_id` (FK → attendees)
   - `s3_url` (varchar - full PDF URL in S3)
   - `generated_at` (timestamp)
   - `is_sent` (boolean - email sent status)
   - `created_at`, `updated_at`

5. jobs (Email queue management)
   - `id` (PK, auto-increment)
   - `generated_certificate_id` (FK → generated_certificates)
   - `status` (enum: 'pending', 'sent', 'error')
   - `attempted_at` (timestamp nullable)
   - `error_message` (text nullable)
   - `created_at`, `updated_at`

### File Structure
```
src/
├── app.controller.ts           # Health endpoint
├── app.module.ts              # Main application module
├── main.ts                    # Bootstrap application
├── auth/                      # Authentication module
│   ├── controllers/
│   │   └── auth.controller.ts # Login endpoint
│   ├── services/
│   │   └── auth.service.ts    # JWT authentication logic
│   ├── guards/
│   │   ├── jwt-auth.guard.ts  # JWT protection guard
│   │   └── jwt.strategy.ts    # JWT strategy
│   ├── dto/
│   │   └── login-user.dto.ts  # Login validation DTO
│   └── modules/
│       └── auth.module.ts     # Auth module configuration
├── users/                     # User management
├── certificates/              # Certificate configuration
│   ├── templates/
│   │   └── default.html       # HTML certificate template
├── attendees/                 # Event participants
├── generated-certificates/    # Certificate instances
├── jobs/                      # Background job processing
└── shared/
    └── services/
        ├── pdf-generator.service.ts  # Puppeteer PDF generation
        ├── s3.service.ts            # AWS S3 file operations
        └── email.service.ts         # SendGrid email sending
```

## Authentication & Security

### JWT Implementation
- Token Duration: 3 days
- Algorithm: HS256
- Guard: JwtAuthGuard protects all admin endpoints
- Public Endpoints: Health check, certificate download
- Payload Structure:
```typescript
{
  id: number,
  name: string,
  last_name: string,
  email: string,
  username: string
}
```

### CORS Configuration
- Origin: * (wildcard - allows all origins)
- Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Headers: Unrestricted
- Credentials: Not included

### Password Security
- Hashing: bcryptjs with salt rounds: 10
- Validation: Plain text comparison with hashed password

## PDF Generation System

### Technology: Puppeteer with Chromium
- Template Engine: HTML + CSS with dynamic placeholder replacement
- Template Location: src/certificates/templates/default.html
- Image Support: Background images from S3
- Format: A4, print background enabled, CSS page size preferred
- Font Support: Custom fonts (Ancizar Serif, Montserrat)

### Template Structure
```html
<!-- Professional certificate template with placeholders -->
{{full_name}}        <!-- Attendee's full name -->
{{event_name}}       <!-- Event name -->
{{client}}           <!-- Client/company name -->
{{certificate_name}} <!-- Certificate title -->
```

### Styling Features
- Responsive design with CSS Grid
- Custom typography and spacing
- Professional color scheme
- Print-optimized layout

## AWS S3 Integration

### File Organization
```
bucket-name/
└── certificates/
    └── {client}_{year}/
        └── {id}_{name}.pdf
```

### Configuration
- Service: AWS S3 SDK v3
- Region: Configurable via environment
- Access: Public read for certificate downloads
- CDN: CloudFront distribution available
- Upload Strategy: Direct upload with generated filename

## SendGrid Email System

### Template-Based Emails
- Service: SendGrid with template IDs stored per certificate
- Attachments: PDF certificates attached to emails
- Dynamic Content: Event links, download links
- Personalization: Recipient name, certificate details

### Email Content
- PDF certificate attachment
- Link to event (event_link from certificate config)
- Public download link: /api/v1/certificate/{id}/download
- SendGrid template with dynamic substitutions

## Background Job Processing

### Queue System
- Database-Based: Jobs stored in jobs table
- Status Tracking: pending → sent/error
- Error Handling: Error messages stored for debugging
- Retry Logic: Manual retry capability via API
- Batch Processing: Process all pending jobs endpoint

### Job Lifecycle
1. Certificate generation creates job record
2. Job processor sends email via SendGrid
3. Status updated based on success/failure
4. Error messages logged for failed attempts

## Docker Configuration

### Multi-Stage Build
```dockerfile
# Stage 1: Builder (with dev dependencies)
FROM node:22-alpine AS builder
# - Install all dependencies (including dev)
# - Run unit tests (FAIL FAST if tests fail)
# - Build application

# Stage 2: Production
FROM node:22-alpine AS production
# - Install only production dependencies
# - Install Chromium for Puppeteer
# - Copy built application
# - Run as non-root user (nestjs)
```

### Fail-Fast Testing
- Tests run BEFORE build in Docker
- If tests fail: Build stops immediately, no deployment
- If tests pass: Continues with build and deployment
- Coverage: 6 test suites, 18 tests passing

### Docker Compose Services
```yaml
services:
  app:                    # Main NestJS application
    build: .
    ports: ["3969:3000"]
    env_file: .env
    
  db-check:              # Database connectivity verification
    image: mysql:8.0
    # Validates MySQL connection before app starts
```

## Testing Strategy

### Unit Tests Implemented
- Jest Framework: Integrated testing with mocks
- Coverage Areas:
  - Authentication (AuthService, AuthController)
  - Application health (AppController)
  - User operations (UsersService)
  - Certificate management (CertificatesService)
  - Shared services (PDF, S3, Email)

### Test Structure
```typescript
// Mock Strategy Example
const mockService = {
  method: jest.fn(),
};

// Dependency Injection Mocking
providers: [
  ServiceClass,
  {
    provide: DependencyClass,
    useValue: mockService,
  },
],
```

### CI/CD Integration
- Tests automatically run in Docker build process
- Build fails if any test fails (fail-fast strategy)
- No deployment without passing tests

## API Endpoints Documentation

### Public Endpoints (No Authentication)
```
GET  /api/v1/health                           # Application health check
GET  /api/v1/certificate/{id}/download        # Public certificate download
```

### Authentication Endpoints
```
POST /api/v1/auth/login                       # User login (returns JWT)
```

### Protected Endpoints (JWT Required)
```
# Users
POST   /api/v1/users                          # Create user
GET    /api/v1/users                          # List users
GET    /api/v1/users/{id}                     # Get user details
PATCH  /api/v1/users/{id}                     # Update user
DELETE /api/v1/users/{id}                     # Delete user

# Certificates
POST   /api/v1/certificates                   # Create certificate config
GET    /api/v1/certificates                   # List certificates
GET    /api/v1/certificates/active            # List active certificates
GET    /api/v1/certificates/{id}              # Get certificate details
PATCH  /api/v1/certificates/{id}              # Update certificate
PUT    /api/v1/certificates/{id}/toggle-active # Toggle active status
DELETE /api/v1/certificates/{id}              # Delete certificate

# Attendees
POST   /api/v1/attendees                      # Create attendee
POST   /api/v1/attendees/bulk                 # Bulk create attendees
GET    /api/v1/attendees                      # List attendees
GET    /api/v1/attendees/{id}                 # Get attendee details
PATCH  /api/v1/attendees/{id}                 # Update attendee
DELETE /api/v1/attendees/{id}                 # Delete attendee

# Generated Certificates
POST   /api/v1/generated-certificates/generate # Generate certificates
POST   /api/v1/generated-certificates/{id}/send-email # Send certificate email
GET    /api/v1/generated-certificates         # List generated certificates
GET    /api/v1/generated-certificates/{id}    # Get certificate details
DELETE /api/v1/generated-certificates/{id}    # Delete certificate

# Background Jobs
GET    /api/v1/jobs                           # List jobs
GET    /api/v1/jobs/pending                   # List pending jobs
POST   /api/v1/jobs/process-pending           # Process all pending jobs
POST   /api/v1/jobs/{id}/retry                # Retry failed job
GET    /api/v1/jobs/{id}                      # Get job details
```

## Environment Configuration

### Required Environment Variables
```bash
# Database
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=certificaciones_mails

# JWT
JWT_SECRET=your-jwt-secret

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket-name
AWS_S3_CDN_URL=your-cloudfront-url

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Application
PORT=3969
API_PREFIX=api/v1
NODE_ENV=production
```

## Development Workflow

### Local Development
```bash
npm install              # Install dependencies
npm run migration:run    # Run database migrations
npm run dev             # Start development server with hot reload
npm test                # Run unit tests
npm run build           # Build for production
```

### Docker Development
```bash
docker-compose up --build    # Build and run with tests
docker-compose down          # Stop all services
docker-compose logs app      # View application logs
```

### Database Management
```bash
npm run migration:generate -- src/migrations/MigrationName  # Generate migration
npm run migration:run                                        # Run migrations
npm run migration:revert                                     # Revert last migration
```

## Business Workflow

### Complete Certificate Generation Process
1. Admin Setup:
   - Login with JWT authentication
   - Create certificate configuration (template, SendGrid template, S3 background)
   - Upload attendee list (bulk or individual)

2. Certificate Generation:
   - Select certificate configuration and attendees
   - System generates PDFs using Puppeteer with HTML templates
   - PDFs uploaded to S3 with organized naming: `certificates/{client}_{year}/{id}_{name}.pdf`
   - Database records created linking certificates to attendees

3. Email Distribution:
   - Jobs created in background queue
   - SendGrid emails sent with PDF attachments
   - Email includes event link and public download link
   - Job status tracked (pending/sent/error)

4. Public Access:
   - Recipients can download certificates via public link
   - No authentication required for downloads
   - PDFs regenerated in real-time if needed

## Production Considerations

### Performance
- PDF Generation: Optimized with Puppeteer pool
- File Storage: Direct S3 upload, CDN distribution
- Database: Indexed foreign keys and search columns
- Memory: Puppeteer configured for Alpine Linux

### Security
- CORS: Configured for cross-origin access
- Authentication: JWT with reasonable expiration
- File Access: Public S3 URLs for certificates only
- Validation: Comprehensive DTO validation on all inputs

### Monitoring
- Health Endpoint: /api/v1/health for load balancers
- Logging: Structured logging for all operations
- Error Tracking: Database-stored job errors
- Docker Health Checks: Container health monitoring

## Future Enhancement Opportunities

### Immediate Improvements
- Email Templates: Multiple template support per certificate type
- Certificate Themes: Multiple HTML templates with theme selection
- Bulk Operations: Enhanced bulk processing with progress tracking
- File Management: Template upload interface for admins

### Advanced Features
- Analytics Dashboard: Certificate generation and distribution metrics
- QR Code Integration: Verification QR codes on certificates
- Multi-language Support: Internationalization for templates and emails
- Webhook Integration: Real-time notifications for external systems

### Technical Enhancements
- Redis Queue: Replace database queue with Redis for better performance
- Microservices: Split PDF generation into separate service
- GraphQL API: Alternative API interface for complex queries
- Advanced Testing: Integration tests with database and external services

## Knowledge Base

### Key Design Decisions
1. **NestJS Choice**: Modular architecture, built-in TypeScript support, enterprise-ready
2. **Puppeteer over alternatives**: Better HTML/CSS control, consistent rendering
3. **Database queue over Redis**: Simpler deployment, transactional consistency
4. **JWT over sessions**: Stateless, scalable, mobile-friendly
5. S3 direct upload: Reduced server load, better scalability

### Common Issues & Solutions
1. **Puppeteer Memory**: Alpine Linux with Chromium dependencies installed
2. **PDF Fonts**: Custom fonts loaded via CSS in templates
3. **CORS Issues**: Wildcard configuration for development flexibility
4. **Database Connections**: Connection pooling configured in TypeORM
5. File Naming: Consistent naming strategy prevents conflicts

### Debugging Tips
- PDF Issues: Check template syntax and Puppeteer console logs
- Email Failures: Verify SendGrid template IDs and API key
- Auth Problems: Validate JWT secret and token expiration
- S3 Errors: Confirm bucket permissions and region settings
- Database Issues: Check migration status and connection string

---

## Project Status: PRODUCTION READY

Complete Implementation: All core features implemented and tested  
Docker Deployment: Multi-stage build with fail-fast testing  
Security: JWT authentication, CORS configuration, input validation  
Testing: Comprehensive unit test suite with CI/CD integration  
Documentation: Full Swagger API documentation available  
Error Handling: Centralized exception handling and logging  
Performance: Optimized for production workloads  

Last Updated: September 25, 2025  
Claude Context: This system is ready for production deployment and can serve as the foundation for advanced certificate management features.