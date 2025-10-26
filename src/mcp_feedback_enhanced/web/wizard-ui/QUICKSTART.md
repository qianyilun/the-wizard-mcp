# Quick Start Guide

Get the React Wizard UI up and running in 5 minutes.

## 🚀 Development Setup

### 1. Install Dependencies
```bash
cd src/mcp_feedback_enhanced/web/wizard-ui
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The UI will be available at `http://localhost:5173` with hot reload enabled.

### 3. Start Backend Server (in another terminal)
```bash
# From project root
python -m mcp_feedback_enhanced.server
```

The backend WebSocket server should be running on port 8765.

## 🏗️ Production Build

### Build for Production
```bash
npm run build
```

This creates optimized bundles in `../static/wizard-dist/`.

### Preview Production Build
```bash
npm run preview
```

## 🧪 Quick Test

1. Open `http://localhost:5173` in your browser
2. Check that "Connected" status appears in the header
3. Enter some Mermaid code in the editor:
   ```mermaid
   graph TD
       A[Start] --> B[Process]
       B --> C[End]
   ```
4. See the diagram render in real-time on the right
5. Click "Confirm Blueprint" to proceed

## 📁 Key Files

- `src/App.tsx` - Main application component
- `src/components/stages/BlueprintStage.tsx` - Main editor
- `src/hooks/useWebSocket.ts` - WebSocket logic
- `src/store/wizardStore.ts` - Global state
- `vite.config.ts` - Build configuration

## 🐛 Troubleshooting

### WebSocket Won't Connect
- Ensure backend server is running
- Check browser console for errors
- Verify proxy config in `vite.config.ts`

### Build Fails
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Hot Reload Not Working
- Check that you're editing files in `src/`
- Restart the dev server (`npm run dev`)
- Clear browser cache

## 📚 Next Steps

- Read `README.md` for full documentation
- See `MIGRATION.md` for architecture details
- Check `REACT_REFACTOR_SUMMARY.md` for project overview
