import React, { useEffect, useState } from 'react';
import { benAIBrain, julieAIBrain } from '../../systems/ai/CitizenAIBrain';
import { CitizenId, ControlMode } from '../../types/citizen';
import { OllamaService } from '../../systems/ai/OllamaService';
import { navigationSystem } from '../../systems/ai/NavigationSystem';
import { eventEngine } from '../../systems/ai/EventEngine';
import { attentionEngine } from '../../systems/ai/AttentionEngine';
import { taskInterruptManager } from '../../systems/ai/TaskInterruptManager';

export const CitizenDebugPanel: React.FC = () => {
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenId>('ben');
  const activeBrain = selectedCitizen === 'ben' ? benAIBrain : julieAIBrain;
  const agent = activeBrain.agent;
  const modelName = activeBrain.getConfig().llm.model;

  const [mode, setMode] = useState<ControlMode>(agent.getControlMode());
  const [isConnected, setIsConnected] = useState(OllamaService.getIsConnected());
  const [needs, setNeeds] = useState(agent.needSystem.getNeeds());
  const [beliefs, setBeliefs] = useState(agent.beliefSystem.getTopBeliefs(4));
  const [memories, setMemories] = useState(agent.memorySystem.getRecentEpisodicMemories(4));
  const [reflections, setReflections] = useState(agent.memorySystem.getRecentReflections(2));
  const [activeGoal, setActiveGoal] = useState(agent.goalSystem.getActiveGoal());
  const [currentDecision, setCurrentDecision] = useState(agent.cognitionEngine.getCurrentDecision());
  const [otherRel, setOtherRel] = useState(agent.relationshipSystem.getRelationship(selectedCitizen === 'ben' ? 'julie' : 'ben'));
  const [loopWarning, setLoopWarning] = useState(agent.loopGuard.checkForLoopWarnings());
  const [isThinking, setIsThinking] = useState(agent.cognitionEngine.getIsThinking());

  // Architectural Telemetry State
  const [highestEvent, setHighestEvent] = useState(eventEngine.getHighestPriorityEvent(selectedCitizen));
  const [attentionSnapshot, setAttentionSnapshot] = useState(
    attentionEngine.computeAttention(agent.identity, agent.needSystem.getNeeds(), activeGoal?.description)
  );
  const [interruptedTask, setInterruptedTask] = useState(taskInterruptManager.getInterruptedTask(selectedCitizen));

  useEffect(() => {
    OllamaService.checkConnection().then((connected) => setIsConnected(connected));

    const unsubAgent = agent.subscribe(() => {
      setMode(agent.getControlMode());
      setNeeds(agent.needSystem.getNeeds());
      setBeliefs(agent.beliefSystem.getTopBeliefs(4));
      setMemories(agent.memorySystem.getRecentEpisodicMemories(4));
      setReflections(agent.memorySystem.getRecentReflections(2));
      setActiveGoal(agent.goalSystem.getActiveGoal());
      setCurrentDecision(agent.cognitionEngine.getCurrentDecision());
      setOtherRel(agent.relationshipSystem.getRelationship(selectedCitizen === 'ben' ? 'julie' : 'ben'));
      setLoopWarning(agent.loopGuard.checkForLoopWarnings());
      setIsThinking(agent.cognitionEngine.getIsThinking());

      setHighestEvent(eventEngine.getHighestPriorityEvent(selectedCitizen));
      setAttentionSnapshot(attentionEngine.computeAttention(agent.identity, agent.needSystem.getNeeds(), agent.goalSystem.getActiveGoal()?.description));
      setInterruptedTask(taskInterruptManager.getInterruptedTask(selectedCitizen));
    });

    const pingInterval = setInterval(() => {
      OllamaService.checkConnection().then((connected) => setIsConnected(connected));
      setHighestEvent(eventEngine.getHighestPriorityEvent(selectedCitizen));
      setAttentionSnapshot(attentionEngine.computeAttention(agent.identity, agent.needSystem.getNeeds(), agent.goalSystem.getActiveGoal()?.description));
      setInterruptedTask(taskInterruptManager.getInterruptedTask(selectedCitizen));
    }, 10000);

    return () => {
      unsubAgent();
      clearInterval(pingInterval);
    };
  }, [selectedCitizen, agent]);

  const handleToggleMode = (newMode: ControlMode) => {
    agent.setControlMode(newMode);
  };

  const citizenName = agent.identity.name;
  const otherName = selectedCitizen === 'ben' ? 'Julie' : 'Ben';
  const currentNavIntention = navigationSystem.getCurrentIntention(selectedCitizen);

  // Compute Current State Summary
  let currentStateText = 'IDLE';
  if (currentNavIntention) {
    currentStateText = 'NAVIGATING';
  } else if (currentDecision && currentDecision.tool && currentDecision.tool !== 'observe' && currentDecision.tool !== 'wait') {
    currentStateText = `EXECUTING (${currentDecision.tool.toUpperCase()})`;
  }

  return (
    <div style={styles.card}>
      {/* Header & Citizen Switcher */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.cardTag}>CIVIGENIS AUTONOMOUS CITIZEN HUD</div>
          <div style={styles.cardTitle}>{citizenName} Mind Telemetry</div>
        </div>
        <div style={styles.modeToggleGroup}>
          <button
            style={{
              ...styles.modeBtn,
              backgroundColor: selectedCitizen === 'ben' ? '#2563eb' : '#334155',
            }}
            onClick={() => setSelectedCitizen('ben')}
          >
            Ben
          </button>
          <button
            style={{
              ...styles.modeBtn,
              backgroundColor: selectedCitizen === 'julie' ? '#2563eb' : '#334155',
            }}
            onClick={() => setSelectedCitizen('julie')}
          >
            Julie
          </button>
        </div>
      </div>

      {/* Control Mode & LLM Info */}
      <div style={styles.statusRow}>
        <span style={styles.statusLabel}>
          LLM: <strong style={{ color: '#60a5fa' }}>{modelName}</strong> | Mode: <strong style={{ color: mode === 'AI' ? '#10b981' : '#f59e0b' }}>{mode}</strong> | State: <strong style={{ color: '#a855f7' }}>{currentStateText}</strong>
        </span>
        <div style={styles.modeToggleGroup}>
          <button
            style={{
              ...styles.modeBtn,
              backgroundColor: mode === 'MANUAL' ? '#d97706' : '#334155',
            }}
            onClick={() => handleToggleMode('MANUAL')}
          >
            🕹️ Manual
          </button>
          <button
            style={{
              ...styles.modeBtn,
              backgroundColor: mode === 'AI' ? '#10b981' : '#334155',
            }}
            onClick={() => handleToggleMode('AI')}
          >
            🤖 AI Autonomous
          </button>
        </div>
      </div>

      {/* Loop Guard Warning if Active */}
      {loopWarning && (
        <div style={styles.warningBox}>
          ⚠️ <strong>Anti-Loop Guard Alert:</strong> {loopWarning}
        </div>
      )}

      {/* Telemetry Architecture Section */}
      <div style={styles.telemetryBox}>
        <div style={styles.telemetryHeader}>
          <span>EVENT-DRIVEN ARCHITECTURE LOGIC</span>
          {isThinking && <span style={styles.thinkingBadge}>⚡ Reasoning Active</span>}
        </div>
        <div style={styles.telemetryGrid}>
          <div>
            <span style={{ color: '#94a3b8' }}>Agent State: </span>
            <strong style={{ color: currentStateText === 'NAVIGATING' ? '#3b82f6' : currentStateText.startsWith('EXEC') ? '#eab308' : '#64748b' }}>
              {currentStateText}
            </strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>Loop Warning: </span>
            <strong style={{ color: loopWarning ? '#ef4444' : '#10b981' }}>
              {loopWarning ? 'ALERT' : 'Normal'}
            </strong>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#94a3b8' }}>Highest Priority Event: </span>
            <strong style={{ color: highestEvent ? '#38bdf8' : '#64748b' }}>
              {highestEvent ? `[P:${highestEvent.priority}] ${highestEvent.type}` : 'None'}
            </strong>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#94a3b8' }}>Attention Focus: </span>
            <strong style={{ color: '#10b981' }}>
              {attentionSnapshot.primaryFocus ? attentionSnapshot.primaryFocus.details : 'Idle baseline observation'}
            </strong>
          </div>
          {interruptedTask && (
            <div style={{ gridColumn: 'span 2', color: '#ec4899', fontWeight: 600 }}>
              ⏸️ Interrupted Task: {interruptedTask.tool} ("{interruptedTask.intention}")
            </div>
          )}
        </div>
      </div>

      {/* 11 Dynamic Motivational Needs */}
      <div style={styles.sectionHeader}>{citizenName.toUpperCase()}'S MOTIVATIONAL NEEDS</div>
      <div style={styles.metricsGrid}>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Hunger:</span>
          <span style={{ ...styles.metricVal, color: needs.hunger > 60 ? '#ef4444' : '#10b981' }}>{Math.round(needs.hunger)}%</span>
        </div>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Energy:</span>
          <span style={{ ...styles.metricVal, color: needs.energy < 30 ? '#ef4444' : '#10b981' }}>{Math.round(needs.energy)}%</span>
        </div>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Thirst:</span>
          <span style={{ ...styles.metricVal, color: needs.thirst > 60 ? '#ef4444' : '#38bdf8' }}>{Math.round(needs.thirst)}%</span>
        </div>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Curiosity:</span>
          <span style={styles.metricValBold}>{Math.round(needs.curiosity)}%</span>
        </div>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Social:</span>
          <span style={styles.metricVal}>{Math.round(needs.socialConnection)}%</span>
        </div>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Achievement:</span>
          <span style={styles.metricVal}>{Math.round(needs.achievement)}%</span>
        </div>
      </div>

      {/* Dynamic Active Goal & Reasoning */}
      <div style={styles.sectionHeader}>
        ACTIVE GOAL & REASONING {isThinking ? '🧠 (Reasoning...)' : ''}
      </div>
      <div style={styles.intentionBox}>
        {activeGoal ? (
          <div>
            <div style={styles.intentText}>"{activeGoal.description}"</div>
            {currentDecision?.speech && (
              <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600, marginTop: '4px' }}>
                💬 Speech: "{currentDecision.speech}"
              </div>
            )}
            {currentDecision?.reason && (
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                Reason: {currentDecision.reason}
              </div>
            )}
            <div style={{ fontSize: '10px', color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>
              Motivation: {activeGoal.motivation} | Priority: {activeGoal.priority}/10
            </div>
          </div>
        ) : (
          <div style={styles.idleText}>No active goal. Formulating intention...</div>
        )}
      </div>

      {/* Current Tool Execution & Navigation */}
      <div style={styles.sectionHeader}>PHYSICAL EXECUTION & NAVIGATION TELEMETRY</div>
      <div style={styles.intentionBox}>
        {(() => {
          const navStatus = navigationSystem.getNavStatus(selectedCitizen);
          const navTarget = navigationSystem.getCurrentTarget(selectedCitizen);
          const citizenPos = agent.lastPos;
          const distToTarget = navigationSystem.getDistanceToTarget(selectedCitizen, citizenPos);
          const velocity = navigationSystem.getVelocity(selectedCitizen);
          const actionState = currentDecision ? (isThinking ? 'VALIDATING' : currentNavIntention ? 'EXECUTING' : 'COMPLETED') : 'NONE';
          const animState = velocity > 3.2 ? 'RUN' : velocity > 0.1 ? 'WALK' : 'IDLE';

          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Action State: </span>
                <strong style={{ color: actionState === 'EXECUTING' ? '#38bdf8' : '#e2e8f0' }}>{actionState}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Nav State: </span>
                <strong style={{ color: navStatus === 'MOVING' ? '#10b981' : navStatus === 'STUCK' ? '#ef4444' : '#64748b' }}>{navStatus}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Velocity: </span>
                <strong style={{ color: velocity > 0.1 ? '#10b981' : '#64748b' }}>{velocity.toFixed(1)} m/s</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Anim State: </span>
                <strong style={{ color: animState !== 'IDLE' ? '#f59e0b' : '#64748b' }}>{animState}</strong>
              </div>
              {navTarget && (
                <>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#94a3b8' }}>Target: </span>
                    <strong style={{ color: '#38bdf8' }}>{navTarget.name} ({distToTarget.toFixed(1)}m)</strong>
                  </div>
                </>
              )}
              {citizenPos && (
                <div style={{ gridColumn: 'span 2', fontSize: '10px', color: '#94a3b8' }}>
                  Position: [{citizenPos[0].toFixed(1)}, {citizenPos[1].toFixed(1)}, {citizenPos[2].toFixed(1)}]
                </div>
              )}
              {currentDecision && (
                <div style={{ gridColumn: 'span 2', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700 }}>
                    Tool: <span style={{ color: '#f59e0b' }}>{currentDecision.tool}</span> ({JSON.stringify(currentDecision.arguments || {})})
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '10px', marginTop: '1px' }}>
                    Intention: "{currentDecision.intention}"
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Social Relationship State */}
      <div style={styles.sectionHeader}>RELATIONSHIP CONTEXT ({otherName.toUpperCase()})</div>
      <div style={styles.metricsGrid}>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Trust:</span>
          <span style={styles.metricValBold}>{Math.round(otherRel.trust)}/100</span>
        </div>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Friendship:</span>
          <span style={styles.metricValBold}>{Math.round(otherRel.friendship)}/100</span>
        </div>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Respect:</span>
          <span style={styles.metricVal}>{Math.round(otherRel.respect)}/100</span>
        </div>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Gratitude:</span>
          <span style={styles.metricVal}>{Math.round(otherRel.gratitude)}/100</span>
        </div>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Frustration:</span>
          <span style={{ ...styles.metricVal, color: otherRel.frustration > 30 ? '#ef4444' : '#f8fafc' }}>{Math.round(otherRel.frustration)}/100</span>
        </div>
        <div style={styles.metricCell}>
          <span style={styles.metricLabel}>Anger:</span>
          <span style={{ ...styles.metricVal, color: (otherRel.anger || 0) > 30 ? '#ef4444' : '#f8fafc' }}>{Math.round(otherRel.anger || 0)}/100</span>
        </div>
      </div>

      {/* Contextual Episodic & Reflection Memories */}
      <div style={styles.sectionHeader}>RECENT EPISODIC MEMORIES & REFLECTIONS</div>
      <div style={styles.memoryContainer}>
        {memories.map((m) => (
          <div key={m.id} style={styles.memoryItem}>
            <span style={styles.memTime}>[{m.timestamp}]</span>
            <span style={styles.memDesc}>{m.description}</span>
          </div>
        ))}
        {reflections.map((r) => (
          <div key={r.id} style={{ ...styles.memoryItem, color: '#f59e0b' }}>
            <span style={styles.memTime}>[Reflection]</span>
            <span>"{r.insight}"</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '16px',
    padding: '14px 16px',
    color: '#ffffff',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    marginTop: '12px',
    fontSize: '11.5px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  cardTag: {
    fontSize: '9px',
    fontWeight: 700,
    color: '#38bdf8',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#f8fafc',
  },
  modeToggleGroup: {
    display: 'flex',
    gap: '4px',
  },
  modeBtn: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  statusLabel: {
    fontSize: '10px',
    color: '#94a3b8',
  },
  warningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '10.5px',
    marginBottom: '10px',
  },
  sectionHeader: {
    fontSize: '9.5px',
    fontWeight: 800,
    color: '#64748b',
    letterSpacing: '1px',
    margin: '10px 0 4px 0',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '4px',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '8px',
    padding: '6px 8px',
  },
  metricCell: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: '#94a3b8',
  },
  metricVal: {
    color: '#f8fafc',
    fontWeight: 600,
  },
  metricValBold: {
    color: '#38bdf8',
    fontWeight: 700,
  },
  intentionBox: {
    backgroundColor: '#090d16',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '8px 10px',
  },
  intentText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#38bdf8',
  },
  idleText: {
    color: '#94a3b8',
    fontStyle: 'italic',
    fontSize: '11px',
  },
  memoryContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    maxHeight: '90px',
    overflowY: 'auto',
  },
  memoryItem: {
    fontSize: '10px',
    color: '#cbd5e1',
  },
  memTime: {
    color: '#64748b',
    marginRight: '4px',
    fontWeight: 600,
  },
  memDesc: {
    color: '#e2e8f0',
  },
};
