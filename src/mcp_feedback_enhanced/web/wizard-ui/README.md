# Wizard UI - React + Vite Application

Modern React-based UI for The Wizard's spec-then-code workflow, built with TypeScript, Vite, Material-UI, and Zustand.

## 🏗️ Architecture

### Technology Stack
- **React 18.2** - UI framework
- **TypeScript 5.2** - Type safety
- **Vite 5** - Build tool and dev server
- **Material-UI 5** - Component library
- **Zustand 4** - State management
- **Mermaid 10** - Diagram rendering
- **WebSocket** - Real-time communication

### Project Structure

```
src/
├── components/          # React components
│   ├── stages/         # Stage-specific components
│   │   ├── ContextStage.tsx
│   │   ├── ModeStage.tsx
│   │   ├── BlueprintStage.tsx
│   │   ├── TestsStage.tsx
│   │   ├── CodeStage.tsx
│   │   └── ReviewStage.tsx
│   ├── Header.tsx
│   ├── ConnectionStatus.tsx
│   ├── StageProgress.tsx
│   └── Notification.tsx
├── hooks/              # Custom React hooks
│   ├── useWebSocket.ts
│   └── useMermaid.ts
├── store/              # State management
│   └── wizardStore.ts
├── types/              # TypeScript definitions
│   └── index.ts
├── styles/             # Global styles
│   └── global.css
├── App.tsx             # Main app component
└── main.tsx            # Application entry point
```

## 🚀 Development

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Runs on `http://localhost:5173` with hot module replacement.

### Build for Production
```bash
npm run build
```
Outputs to `../static/wizard-dist/` directory.

### Preview Production Build
```bash
npm run preview
```

## 📡 WebSocket Communication

The UI communicates with the backend via WebSocket at `/ws/wizard`.

### Message Types

**Client → Server:**
- `client_connected` - Initial connection
- `confirm_blueprint` - Confirm Mermaid diagram
- `rollback_to_stage` - Go back to previous stage
- `heartbeat` - Keep-alive ping

**Server → Client:**
- `session_info` - Session state and data
- `stage_changed` - Stage transition notification
- `blueprint_content` - Blueprint data update
- `blueprint_confirmed` - Confirmation acknowledged
- `heartbeat_ack` - Heartbeat response
- `error` - Error message

## 🎨 Features

### Blueprint Stage
- Real-time Mermaid diagram editor
- Live preview with error handling
- Syntax validation
- Confirm/rollback actions

### Stage Progress
- Visual stepper showing workflow stages
- Context → Mode → Blueprint → Tests → Code → Review
- Highlights current and completed stages

### Connection Status
- Real-time connection monitoring
- Automatic reconnection (up to 5 attempts)
- Visual status indicator

### Notifications
- Toast notifications for events
- Auto-dismiss with configurable duration
- Multiple notification types (success, error, warning, info)

## 🔧 Configuration

### Vite Config
- Output directory: `../static/wizard-dist/`
- Proxy configuration for WebSocket and API
- React plugin with Fast Refresh

### TypeScript Config
- Target: ES2020
- Strict mode enabled
- React JSX transform
- Path aliases supported

## 🎯 State Management

Using Zustand for lightweight, performant state management:

```typescript
// Example usage
const { blueprintText, setBlueprintText } = useWizardStore();
```

### Store Structure
- Connection state (connected, reconnecting, attempts)
- Session state (sessionId, tabId)
- Stage state (currentStage, completedStages)
- Blueprint state (blueprintText, blueprintValid)
- UI state (loading, error, notifications)

## 🎨 Styling

- Material-UI theme system
- CSS-in-JS with Emotion
- Global CSS for base styles
- Responsive design

## 📝 Development Notes

### Adding New Stages
1. Create stage component in `src/components/stages/`
2. Export from `src/components/stages/index.ts`
3. Add stage mapping in `App.tsx`
4. Update stage config in `StageProgress.tsx`

### Adding New Message Types
1. Add type to `MessageType` union in `types/index.ts`
2. Create message interface extending `BaseMessage`
3. Add to `WizardMessage` union type
4. Handle in `useWebSocket.ts` `handleMessage` function

### Custom Hooks
- `useWebSocket` - Manages WebSocket connection and messaging
- `useMermaid` - Handles Mermaid diagram rendering with debouncing

## 🔍 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 📦 Build Output

Production build generates:
- Optimized JavaScript chunks
- CSS with vendor prefixes
- Source maps (in dev mode)
- Static HTML entry point

Build size: ~2MB (Mermaid is the largest dependency)

## 🐛 Troubleshooting

### WebSocket Connection Failed
- Check backend server is running
- Verify port configuration in `vite.config.ts`
- Check browser console for errors

### Mermaid Rendering Issues
- Validate Mermaid syntax
- Check browser console for render errors
- Try clearing browser cache

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Material-UI](https://mui.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Mermaid](https://mermaid.js.org/)
