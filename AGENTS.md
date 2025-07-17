# Agent Guidelines for Magma

## Build/Test Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production (runs TypeScript check + Vite build)
- `pnpm preview` - Preview production build
- `pnpm tauri dev` - Start Tauri development mode
- `pnpm tauri build` - Build Tauri app for production

## Code Style
- **Language**: TypeScript with strict mode enabled
- **Framework**: React 18 + Tauri 2 + Vite
- **Styling**: TailwindCSS v4 with shadcn/ui components
- **Imports**: Use `@/` alias for src directory imports
- **Types**: Define types in `src/types/` directory, export from index
- **Components**: Use functional components with TypeScript interfaces
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **UI Components**: Use shadcn/ui pattern with `cn()` utility for className merging
- **File Structure**: Components in `src/components/`, pages in `src/pages/`

## Error Handling
- Use TypeScript strict mode for compile-time safety
- Handle async operations with proper error boundaries
- Validate props with TypeScript interfaces

## Styling
- Use TailwindCSS v4 with shadcn/ui components
- Style decisions are in the STYLES.md file

No linting/testing commands configured - consider adding ESLint and testing framework.
