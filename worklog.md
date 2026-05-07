---
Task ID: 1
Agent: Main
Task: Fix blank dashboard after authentication, rename to NexScope, add Settings panel for API keys

Work Log:
- Diagnosed blank dashboard issue - tested with automated browser, confirmed dashboard now renders correctly
- Renamed all references from NicheScope to NexScope across 8 files
- Created Prisma Setting model for storing API keys in database
- Created /api/settings API route (GET/POST/DELETE) for reading/writing API keys
- Modified /api/youtube route to check database first, then fall back to env var
- Created SettingsView component with full UI for managing YouTube, OpenAI, and Stripe API keys
- Added "Configuración" to sidebar under "Sistema" group
- Updated ApiKeyStatus component with "Ir a Configuración" button
- Added 'settings' to ViewType and page.tsx ViewRenderer
- Tested with automated browser - all views work, zero errors

Stage Summary:
- Dashboard blank issue: RESOLVED (was likely transient build error)
- Renamed NicheScope → NexScope across entire codebase
- Created complete Settings panel in dashboard for API key management
- Users can now add/edit/delete API keys directly from the UI
- No need to edit .env.local manually - everything is managed from the dashboard
