/**
 * The Wizard - Main Application
 * Handles WebSocket communication, Mermaid rendering, and UI interactions
 */

class WizardApp {
    constructor() {
        this.websocket = null;
        this.sessionId = null;
        this.currentStage = 'plan';
        this.mermaidSource = '';
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.heartbeatInterval = null;
        this.tabId = this.generateTabId();
        
        // Mermaid configuration
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            }
        });
        
        this.init();
    }
    
    generateTabId() {
        return `tab_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
    
    init() {
        console.log('[WIZARD] Initializing Wizard App...');
        this.setupUI();
        this.connectWebSocket();
    }
    
    setupUI() {
        // Get DOM elements
        this.elements = {
            mermaidSource: document.getElementById('mermaidSource'),
            mermaidPreview: document.getElementById('mermaidPreview'),
            btnConfirm: document.getElementById('btnConfirm'),
            btnBack: document.getElementById('btnBack'),
            connectionStatus: document.getElementById('connectionStatus'),
            statusText: document.getElementById('statusText'),
            stageProgress: document.getElementById('stageProgress'),
        };
        
        // Setup event listeners
        this.elements.mermaidSource.addEventListener('input', () => {
            this.debounceRender();
        });
        
        this.elements.btnConfirm.addEventListener('click', () => {
            this.confirmBlueprint();
        });
        
        this.elements.btnBack.addEventListener('click', () => {
            this.goBack();
        });
        
        // Initial render
        this.renderMermaid();
    }
    
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/wizard`;
        
        console.log('[WIZARD] Connecting to WebSocket:', wsUrl);
        
        try {
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('[WIZARD] WebSocket connected');
                this.connected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
                this.startHeartbeat();
                
                // Send initial connection message
                this.sendMessage({
                    type: 'client_connected',
                    tab_id: this.tabId,
                    timestamp: Date.now()
                });
            };
            
            this.websocket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('[WIZARD] Error parsing message:', error);
                }
            };
            
            this.websocket.onerror = (error) => {
                console.error('[WIZARD] WebSocket error:', error);
                this.updateConnectionStatus(false);
            };
            
            this.websocket.onclose = () => {
                console.log('[WIZARD] WebSocket disconnected');
                this.connected = false;
                this.updateConnectionStatus(false);
                this.stopHeartbeat();
                this.attemptReconnect();
            };
            
        } catch (error) {
            console.error('[WIZARD] Failed to create WebSocket:', error);
            this.updateConnectionStatus(false);
            this.attemptReconnect();
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[WIZARD] Max reconnection attempts reached');
            this.elements.statusText.textContent = 'Connection lost - Please refresh';
            return;
        }
        
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        
        console.log(`[WIZARD] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.elements.statusText.textContent = `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`;
        
        setTimeout(() => {
            this.connectWebSocket();
        }, delay);
    }
    
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.connected) {
                this.sendMessage({
                    type: 'heartbeat',
                    tab_id: this.tabId,
                    timestamp: Date.now()
                });
            }
        }, 30000); // Every 30 seconds
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    sendMessage(message) {
        if (this.websocket && this.connected) {
            try {
                this.websocket.send(JSON.stringify(message));
                console.log('[WIZARD] Sent message:', message.type);
            } catch (error) {
                console.error('[WIZARD] Error sending message:', error);
            }
        } else {
            console.warn('[WIZARD] Cannot send message - not connected');
        }
    }
    
    handleMessage(message) {
        console.log('[WIZARD] Received message:', message.type, message);
        
        switch (message.type) {
            case 'session_info':
                this.handleSessionInfo(message);
                break;
            
            case 'stage_changed':
                this.handleStageChanged(message);
                break;
            
            case 'blueprint_content':
                this.handleBlueprintContent(message);
                break;
            
            case 'blueprint_confirmed':
                this.handleBlueprintConfirmed(message);
                break;
            
            case 'heartbeat_ack':
                // Heartbeat acknowledged
                break;
            
            case 'error':
                this.handleError(message);
                break;
            
            default:
                console.log('[WIZARD] Unknown message type:', message.type);
        }
    }
    
    handleSessionInfo(message) {
        this.sessionId = message.session_id;
        this.currentStage = message.current_stage || 'plan';
        
        // Update UI with session info
        if (message.blueprint_text) {
            this.elements.mermaidSource.value = message.blueprint_text;
            this.renderMermaid();
        }
        
        this.updateStageProgress(this.currentStage, message.completed_stages || []);
    }
    
    handleStageChanged(message) {
        this.currentStage = message.stage;
        this.updateStageProgress(message.stage, message.status?.completed_stages || []);
        
        // Show notification
        this.showNotification(`Stage changed to: ${message.stage}`, 'success');
    }
    
    handleBlueprintContent(message) {
        if (message.content) {
            this.elements.mermaidSource.value = message.content;
            this.renderMermaid();
        }
    }
    
    handleBlueprintConfirmed(message) {
        this.showNotification('Blueprint confirmed! Moving to next stage...', 'success');
        
        // Transition to next stage
        if (message.next_stage) {
            this.currentStage = message.next_stage;
            this.updateStageProgress(message.next_stage, message.status?.completed_stages || []);
        }
    }
    
    handleError(message) {
        console.error('[WIZARD] Server error:', message.message);
        this.showNotification(message.message || 'An error occurred', 'error');
    }
    
    updateConnectionStatus(connected) {
        this.connected = connected;
        
        if (connected) {
            this.elements.connectionStatus.classList.remove('disconnected');
            this.elements.statusText.textContent = 'Connected';
        } else {
            this.elements.connectionStatus.classList.add('disconnected');
            this.elements.statusText.textContent = 'Disconnected';
        }
    }
    
    updateStageProgress(currentStage, completedStages = []) {
        const stageMap = {
            'COLLECT_CONTEXT': 'context',
            'INSIGHT_CLASSIFICATION': 'mode',
            'REVIEW_BLUEPRINT': 'plan',
            'GENERATE_BLUEPRINT': 'plan',
            'REVIEW_TEST_MATRIX': 'tests',
            'GENERATE_TEST_MATRIX': 'tests',
            'GENERATE_IMPLEMENTATION': 'code',
            'REVIEW_TRACE': 'review',
            'WORKFLOW_COMPLETE': 'review'
        };
        
        const currentStageUI = stageMap[currentStage] || 'plan';
        const completedStagesUI = completedStages.map(s => stageMap[s]);
        
        // Update UI
        const stageItems = this.elements.stageProgress.querySelectorAll('.stage-item');
        stageItems.forEach(item => {
            const stage = item.dataset.stage;
            
            // Remove all state classes
            item.classList.remove('active', 'completed');
            
            // Add appropriate class
            if (stage === currentStageUI) {
                item.classList.add('active');
            } else if (completedStagesUI.includes(stage)) {
                item.classList.add('completed');
            }
        });
    }
    
    debounceRender() {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        
        this.renderTimeout = setTimeout(() => {
            this.renderMermaid();
        }, 500);
    }
    
    async renderMermaid() {
        const source = this.elements.mermaidSource.value.trim();
        
        if (!source) {
            this.elements.mermaidPreview.innerHTML = '<div class="loading">Enter Mermaid code to see preview</div>';
            this.elements.btnConfirm.disabled = true;
            return;
        }
        
        try {
            // Generate unique ID for this render
            const id = `mermaid-${Date.now()}`;
            
            // Render Mermaid diagram
            const { svg } = await mermaid.render(id, source);
            
            // Update preview
            this.elements.mermaidPreview.innerHTML = svg;
            this.mermaidSource = source;
            
            // Enable confirm button
            this.elements.btnConfirm.disabled = false;
            
            console.log('[WIZARD] Mermaid diagram rendered successfully');
            
        } catch (error) {
            console.error('[WIZARD] Mermaid render error:', error);
            this.elements.mermaidPreview.innerHTML = `
                <div class="preview-error">
                    <strong>⚠️ Diagram Error</strong><br>
                    ${this.escapeHtml(error.message || 'Invalid Mermaid syntax')}
                </div>
            `;
            this.elements.btnConfirm.disabled = true;
        }
    }
    
    confirmBlueprint() {
        const source = this.elements.mermaidSource.value.trim();
        
        if (!source) {
            this.showNotification('Please enter a blueprint diagram', 'warning');
            return;
        }
        
        // Send confirmation to server
        this.sendMessage({
            type: 'confirm_blueprint',
            blueprint: source,
            session_id: this.sessionId,
            timestamp: Date.now()
        });
        
        // Show loading state
        this.elements.btnConfirm.disabled = true;
        this.elements.btnConfirm.textContent = 'Confirming...';
        
        setTimeout(() => {
            this.elements.btnConfirm.textContent = 'Confirm Blueprint →';
        }, 2000);
    }
    
    goBack() {
        // Request to go back to previous stage
        this.sendMessage({
            type: 'rollback_to_stage',
            target_stage: 'INSIGHT_CLASSIFICATION',
            session_id: this.sessionId
        });
    }
    
    showNotification(message, type = 'info') {
        // Simple notification (could be enhanced with a toast library)
        console.log(`[WIZARD] ${type.toUpperCase()}: ${message}`);
        
        // For now, just show an alert for errors
        if (type === 'error') {
            alert(message);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.wizardApp = new WizardApp();
    });
} else {
    window.wizardApp = new WizardApp();
}

