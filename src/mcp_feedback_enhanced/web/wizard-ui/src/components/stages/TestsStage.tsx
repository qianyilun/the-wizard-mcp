/**
 * Test matrix stage
 */
import React from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';

export const TestsStage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Test Matrix
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Review and approve the generated test cases for your implementation.
      </Typography>

      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Test matrix UI coming soon
        </Alert>
        <Typography variant="body1" color="text.secondary">
          This stage will display the generated test matrix for review.
        </Typography>
      </Paper>
    </Box>
  );
};
