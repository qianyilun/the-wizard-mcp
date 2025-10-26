/**
 * Main application component
 */
import React from 'react';
import { CssBaseline, ThemeProvider, createTheme, Box, Container } from '@mui/material';
import { Header, StageProgress, Notification } from './components';
import {
  ContextStage,
  ModeStage,
  BlueprintStage,
  TestsStage,
  CodeStage,
  ReviewStage,
} from './components/stages';
import { useWebSocket } from './hooks/useWebSocket';
import { useWizardStore } from './store/wizardStore';
import type { WizardStage, UIStage } from './types';

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Stage mapping from backend to UI stages
const stageMapping: Record<WizardStage, UIStage> = {
  COLLECT_CONTEXT: 'context',
  INSIGHT_CLASSIFICATION: 'mode',
  REVIEW_BLUEPRINT: 'plan',
  GENERATE_BLUEPRINT: 'plan',
  REVIEW_TEST_MATRIX: 'tests',
  GENERATE_TEST_MATRIX: 'tests',
  GENERATE_IMPLEMENTATION: 'code',
  REVIEW_TRACE: 'review',
  WORKFLOW_COMPLETE: 'review',
};

const App: React.FC = () => {
  // Initialize WebSocket connection
  useWebSocket();

  // Get current stage from store
  const { currentStage } = useWizardStore();

  // Map backend stage to UI stage
  const uiStage = stageMapping[currentStage] || 'plan';

  // Render appropriate stage component
  const renderStage = () => {
    switch (uiStage) {
      case 'context':
        return <ContextStage />;
      case 'mode':
        return <ModeStage />;
      case 'plan':
        return <BlueprintStage />;
      case 'tests':
        return <TestsStage />;
      case 'code':
        return <CodeStage />;
      case 'review':
        return <ReviewStage />;
      default:
        return <BlueprintStage />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Header />

        <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
          <StageProgress />

          <Box sx={{ mt: 3 }}>
            {renderStage()}
          </Box>
        </Container>

        <Notification />
      </Box>
    </ThemeProvider>
  );
};

export default App;
