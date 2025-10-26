/**
 * Notification/Toast component for displaying messages
 */
import React, { useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useWizardStore } from '../store/wizardStore';

export const Notification: React.FC = () => {
  const { notifications, removeNotification } = useWizardStore();

  useEffect(() => {
    // Auto-dismiss notifications after their duration
    notifications.forEach((notification) => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, removeNotification]);

  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          style={{ top: `${80 + index * 70}px` }}
        >
          <Alert
            severity={notification.type}
            onClose={() => removeNotification(notification.id)}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};
