# MHW Solo Time Tracker

## Overview

A Monster Hunter World speedrun time tracker application that allows hunters to log and track their solo, duo, and squad hunt times across different monsters and weapons. The app calculates points based on hunt performance using a ranking system (gold, silver, bronze, skull) and displays an auto-updating leaderboard-style sheet.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom Monster Hunter-themed color palette (dark theme with cyan primary, gold accent)
- **Fonts**: Rajdhani (display) and Inter (body text) from Google Fonts

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Build System**: Vite for frontend, esbuild for server bundling

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains table definitions
- **Tables**: 
  - `hunts` - stores hunt records with monster ID, weapon ID, time, mode (solo/duo/squad), attempts, and PB flag
- **Validation**: Zod schemas generated from Drizzle schema using drizzle-zod

### Key Design Patterns
- **Monorepo Structure**: Client code in `/client`, server in `/server`, shared types in `/shared`
- **Path Aliases**: `@/` for client src, `@shared/` for shared code
- **API Request Pattern**: Centralized `apiRequest` helper with automatic error handling
- **Storage Abstraction**: `IStorage` interface implemented by `DatabaseStorage` class for database operations

### Development vs Production
- Development: Vite dev server with HMR, proxied through Express
- Production: Static files served from `dist/public`, server bundled to `dist/index.cjs`

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database operations
- connect-pg-simple for session storage capability

### UI Libraries
- Radix UI primitives (dialogs, dropdowns, tooltips, etc.)
- Lucide React for icons
- Embla Carousel for carousel functionality
- cmdk for command palette
- date-fns for date formatting

### Build Tools
- Vite with React plugin
- Tailwind CSS v4 with @tailwindcss/vite plugin
- esbuild for server bundling
- TypeScript for type checking

### Replit-Specific
- @replit/vite-plugin-runtime-error-modal for development error overlay
- @replit/vite-plugin-cartographer and dev-banner for Replit integration (dev only)
- Custom meta-images plugin for OpenGraph image handling