/**
 * Connection status indicator
 */
import React from 'react';
import { Chip, CircularProgress } from '@mui/material';
import {
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon,
} from '@mui/icons-material';
import { useWizardStore } from '../store/wizardStore';

export const ConnectionStatus: React.FC = () => {
  const { connected, reconnecting, reconnectAttempts } = useWizardStore();

  if (reconnecting) {
    return (
      <Chip
        icon={<CircularProgress size={16} color="inherit" />}
        label={`Reconnecting... (${reconnectAttempts}/5)`}
        color="warning"
        size="small"
      />
    );
  }

  return (
    <Chip
      icon={connected ? <WifiIcon /> : <WifiOffIcon />}
      label={connected ? 'Connected' : 'Disconnected'}
      color={connected ? 'success' : 'error'}
      size="small"
    />
  );
};
