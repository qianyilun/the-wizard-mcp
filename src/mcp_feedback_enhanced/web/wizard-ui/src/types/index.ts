/**
 * Type definitions for The Wizard application
 */

// Stage types matching the backend workflow
export type WizardStage =
  | 'COLLECT_CONTEXT'
  | 'INSIGHT_CLASSIFICATION'
  | 'REVIEW_BLUEPRINT'
  | 'GENERATE_BLUEPRINT'
  | 'REVIEW_TEST_MATRIX'
  | 'GENERATE_TEST_MATRIX'
  | 'GENERATE_IMPLEMENTATION'
  | 'REVIEW_TRACE'
  | 'WORKFLOW_COMPLETE';

// UI-friendly stage names
export type UIStage = 'context' | 'mode' | 'plan' | 'tests' | 'code' | 'review';

// WebSocket message types
export type MessageType =
  | 'client_connected'
  | 'session_info'
  | 'stage_changed'
  | 'blueprint_content'
  | 'blueprint_confirmed'
  | 'confirm_blueprint'
  | 'rollback_to_stage'
  | 'heartbeat'
  | 'heartbeat_ack'
  | 'error';

export interface HeartbeatAckMessage extends BaseMessage {
  type: 'heartbeat_ack';
}

// Base message interface
export interface BaseMessage {
  type: MessageType;
  timestamp?: number;
}

// Client messages
export interface ClientConnectedMessage extends BaseMessage {
  type: 'client_connected';
  tab_id: string;
}

export interface ConfirmBlueprintMessage extends BaseMessage {
  type: 'confirm_blueprint';
  blueprint: string;
  session_id: string | null;
}

export interface RollbackMessage extends BaseMessage {
  type: 'rollback_to_stage';
  target_stage: WizardStage;
  session_id: string | null;
}

export interface HeartbeatMessage extends BaseMessage {
  type: 'heartbeat';
  tab_id: string;
}

// Server messages
export interface SessionInfoMessage extends BaseMessage {
  type: 'session_info';
  session_id: string;
  current_stage: WizardStage;
  blueprint_text?: string;
  completed_stages?: WizardStage[];
}

export interface StageChangedMessage extends BaseMessage {
  type: 'stage_changed';
  stage: WizardStage;
  status?: {
    completed_stages: WizardStage[];
  };
}

export interface BlueprintContentMessage extends BaseMessage {
  type: 'blueprint_content';
  content: string;
}

export interface BlueprintConfirmedMessage extends BaseMessage {
  type: 'blueprint_confirmed';
  next_stage?: WizardStage;
  status?: {
    completed_stages: WizardStage[];
  };
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  message: string;
  code?: string;
}

// Union type for all messages
export type WizardMessage =
  | ClientConnectedMessage
  | SessionInfoMessage
  | StageChangedMessage
  | BlueprintContentMessage
  | BlueprintConfirmedMessage
  | ConfirmBlueprintMessage
  | RollbackMessage
  | HeartbeatMessage
  | HeartbeatAckMessage
  | ErrorMessage;

// Application state
export interface WizardState {
  // Connection state
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempts: number;

  // Session state
  sessionId: string | null;
  tabId: string;

  // Stage state
  currentStage: WizardStage;
  completedStages: WizardStage[];

  // Blueprint state
  blueprintText: string;
  blueprintValid: boolean;

  // UI state
  loading: boolean;
  error: string | null;
}

// Stage information for UI
export interface StageInfo {
  id: UIStage;
  name: string;
  description: string;
  icon: string;
}

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}
