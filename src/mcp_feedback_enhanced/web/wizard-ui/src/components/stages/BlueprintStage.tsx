/**
 * Blueprint stage component - for editing and confirming Mermaid diagrams
 */
import React from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as ConfirmIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useWizardStore } from '../../store/wizardStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useMermaid } from '../../hooks/useMermaid';

export const BlueprintStage: React.FC = () => {
  const {
    blueprintText,
    setBlueprintText,
    loading,
  } = useWizardStore();

  const { confirmBlueprint, rollbackToStage } = useWebSocket();
  const { svg, error, isValid, isRendering } = useMermaid({
    source: blueprintText,
    debounceMs: 500,
  });

  const handleConfirm = () => {
    if (isValid && blueprintText.trim()) {
      confirmBlueprint(blueprintText);
    }
  };

  const handleBack = () => {
    rollbackToStage('INSIGHT_CLASSIFICATION');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Blueprint Design
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Create or edit your system blueprint using Mermaid diagram syntax.
        The diagram will preview in real-time.
      </Typography>

      <Grid container spacing={3}>
        {/* Editor Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Mermaid Source
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={20}
              value={blueprintText}
              onChange={(e) => setBlueprintText(e.target.value)}
              placeholder="Enter Mermaid diagram code here..."
              variant="outlined"
              sx={{
                fontFamily: 'monospace',
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                },
              }}
            />

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="contained"
                startIcon={<ConfirmIcon />}
                onClick={handleConfirm}
                disabled={!isValid || loading || isRendering}
                sx={{ ml: 'auto' }}
              >
                Confirm Blueprint
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Preview Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>

            {isRendering && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 300,
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {!isRendering && error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Diagram Error
                </Typography>
                <Typography variant="body2">{error}</Typography>
              </Alert>
            )}

            {!isRendering && !error && !svg && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 300,
                  color: 'text.secondary',
                }}
              >
                <Typography>
                  Enter Mermaid code to see preview
                </Typography>
              </Box>
            )}

            {!isRendering && svg && (
              <Box
                sx={{
                  '& svg': {
                    maxWidth: '100%',
                    height: 'auto',
                  },
                }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
