/**
 * Global state management using Zustand
 */
import { create } from 'zustand';
import type { WizardState, WizardStage, Notification } from '../types';

interface WizardStore extends WizardState {
  // Connection actions
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;

  // Session actions
  setSessionId: (sessionId: string | null) => void;
  setTabId: (tabId: string) => void;

  // Stage actions
  setCurrentStage: (stage: WizardStage) => void;
  setCompletedStages: (stages: WizardStage[]) => void;

  // Blueprint actions
  setBlueprintText: (text: string) => void;
  setBlueprintValid: (valid: boolean) => void;

  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;

  // Reset
  reset: () => void;
}

// Helper function to generate unique IDs
const generateId = () => `${Date.now()}_${Math.random().toString(36).substring(7)}`;

// Initial state
const initialState: WizardState = {
  connected: false,
  reconnecting: false,
  reconnectAttempts: 0,
  sessionId: null,
  tabId: generateId(),
  currentStage: 'COLLECT_CONTEXT',
  completedStages: [],
  blueprintText: '',
  blueprintValid: false,
  loading: false,
  error: null,
};

export const useWizardStore = create<WizardStore>((set) => ({
  ...initialState,
  notifications: [],

  // Connection actions
  setConnected: (connected) => set({ connected }),

  setReconnecting: (reconnecting) => set({ reconnecting }),

  incrementReconnectAttempts: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),

  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),

  // Session actions
  setSessionId: (sessionId) => set({ sessionId }),

  setTabId: (tabId) => set({ tabId }),

  // Stage actions
  setCurrentStage: (currentStage) => set({ currentStage }),

  setCompletedStages: (completedStages) => set({ completedStages }),

  // Blueprint actions
  setBlueprintText: (blueprintText) => set({ blueprintText }),

  setBlueprintValid: (blueprintValid) => set({ blueprintValid }),

  // UI actions
  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Notifications
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: generateId() },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // Reset
  reset: () => set({
    ...initialState,
    tabId: generateId(), // Generate a new tab ID
    notifications: [],
  }),
}));
