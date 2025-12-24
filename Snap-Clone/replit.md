# Snapchat Clone

## Overview

This is a Snapchat clone mobile application built with Expo/React Native for the frontend and Express.js for the backend. The app implements core Snapchat features including ephemeral photo/video messaging (snaps), stories, real-time chat, and friend management. The signature horizontal swipe navigation pattern is used, with the camera as the central/default screen.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: React Navigation with horizontal swipe gesture-based tabs (no traditional tab bar)
  - Three main screens: Chats (left), Camera (center/default), Stories (right)
  - Modal overlays for Profile, Add Friends, Story Viewer, Snap Viewer
- **State Management**: TanStack React Query for server state
- **Styling**: React Native's built-in styling with custom design tokens
- **Animations**: React Native Reanimated and Gesture Handler for smooth swipe interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with tsx for development
- **API Pattern**: RESTful JSON API at `/api/*` endpoints
- **Session Management**: Express-session with memorystore for development

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod

### Data Models
- **Users**: Profile info with username, display name, avatar
- **Friendships**: Bi-directional friend relationships with status tracking
- **Snaps**: Ephemeral messages with sender/receiver, media, duration, view status
- **Stories**: Time-limited posts (24h) with view tracking
- **Chats**: Persistent text messages between friends

### Web Client (Fallback)
- Static HTML/CSS/JS web client in `/public` directory
- Provides basic functionality for non-mobile access
- Uses same API endpoints as mobile app

### Path Aliases
- `@/*` maps to `./client/*`
- `@shared/*` maps to `./shared/*`

## External Dependencies

### Database
- **PostgreSQL**: Primary data store via `DATABASE_URL` environment variable
- **pg**: Node.js PostgreSQL client

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **tsx**: TypeScript execution for development server
- **ESLint + Prettier**: Code formatting with Expo's ESLint config

### Mobile-Specific Libraries
- **expo-haptics**: Tactile feedback
- **expo-image**: Optimized image loading
- **expo-blur/expo-glass-effect**: Visual effects
- **react-native-keyboard-controller**: Keyboard handling

### Deployment
- **Replit Integration**: Environment variables for `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS` handle CORS in development
- Build scripts support both development and production modes