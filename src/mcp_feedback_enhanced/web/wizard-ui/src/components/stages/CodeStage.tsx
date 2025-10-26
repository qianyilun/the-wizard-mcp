/**
 * Code implementation stage
 */
import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';

export const CodeStage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Code Generation
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        The wizard is generating your implementation based on the blueprint...
      </Typography>

      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Generating code implementation...
        </Typography>
      </Paper>
    </Box>
  );
};
