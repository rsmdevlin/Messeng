# NeoGram - Full-Stack Chat Application

## Overview

NeoGram is a full-stack real-time chat application built with React, Express.js, and PostgreSQL. It features a modern UI with shadcn/ui components, real-time messaging via WebSockets, user authentication, and admin functionality. The application uses a dark theme with green accent colors inspired by the Matrix aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication with bcrypt password hashing
- **Real-time Communication**: WebSocket server for live messaging
- **API Design**: RESTful API with proper error handling and logging

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Comprehensive schema including users, chats, messages, chat participants, favorites, voice rooms, and sessions
- **Relations**: Proper foreign key relationships between entities
- **Migrations**: Database migrations managed through Drizzle Kit

## Key Components

### Authentication System
- Session-based authentication with secure token storage
- Password hashing using bcrypt
- Protected routes with automatic token validation
- User registration and login with proper error handling

### Chat System
- Real-time messaging using WebSocket connections
- Private and group chat support
- Message history with pagination
- Chat participant management
- Favorites system for important messages

### Admin Panel
- Role-based access control
- User management capabilities
- System statistics and monitoring
- Admin-only features and routes

### UI Components
- Responsive design with mobile-first approach
- Dark theme with Matrix-inspired color scheme
- Comprehensive component library using shadcn/ui
- Custom toast notifications and loading states

## Data Flow

1. **Authentication Flow**: User logs in → Session created → Token stored in localStorage → Token sent with API requests
2. **Chat Flow**: User sends message → WebSocket broadcasts to chat participants → Database stores message → UI updates in real-time
3. **Real-time Updates**: WebSocket connection maintains live communication for instant message delivery

## External Dependencies

### Frontend Dependencies
- React ecosystem (React Query, React Hook Form, Wouter)
- UI components from Radix UI
- Tailwind CSS for styling
- Lucide React for icons
- Date-fns for date handling

### Backend Dependencies
- Express.js framework
- Neon Database serverless driver for PostgreSQL
- Drizzle ORM for database operations
- WebSocket server for real-time communication
- bcrypt for password hashing

### Development Tools
- TypeScript for type safety
- Vite for build tooling
- ESBuild for server bundling
- Replit integration for development environment

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- Express server with TypeScript compilation
- Database connection via Neon Database
- WebSocket server integrated with HTTP server

### Production Build
- Frontend: Vite build with optimized bundle
- Backend: ESBuild compilation to single bundle
- Static file serving from Express
- Environment variables for database connection

### Database Management
- Drizzle Kit for schema management
- PostgreSQL via Neon Database serverless
- Connection pooling for optimal performance
- Migration system for schema updates

### Configuration
- Environment-based configuration
- Database URL required for operation
- WebSocket integration with HTTP server
- CORS and security headers configured

The application follows a monorepo structure with shared TypeScript types and utilities, enabling type-safe communication between frontend and backend components.