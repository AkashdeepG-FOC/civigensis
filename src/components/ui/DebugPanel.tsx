import React from 'react';
import { CitizenId, SimulationState } from '../../types/citizen';
import { simulationEngine } from '../../systems/simulation/SimulationEngine';

interface DebugPanelProps {
  simState: SimulationState;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ simState }) => {
  const { activeCitizenId, citizens } = simState;

  const handleSelectCitizen = (id: CitizenId) => {
    simulationEngine.setActiveCitizen(id);
  };

  const formatPos = (pos: [number, number, number]) => {
    return `X: ${pos[0].toFixed(2)}, Y: ${pos[1].toFixed(2)}, Z: ${pos[2].toFixed(2)}`;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>CiviGenis</h2>
      <p style={styles.subtitle}>Phase 1 — 3D Civilization Foundation</p>

      <div style={styles.section}>
        <div style={styles.characterHeader}>
          <strong style={styles.charName}>Ben</strong>
          {activeCitizenId === 'ben' && <span style={styles.activeBadge}>Controlled</span>}
        </div>
        <div style={styles.statRow}>
          <span>State:</span>
          <span style={getAnimStateStyle(citizens.ben.animState)}>{citizens.ben.animState}</span>
        </div>
        <div style={styles.statRow}>
          <span>Position:</span>
          <span style={styles.monoText}>{formatPos(citizens.ben.position)}</span>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.characterHeader}>
          <strong style={styles.charName}>Julie</strong>
          {activeCitizenId === 'julie' && <span style={styles.activeBadge}>Controlled</span>}
        </div>
        <div style={styles.statRow}>
          <span>State:</span>
          <span style={getAnimStateStyle(citizens.julie.animState)}>{citizens.julie.animState}</span>
        </div>
        <div style={styles.statRow}>
          <span>Position:</span>
          <span style={styles.monoText}>{formatPos(citizens.julie.position)}</span>
        </div>
      </div>

      {citizens.ravi && (
        <div style={styles.section}>
          <div style={styles.characterHeader}>
            <strong style={styles.charName}>Ravi (Vegetable Seller)</strong>
            {activeCitizenId === 'ravi' && <span style={styles.activeBadge}>Controlled</span>}
          </div>
          <div style={styles.statRow}>
            <span>State:</span>
            <span style={getAnimStateStyle(citizens.ravi.animState)}>{citizens.ravi.animState}</span>
          </div>
          <div style={styles.statRow}>
            <span>Position:</span>
            <span style={styles.monoText}>{formatPos(citizens.ravi.position)}</span>
          </div>
        </div>
      )}

      <div style={styles.buttonGroup}>
        <button
          style={{
            ...styles.button,
            backgroundColor: activeCitizenId === 'ben' ? '#2563eb' : '#374151',
          }}
          onClick={() => handleSelectCitizen('ben')}
        >
          Ben
        </button>
        <button
          style={{
            ...styles.button,
            backgroundColor: activeCitizenId === 'julie' ? '#2563eb' : '#374151',
          }}
          onClick={() => handleSelectCitizen('julie')}
        >
          Julie
        </button>
        <button
          style={{
            ...styles.button,
            backgroundColor: activeCitizenId === 'ravi' ? '#10b981' : '#374151',
          }}
          onClick={() => handleSelectCitizen('ravi')}
        >
          Ravi
        </button>
      </div>

      <div style={styles.controlsInfo}>
        <p style={styles.controlHeader}>Controls:</p>
        <p>• WASD / Arrow Keys: Move</p>
        <p>• Hold Shift: Run</p>
      </div>
    </div>
  );
};

const getAnimStateStyle = (state: string): React.CSSProperties => {
  let color = '#9ca3af';
  if (state === 'WALK') color = '#60a5fa';
  if (state === 'RUN') color = '#f87171';
  return { fontWeight: 'bold', color };
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '280px',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    color: '#f3f4f6',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    fontFamily: 'monospace, sans-serif',
    fontSize: '13px',
    zIndex: 100,
    border: '1px solid rgba(75, 85, 99, 0.5)',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 2px 0',
    color: '#38bdf8',
  },
  subtitle: {
    fontSize: '11px',
    color: '#9ca3af',
    marginBottom: '12px',
  },
  section: {
    borderTop: '1px solid #374151',
    paddingTop: '8px',
    marginTop: '8px',
  },
  characterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  charName: {
    fontSize: '14px',
    color: '#f9fafb',
  },
  activeBadge: {
    fontSize: '10px',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2px',
  },
  monoText: {
    fontSize: '11px',
    color: '#d1d5db',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '14px',
  },
  button: {
    flex: 1,
    padding: '6px 10px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  controlsInfo: {
    marginTop: '12px',
    paddingTop: '8px',
    borderTop: '1px solid #374151',
    fontSize: '11px',
    color: '#9ca3af',
    lineHeight: '1.4',
  },
  controlHeader: {
    fontWeight: 'bold',
    color: '#d1d5db',
    marginBottom: '2px',
  },
};
