/**
 * Context collection stage
 */
import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';

export const ContextStage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Collecting Context
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The wizard is gathering information about your project...
        </Typography>
      </Paper>
    </Box>
  );
};
