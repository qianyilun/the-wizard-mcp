/**
 * Application header component
 */
import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { AutoFixHigh as WizardIcon } from '@mui/icons-material';
import { ConnectionStatus } from './ConnectionStatus';

export const Header: React.FC = () => {
  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <WizardIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          The Wizard - Spec-Then-Code Workflow
        </Typography>
        <Box>
          <ConnectionStatus />
        </Box>
      </Toolbar>
    </AppBar>
  );
};
