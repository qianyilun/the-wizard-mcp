/**
 * Review and comparison stage
 */
import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';

export const ReviewStage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Review & Complete
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Review the implementation against the blueprint and confirm completion.
      </Typography>

      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Workflow Complete
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The implementation has been generated based on your blueprint.
        </Typography>
        <Button variant="contained" color="success">
          Finish
        </Button>
      </Paper>
    </Box>
  );
};
