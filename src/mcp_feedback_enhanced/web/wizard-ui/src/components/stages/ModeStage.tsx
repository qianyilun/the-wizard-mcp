/**
 * Mode classification stage
 */
import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';

export const ModeStage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Analyzing Requirements
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Determining the best development approach for your needs...
        </Typography>
      </Paper>
    </Box>
  );
};
