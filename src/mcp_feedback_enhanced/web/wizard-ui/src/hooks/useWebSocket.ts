/**
 * WebSocket hook for managing wizard communication
 */
import { useEffect, useRef, useCallback } from 'react';
import { useWizardStore } from '../store/wizardStore';
import type { WizardMessage, WizardStage } from '../types';

const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const {
    connected,
    reconnectAttempts,
    tabId,
    sessionId,
    setConnected,
    setReconnecting,
    incrementReconnectAttempts,
    resetReconnectAttempts,
    setSessionId,
    setCurrentStage,
    setCompletedStages,
    setBlueprintText,
    addNotification,
    setError,
  } = useWizardStore();

  // Send message through WebSocket
  const sendMessage = useCallback((message: WizardMessage) => {
    if (wsRef.current && connected) {
      try {
        wsRef.current.send(JSON.stringify(message));
        console.log('[WIZARD] Sent message:', message.type);
      } catch (error) {
        console.error('[WIZARD] Error sending message:', error);
        addNotification({
          type: 'error',
          message: 'Failed to send message',
        });
      }
    } else {
      console.warn('[WIZARD] Cannot send message - not connected');
    }
  }, [connected, addNotification]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current && connected) {
        sendMessage({
          type: 'heartbeat',
          tab_id: tabId,
          timestamp: Date.now(),
        });
      }
    }, HEARTBEAT_INTERVAL);
  }, [connected, tabId, sendMessage]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((message: WizardMessage) => {
    console.log('[WIZARD] Received message:', message.type, message);

    switch (message.type) {
      case 'session_info':
        setSessionId(message.session_id);
        setCurrentStage(message.current_stage);
        if (message.blueprint_text) {
          setBlueprintText(message.blueprint_text);
        }
        if (message.completed_stages) {
          setCompletedStages(message.completed_stages);
        }
        break;

      case 'stage_changed':
        setCurrentStage(message.stage);
        if (message.status?.completed_stages) {
          setCompletedStages(message.status.completed_stages);
        }
        addNotification({
          type: 'success',
          message: `Stage changed to: ${message.stage}`,
          duration: 3000,
        });
        break;

      case 'blueprint_content':
        if (message.content) {
          setBlueprintText(message.content);
        }
        break;

      case 'blueprint_confirmed':
        addNotification({
          type: 'success',
          message: 'Blueprint confirmed! Moving to next stage...',
          duration: 3000,
        });
        if (message.next_stage) {
          setCurrentStage(message.next_stage);
        }
        if (message.status?.completed_stages) {
          setCompletedStages(message.status.completed_stages);
        }
        break;

      case 'heartbeat_ack':
        // Heartbeat acknowledged
        break;

      case 'error':
        console.error('[WIZARD] Server error:', message.message);
        setError(message.message);
        addNotification({
          type: 'error',
          message: message.message || 'An error occurred',
        });
        break;

      default:
        console.log('[WIZARD] Unknown message type:', message.type);
    }
  }, [
    setSessionId,
    setCurrentStage,
    setCompletedStages,
    setBlueprintText,
    addNotification,
    setError,
  ]);

  // Attempt reconnection
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WIZARD] Max reconnection attempts reached');
      setError('Connection lost - Please refresh the page');
      setReconnecting(false);
      return;
    }

    incrementReconnectAttempts();
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);

    console.log(
      `[WIZARD] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`
    );

    setReconnecting(true);

    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, delay);
  }, [reconnectAttempts, incrementReconnectAttempts, setReconnecting, setError]);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/wizard`;

    console.log('[WIZARD] Connecting to WebSocket:', wsUrl);

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WIZARD] WebSocket connected');
        setConnected(true);
        setReconnecting(false);
        resetReconnectAttempts();
        startHeartbeat();

        // Send initial connection message
        sendMessage({
          type: 'client_connected',
          tab_id: tabId,
          timestamp: Date.now(),
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WizardMessage;
          handleMessage(message);
        } catch (error) {
          console.error('[WIZARD] Error parsing message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('[WIZARD] WebSocket error:', error);
        setConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('[WIZARD] WebSocket disconnected');
        setConnected(false);
        stopHeartbeat();
        attemptReconnect();
      };
    } catch (error) {
      console.error('[WIZARD] Failed to create WebSocket:', error);
      setConnected(false);
      attemptReconnect();
    }
  }, [
    tabId,
    setConnected,
    setReconnecting,
    resetReconnectAttempts,
    startHeartbeat,
    stopHeartbeat,
    sendMessage,
    handleMessage,
    attemptReconnect,
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    stopHeartbeat();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnected(false);
  }, [stopHeartbeat, setConnected]);

  // Public API methods
  const confirmBlueprint = useCallback((blueprint: string) => {
    sendMessage({
      type: 'confirm_blueprint',
      blueprint,
      session_id: sessionId,
      timestamp: Date.now(),
    });
  }, [sendMessage, sessionId]);

  const rollbackToStage = useCallback((targetStage: WizardStage) => {
    sendMessage({
      type: 'rollback_to_stage',
      target_stage: targetStage,
      session_id: sessionId,
      timestamp: Date.now(),
    });
  }, [sendMessage, sessionId]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnect();
    };
  }, []); // Empty deps - only connect once on mount

  return {
    connected,
    sendMessage,
    confirmBlueprint,
    rollbackToStage,
  };
};
