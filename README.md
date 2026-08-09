# VSA Website

A full-stack web application for the Vietnamese Student Association (VSA) at Green River College. This application provides a comprehensive platform for managing events, products, and user accounts with secure authentication and email notification features.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Docker Deployment](#docker-deployment)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

The VSA Website is designed to streamline operations for the Vietnamese Student Association, providing tools for:
- Event management and registration
- Product catalog and inventory
- User authentication and account management
- Email notifications and communications
- File upload and storage capabilities

## Features

### Authentication & Security
- JWT-based token authentication
- User account creation and management
- Email verification for new accounts
- Password reset functionality
- Secure password storage

### Event Management
- Create, read, update, and delete events
- Event listing and filtering
- Event registration for users
- File upload support for event images

### Product Management
- Product catalog management
- Product search and browsing
- Product image uploads
- Inventory tracking

### Email Service
- Welcome emails for new users
- Password reset email notifications
- Event update notifications
- Email verification for account activation

### File Management
- Secure file upload to server
- Image storage and retrieval
- 10MB maximum file size limit
- Organized file structure

## Tech Stack

### Backend
- **Framework:** Spring Boot 4.1.0
- **Language:** Java 17
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Email:** Spring Mail with Gmail SMTP
- **Build Tool:** Maven
- **Testing:** JUnit with 70% code coverage requirement
- **Code Quality:** JaCoCo for coverage, Spotless for formatting

### Frontend
- **Framework:** React 19.2.7
- **Build Tool:** Vite 8.1.0
- **Linting:** ESLint
- **Styling:** CSS

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Web Server:** Nginx (Frontend)
- **Database Server:** PostgreSQL

## Prerequisites

### Required
- Docker and Docker Compose (for containerized setup)
- OR
  - Java 17 or higher
  - Node.js 18+ and npm
  - PostgreSQL 12+

### Optional
- Maven 3.6+ (if building backend without Docker)
- Git for version control

## Installation & Setup

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VSA-website
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables** (see [Configuration](#configuration) section)

4. **Build and start services**
   ```bash
   docker-compose up --build
   ```

5. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8080

### Manual Setup (Development)

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   ./mvnw clean install
   ```

3. **Configure application.yaml**
   ```yaml
   # Set environment variables or update src/main/resources/application.yaml
   DB_URL: jdbc:postgresql://localhost:5432/vsa_db
   DB_USERNAME: postgres
   DB_PASSWORD: your_password
   JWT_SECRET: your_secret_key
   MAIL_USERNAME: your_email@gmail.com
   MAIL_PASSWORD: your_app_password
   ```

4. **Run the application**
   ```bash
   ./mvnw spring-boot:run
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DB_URL=jdbc:postgresql://postgres:5432/vsa_db
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_very_secure_secret_key_here

# Email Configuration (Gmail)
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_specific_password
```

### Important Notes

- **Gmail App Password:** To use Gmail for email notifications, enable "Less secure app access" or create an [App Password](https://support.google.com/accounts/answer/185833)
- **JWT Secret:** Use a strong, randomly generated secret key
- **Database:** Ensure PostgreSQL is running and accessible

## Running the Application

### Using Docker Compose

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

### Accessing Services

- **Frontend:** http://localhost (Nginx reverse proxy)
- **Backend API:** http://localhost:8080
- **Backend Health Check:** http://localhost:8080/actuator/health

## Project Structure

```
VSA-website/
├── backend/                          # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/vsa/
│   │   │   │   ├── BackendApplication.java
│   │   │   │   ├── config/          # Spring configurations
│   │   │   │   ├── controller/      # REST endpoints
│   │   │   │   ├── service/         # Business logic
│   │   │   │   ├── model/           # JPA entities
│   │   │   │   ├── repository/      # Data access
│   │   │   │   ├── security/        # JWT & authentication
│   │   │   │   └── exception/       # Custom exceptions
│   │   │   └── resources/
│   │   │       └── application.yaml # Configuration
│   │   └── test/                    # Unit tests
│   ├── pom.xml                      # Maven dependencies
│   ├── Dockerfile                   # Backend container config
│   └── uploads/                     # Uploaded files storage
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── api/                     # API client modules
│   │   ├── components/              # React components
│   │   ├── assets/                  # Images and static files
│   │   ├── App.jsx                  # Main component
│   │   └── main.jsx                 # Entry point
│   ├── package.json                 # npm dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── Dockerfile                   # Frontend container config
│   └── nginx.conf                   # Nginx configuration
└── docker-compose.yml               # Docker Compose configuration
```

## API Documentation

### Base URL
```
http://localhost:8080/api
```

### Main Endpoints

#### Users
- `POST /users/register` - Register new user
- `POST /users/login` - User login
- `GET /users/{id}` - Get user profile
- `PUT /users/{id}` - Update user profile
- `POST /users/verify-email` - Verify email address
- `POST /users/reset-password` - Request password reset

#### Events
- `GET /events` - List all events
- `GET /events/{id}` - Get event details
- `POST /events` - Create new event
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event
- `POST /events/{id}/register` - Register for event

#### Products
- `GET /products` - List all products
- `GET /products/{id}` - Get product details
- `POST /products` - Create new product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

#### File Upload
- `POST /files/upload` - Upload file
- `GET /files/{filename}` - Download file

## Development

### Code Quality Standards

- **Code Coverage:** Minimum 70% test coverage (enforced by JaCoCo)
- **Code Formatting:** Google Java Format via Spotless
- **Linting:** ESLint for JavaScript/React code

### Running Code Quality Checks

#### Backend
```bash
cd backend

# Run tests
./mvnw test

# Check code format
./mvnw spotless:check

# Format code automatically
./mvnw spotless:apply

# Generate coverage report
./mvnw clean verify
```

#### Frontend
```bash
cd frontend

# Check linting
npm run lint

# Format code
npm run lint -- --fix
```

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
./mvnw test

# Run specific test
./mvnw test -Dtest=EventServiceTest

# Generate test report
./mvnw surefire-report:report
```

### Frontend Tests

```bash
cd frontend

# Run linting checks
npm run lint
```

### Test Coverage

The project enforces 70% test coverage on key classes:
- `EventService`
- `EventController`
- `FileStorageService`

## Docker Deployment

### Building Docker Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Docker Files

- **Backend Dockerfile:** `/backend/Dockerfile` - Builds Java application
- **Frontend Dockerfile:** `/frontend/Dockerfile` - Builds React application
- **Nginx Config:** `/frontend/nginx.conf` - Nginx reverse proxy configuration

### Container Details

| Service | Port | Container Name |
|---------|------|-----------------|
| Backend | 8080 | vsa-backend |
| Frontend | 80 | vsa-frontend |
| PostgreSQL | 5432 | (via compose) |

### Persistent Volumes

- `uploads_data` - Stores uploaded files for persistence

## Contributing

### Getting Started

1. Clone the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed

## License

This project is part of the Vietnamese Student Association at Green River College.

---

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Change port in docker-compose.yml or kill process on port
lsof -i :8080  # Find process on port 8080
kill -9 <PID>  # Kill the process
```

**Database Connection Error**
- Ensure PostgreSQL is running
- Check credentials in environment variables
- Verify network connectivity

**Email Not Sending**
- Verify MAIL_USERNAME and MAIL_PASSWORD
- Use Gmail App Password (not regular password)
- Check Gmail account security settings

**Frontend Build Issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Support

For issues or questions, please reach out to the VSA Development Team or create an issue in the repository.

---

**Last Updated:** July 2026
