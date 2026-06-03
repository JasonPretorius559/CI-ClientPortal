# Cloud Insure User Portal - Project Guide

## Project Overview

**Cloud Insure User Portal** is a React-based application for managing insurance cases with AI-powered analysis capabilities. The portal allows users to view case details, run AI analysis on case documents, and download analysis reports.

### Key Technologies
- **Frontend Framework**: React 19 with TypeScript
- **State Management**: React Query for data fetching and caching
- **Styling**: Tailwind CSS with custom UI components
- **Build Tool**: Vite
- **API Communication**: Custom fetch wrapper with credentials handling
- **UI Components**: Custom component library with Lucide React icons

### High-Level Architecture
The application follows a feature-based structure:
- `src/features/` - Contains domain-specific features (cases, auth)
- `src/components/` - Reusable UI components organized by type (forms, layout, ui)
- `src/lib/` - Utility functions and shared services
- `src/pages/` - Page-level components
- `src/routes/` - Routing configuration

## Getting Started

### Prerequisites
- Node.js (version compatible with project dependencies)
- npm or yarn package manager
- Access to the Cloud Insure API backend

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Configure `VITE_API_BASE_URL` and other required variables
4. Start the development server:
   ```bash
   npm run dev
   ```

### Basic Usage
1. Navigate to the application in your browser (typically http://localhost:5173)
2. Authenticate using the login system
3. Browse cases in the dashboard
4. Click on a case to view details
5. Use the "Run Analysis" button to initiate AI analysis
6. Monitor progress in the Analysis Banner and Thinking Card
7. View results in the Analysis Versions and Selected Analysis sections
8. Download reports using the download functionality

### Running Tests
The project currently doesn't have a test command configured in package.json. Testing would typically involve:
- Unit tests with Jest/Vitest
- Component tests with React Testing Library
- E2E tests with Cypress or Playwright

## Project Structure

### Main Directories
- `src/` - Source code root
  - `components/` - Reusable UI components
    - `forms/` - Form-related components
    - `layout/` - Layout components (headers, footers, etc.)
    - `ui/` - Primitive UI components (buttons, cards, badges, etc.)
  - `features/` - Feature-specific code
    - `auth/` - Authentication-related functionality
    - `cases/` - Case management and analysis features
  - `lib/` - Utility functions and shared services
    - `api.ts` - API client and error handling
    - `dates.ts` - Date formatting utilities
    - `queryClient.ts` - React Query client configuration
    - `user.ts` - User-related utilities
    - `cn.ts` - Class name utility (tailwind-merge)
  - `pages/` - Page-level components
  - `routes/` - Application routing
  - `App.tsx` - Root application component
  - `main.tsx` - Application entry point

### Key Files
- `src/features/cases/CaseDetails.tsx` - Main case details view with AI analysis
- `src/features/cases/cases.api.ts` - API calls for case operations
- `src/features/cases/cases.utils.ts` - Utilities for processing case data
- `src/lib/api.ts` - Base API functionality and error handling
- `src/lib/dates.ts` - Date formatting helpers
- `src/components/ui/` - Reusable UI components (Button, Card, Badge, etc.)

### Important Configuration Files
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint configuration
- `postcss.config.js` - PostCSS configuration
- `package.json` - Project dependencies and scripts

## Development Workflow

### Coding Standards
- **Language**: TypeScript with strict type checking
- **Formatting**: Prettier (configured indirectly through IDE settings)
- **Linting**: ESLint with React and React Hooks plugins
- **Naming**: 
  - Components: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Files: PascalCase for components, camelCase for utilities
- **Imports**: 
  - Relative imports with `@/` alias (configured in tsconfig)
  - Grouped: external libraries, internal modules, relative paths
  - Alphabetized within groups

### Testing Approach
While not explicitly configured in the current setup, recommended practices include:
- Unit tests for utility functions and hooks
- Component tests for UI elements with various props and states
- Integration tests for API interactions and data flow
- Test coverage focus on complex logic in cases.utils.ts and cases.api.ts

### Build and Deployment Process
1. Development: `npm run dev` - starts Vite dev server with HMR
2. Build: `npm run build` - compiles TypeScript and builds optimized assets
3. Preview: `npm run preview` - serves the built application locally
4. Linting: `npm run lint` - runs ESLint on source files

### Contribution Guidelines
1. Create feature branches from main
2. Write descriptive commit messages
3. Ensure code passes linting before submitting PRs
4. Update documentation when changing APIs or functionality
5. Follow existing code patterns and conventions

## Key Concepts

### Domain-Specific Terminology
- **Case**: An insurance claim or policy analysis request
- **Analysis Version**: A specific iteration of AI analysis performed on a case
- **Input Hash**: A hash representing the input data used for analysis (for caching)
- **Status**: Current state of analysis (queued, running, completed, failed, etc.)
- **Confidence Score**: AI-generated confidence in the analysis results (0-1)
- **Satisfaction Score**: AI-generated satisfaction metric (0-5 scale)

### Core Abstractions
- **AnalysisVersion Type**: Defines the structure of analysis data returned from API
- **React Query**: Used for data fetching, caching, and background updates
- **Custom Hooks**: Encapsulated logic for analysis workflows (though implemented directly in components)
- **Utility Functions**: Reusable functions for data extraction and transformation

### Design Patterns
- **Container/Presentation**: Components separate data fetching logic from UI presentation
- **Higher-Order Components**: Not explicitly used, but patterns exist in component composition
- **Custom Hooks Pattern**: Encapsulation of reusable logic (useMutation, useQuery)
- **Error Boundaries**: Implemented through React Query's error handling
- **Loading States**: Managed through React Query's isPending/isLoading flags
- **Optimistic Updates**: Not currently implemented but could be added for better UX

## Common Tasks

### Running Analysis on a Case
1. Navigate to a case details page
2. Optionally provide inputHash and/or model parameters
3. Click the "Run Analysis" button
4. Monitor progress through:
   - Analysis Banner showing status
   - Thinking Card with animated messages
   - Refresh button to manually update status
5. Results appear in:
   - Analysis Versions list
   - Selected Analysis panel
   - Metrics cards (confidence, satisfaction, etc.)

### Downloading Analysis Reports
1. Ensure at least one completed analysis version exists
2. Click "Download Report" button
3. In the modal:
   - Select the desired analysis version (only completed versions are selectable)
   - View version details (dates, scores, model info)
   - Click "Download Selected Version"
4. The report downloads as a PDF file

### Viewing Analysis Logs
1. Scroll to the "Analysis Activity" section at the bottom
2. View chronological logs of analysis steps
3. Use the refresh button to update logs
4. Click "View Logs" button to scroll directly to logs section

### Filtering Cases by Status
- Case status badges show visual indicators
- Status colors indicate:
  - Outline tone: Completed analysis
  - Muted tone: Other statuses
- FormatStatus function standardizes status display

## Troubleshooting

### Common Issue: Cannot read properties of undefined (reading 'trim')
**Status**: FIXED

**Error**: 
```
Uncaught TypeError: Cannot read properties of undefined (reading 'trim')
at isCompleted (CaseDetails.tsx:142:25)
at CaseDetails (CaseDetails.tsx:639:30)
```

**Solution Applied**: The `isCompleted` function in `src/features/cases/CaseDetails.tsx` has been updated to handle undefined/null status values:

```typescript
function isCompleted(version: AnalysisVersion) {
  return version.status?.trim().toLowerCase() === "completed";
}
```

This prevents the error when `version.status` is undefined or null by using the optional chaining operator (?.) before calling `.trim()`.

### Issue: Analysis Not Starting
**Symptoms**: Clicking "Run Analysis" doesn't initiate analysis
**Checks**:
1. Verify caseId is available and valid
2. Check if user has sufficient credits (insufficientCredits flag)
3. Ensure analysis isn't already running (running flag)
4. Check network tab for API errors
5. Verify API endpoint is accessible

### Issue: Download Not Working
**Symptoms**: Clicking download does nothing or shows error
**Checks**:
1. Ensure selected version is completed (isCompleted check)
2. Verify caseId and analysisId are valid
3. Check network response from download endpoint
4. Confirm blob creation and object URL handling
5. Validate fileName from content-disposition header

### Issue: Stale Data Display
**Symptoms**: UI doesn't update after analysis completes
**Checks**:
1. Verify pollingEnabled is set correctly
2. Check refetchInterval in useQuery calls
3. Ensure query keys are unique and correct
4. Confirm refetch calls are made after mutations
5. Check React Query devtools for cache updates

### Issue: UI Components Not Styling Correctly
**Symptoms**: Components appear unstyled or incorrect
**Checks**:
1. Verify Tailwind CSS is properly configured
2. Check class names for typos
3. Ensure postcss.config.js includes tailwindcss and autoprefixer
4. Confirm @tailwind directives in index.css
5. Check for conflicting CSS rules

## References

### Internal Documentation
- Code comments throughout the codebase
- Component prop types and interfaces
- API response type definitions
- Utility function documentation

### External Resources
- **React**: https://react.dev/
- **React Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/
- **Vite**: https://vitejs.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **Lucide React Icons**: https://lucide.dev/

### API Endpoints
- `GET /api/auth/user-cases` - Get user's cases
- `GET /api/auth/case-types` - Get case types
- `GET /api/admin/cases/{caseId}/analysis-status` - Get analysis status
- `GET /api/admin/cases/{caseId}/analysis/versions` - Get analysis versions
- `GET /api/admin/cases/{caseId}/logs` - Get analysis logs
- `POST /api/admin/cases/{caseId}/analyze` - Run analysis
- `GET /api/admin/cases/{caseId}/analysis/{analysisId}/download` - Download analysis
- `POST /api/auth/user-cases/upload-url` - Get upload URL for files

### Development Tools
- **ESLint**: For code quality and consistency
- **TypeScript Compiler**: For type checking
- **Vite**: For fast development builds and HMR
- **React DevTools**: For component inspection
- **React Query Devtools**: For monitoring query states (if enabled)

---
*This guide was generated to help developers understand and work with the Cloud Insure User Portal codebase. For specific implementation details, refer to the source code and inline documentation.*