# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Starts Vite development server on port 5173
- **Build**: `npm run build` - Creates production build using Vite
- **Lint**: `npm run lint` - Runs ESLint on all JavaScript/JSX files
- **Preview**: `npm run preview` - Previews the production build locally

## Architecture Overview

This is a React-based frontend application for SharkBoot, a platform with assistants, chat functionality, and user management features.

### Tech Stack
- **Frontend**: React 19.1.0 with Vite as build tool
- **Styling**: TailwindCSS with PostCSS
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM v6
- **Icons**: Hero Icons and React Icons
- **Internationalization**: i18next with react-i18next

### Project Structure
```
src/
├── pages/           # Main application pages (Login, Register, Dashboard, etc.)
├── navigation/      # Navigation components (Sidebar)
├── modals/         # Modal components (AssistantModal, KnowledgeModal)
├── utils/          # Utility components and functions
├── config/         # Configuration files
└── assets/         # Static assets
```

### Key Architecture Patterns

**Environment Configuration**: The app uses `src/config/config.jsx` to manage different URLs for development and production environments. It automatically detects the environment and configures backend/frontend URLs accordingly.

**User-Specific Caching**: A sophisticated user cache system in `src/utils/userCache.js` manages localStorage data per user, using JWT token parsing to determine user IDs and create user-specific cache keys.

**Route Protection**: The app uses a layout pattern where protected routes are wrapped with a Sidebar component in a flex layout, while public routes (login/register) render without the sidebar.

**React Query Setup**: Global React Query client is configured with retry limits and window focus refetch disabled for better UX.

## Configuration Details

- **ESLint**: Modern flat config with React hooks and refresh plugins
- **Vite**: Standard React setup with hot module replacement
- **TailwindCSS**: Configured to scan all HTML and JSX files for classes
- **Environment Detection**: Automatic dev/prod detection based on hostname and port

## Development Notes

- The app connects to a Railway-deployed backend API
- JWT authentication with automatic token parsing
- User data isolation using localStorage with user-specific keys
- Extensive console logging for debugging (particularly in userCache.js)
- React Query provides global query client access via `globalThis.__REACT_QUERY_CLIENT__`