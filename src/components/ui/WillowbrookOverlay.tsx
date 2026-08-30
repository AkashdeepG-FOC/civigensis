import React, { useEffect, useState } from 'react';
import { CitizenId, SimulationState } from '../../types/citizen';
import { simulationEngine } from '../../systems/simulation/SimulationEngine';
import { worldSimulationEngine } from '../../systems/simulation/WorldSimulationEngine';
import { WorldState, WeatherType } from '../../types/world';
import { BenAIDebugPanel } from './BenAIDebugPanel';
import { RaviDebugPanel } from './RaviDebugPanel';
import { MapEditorModal } from './MapEditorModal';
import { worldMapStore } from '../../systems/navigation/WorldMapStore';
import { raviNPCBrain } from '../../systems/npc/RaviNPCBrain';
import { RaviNPCStateData } from '../../systems/npc/raviState';
import { speechSystem } from '../../systems/speech/SpeechSystem';

interface WillowbrookOverlayProps {
  simState: SimulationState;
  viewMode: 'overview' | 'follow';
  onToggleViewMode: (mode: 'overview' | 'follow') => void;
}

export const WillowbrookOverlay: React.FC<WillowbrookOverlayProps> = ({
  simState,
  viewMode,
  onToggleViewMode,
}) => {
  const { activeCitizenId, citizens } = simState;
  const [worldState, setWorldState] = useState<WorldState>(worldSimulationEngine.getState());
  const [raviState, setRaviState] = useState<RaviNPCStateData>(raviNPCBrain.getStateData());
  const [showAIPerception, setShowAIPerception] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(speechSystem.isMuted());

  useEffect(() => {
    const unsubscribe = worldSimulationEngine.subscribe((newState) => {
      setWorldState({ ...newState });
    });
    const unsubRavi = raviNPCBrain.subscribe((data) => {
      setRaviState({ ...data });
    });
    return () => {
      unsubscribe();
      unsubRavi();
    };
  }, []);

  const handleSelectCitizen = (id: CitizenId) => {
    simulationEngine.setActiveCitizen(id);
    if (viewMode === 'overview') {
      onToggleViewMode('follow');
    }
  };

  const handleTimeScale = (scale: number, isRealTime?: boolean) => {
    worldSimulationEngine.setTimeScale(scale, isRealTime);
  };

  const handleSetWeather = (type: WeatherType) => {
    worldSimulationEngine.setWeather(type, type === 'STORM' ? 0.9 : 0.6);
  };

  const formattedTime = worldSimulationEngine.getFormattedTime(true);
  const perceptionJSON = JSON.stringify(worldSimulationEngine.getAIPerceptionSummary(), null, 2);
  const telemetry = simulationEngine.getPhysicsTelemetry();

  return (
    <>
      {/* Real-Time World Simulation HUD Panel & Ben AI Brain */}
      <div style={styles.worldHudCard}>
        <div style={styles.locationBadgeRow}>
          <span style={styles.locationTag}>📍 CHENNAI (Asia/Kolkata)</span>
          <span style={styles.hudPeriodBadge}>{worldState.environment.period}</span>
        </div>

        <div style={styles.hudHeader}>
          <span style={styles.hudDate}>{worldState.time.dateString || 'Real-Time'}</span>
          <span style={styles.hudTime}>{formattedTime}</span>
        </div>

        {/* Time Scale & Speed Controls */}
        <div style={styles.speedControlRow}>
          <span style={styles.speedLabel}>Time Sync:</span>
          {[
            { id: 'real', label: '⚡ Real', scale: 1, isReal: true },
            { id: '1x', label: '1x', scale: 1, isReal: false },
            { id: '2x', label: '2x', scale: 2, isReal: false },
            { id: '5x', label: '5x', scale: 5, isReal: false },
            { id: '10x', label: '10x', scale: 10, isReal: false },
            { id: 'pause', label: '⏸', scale: 0, isReal: false },
          ].map((item) => {
            const isActive = item.isReal
              ? worldState.useRealTimeClock
              : !worldState.useRealTimeClock && worldState.timeScale === item.scale;
            return (
              <button
                key={item.id}
                style={{
                  ...styles.speedBtn,
                  backgroundColor: isActive ? '#d97706' : '#334155',
                  color: '#ffffff',
                }}
                onClick={() => handleTimeScale(item.scale, item.isReal)}
              >
                {item.label}
              </button>
            );
          })}

          <button
            style={{
              ...styles.speedBtn,
              backgroundColor: isAudioMuted ? '#991b1b' : '#059669',
              color: '#ffffff',
              marginLeft: '6px',
            }}
            onClick={() => {
              const newMuted = !isAudioMuted;
              speechSystem.setMuted(newMuted);
              setIsAudioMuted(newMuted);
            }}
            title={isAudioMuted ? 'Voice Audio Muted - Click to Unmute' : 'Voice Audio Active - Click to Mute'}
          >
            {isAudioMuted ? '🔇 Muted' : '🔊 Voice On'}
          </button>
        </div>

        {/* Weather Metrics (Chennai 13.0827, 80.2707 Reference) */}
        <div style={styles.weatherMetricsGrid}>
          <div style={styles.metricCell}>
            <span style={styles.metricLabel}>Weather:</span>
            <span style={styles.metricValueBold}>
              {worldState.weather.type} {worldState.weather.isLiveAPI ? '(Live)' : ''}
            </span>
          </div>
          <div style={styles.metricCell}>
            <span style={styles.metricLabel}>Temp:</span>
            <span style={styles.metricValue}>{worldState.weather.temperature}&deg;C</span>
          </div>
          <div style={styles.metricCell}>
            <span style={styles.metricLabel}>Wind:</span>
            <span style={styles.metricValue}>{worldState.weather.windSpeed} km/h</span>
          </div>
          <div style={styles.metricCell}>
            <span style={styles.metricLabel}>Humidity:</span>
            <span style={styles.metricValue}>{worldState.weather.humidity}%</span>
          </div>
        </div>

        {/* Manual Weather Override Buttons */}
        <div style={styles.weatherOverrideRow}>
          <span style={styles.overrideLabel}>Override:</span>
          {(['CLEAR', 'CLOUDY', 'RAIN', 'STORM'] as WeatherType[]).map((type) => (
            <button
              key={type}
              style={{
                ...styles.overrideBtn,
                backgroundColor: worldState.weather.type === type ? '#2563eb' : '#334155',
              }}
              onClick={() => handleSetWeather(type)}
            >
              {type === 'CLEAR' && '☀️'}
              {type === 'CLOUDY' && '☁️'}
              {type === 'RAIN' && '🌧️'}
              {type === 'STORM' && '🌩️'}
              {type.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Ground Detection & Physics Telemetry HUD */}
        <div style={{ marginTop: '8px' }}>
          <button
            style={styles.aiDrawerBtn}
            onClick={() => setShowAIPerception(!showAIPerception)}
          >
            🔍 Ground & Physics Telemetry {showAIPerception ? '▲' : '▼'}
          </button>
          {showAIPerception && (
            <div style={styles.aiJsonPre}>
              <div><strong>World Pos:</strong> [{telemetry.position.join(', ')}]</div>
              <div><strong>Feet Y:</strong> {telemetry.feetY}m</div>
              <div><strong>Detected Ground Y:</strong> {telemetry.groundY}m ({telemetry.hitType})</div>
              <div><strong>Feet-Ground Delta:</strong> {telemetry.feetDelta}m</div>
              <div><strong>Nav Sector / Cell:</strong> {telemetry.sectorCoords} {telemetry.cellCoords}</div>
              <div><strong>Cell Ground Y:</strong> {telemetry.cellGroundY}m ({telemetry.cellWalkable ? 'WALKABLE' : 'BLOCKED'})</div>
              <div><strong>Terrain Slope:</strong> {telemetry.slopeAngleDeg}&deg; (Grad: {telemetry.slopeGradient})</div>
              <div><strong>Ground Hit Status:</strong> <span style={{ color: telemetry.isWalkable ? '#34d399' : '#f87171', fontWeight: 'bold' }}>{telemetry.hitStatus}</span></div>
            </div>
          )}
        </div>

        {/* Integrated Ben Autonomous AI Control HUD */}
        <BenAIDebugPanel />

        {/* Integrated Ravi Autonomous Vegetable Seller HUD */}
        <RaviDebugPanel />
      </div>

      {/* Bottom-Left Compass Graphic */}
      <div style={styles.compassContainer}>
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="rgba(15,23,42,0.6)" />
          {/* Compass Star Points */}
          <path d="M50 15 L56 44 L50 50 L44 44 Z" fill="#f59e0b" />
          <path d="M50 85 L56 56 L50 50 L44 56 Z" fill="#cbd5e1" />
          <path d="M85 50 L56 56 L50 50 L56 44 Z" fill="#94a3b8" />
          <path d="M15 50 L44 56 L50 50 L44 44 Z" fill="#cbd5e1" />
          {/* Letters */}
          <text x="50" y="10" fill="#f59e0b" fontSize="12" fontWeight="bold" textAnchor="middle">N</text>
          <text x="50" y="98" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">S</text>
          <text x="96" y="54" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">E</text>
          <text x="4" y="54" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">W</text>
        </svg>
      </div>



      {/* Bottom-Right Controls Hint Badge */}
      <div style={styles.bottomHintPill}>
        Drag to explore &bull; Scroll to zoom
      </div>

      {/* Top-Right Character Controller & View Switcher */}
      <div style={styles.topRightControls}>
        <div style={styles.viewToggleGroup}>
          <button
            style={{
              ...styles.toggleBtn,
              backgroundColor: '#7c3aed',
              color: '#ffffff',
            }}
            onClick={() => worldMapStore.setIsMapEditorOpen(true)}
          >
            🗺️ Map Editor
          </button>
          <button
            style={{
              ...styles.toggleBtn,
              backgroundColor: viewMode === 'overview' ? '#d97706' : 'rgba(30, 41, 59, 0.85)',
              color: '#ffffff',
            }}
            onClick={() => onToggleViewMode('overview')}
          >
            🎥 Village View (1000m)
          </button>
          <button
            style={{
              ...styles.toggleBtn,
              backgroundColor: viewMode === 'follow' ? '#2563eb' : 'rgba(30, 41, 59, 0.85)',
              color: '#ffffff',
            }}
            onClick={() => onToggleViewMode('follow')}
          >
            🚶 Control Character
          </button>
        </div>

        {/* Character Selection Controls */}
        <div style={styles.charSelectBox}>
          <div style={styles.charBtnRow}>
            <button
              style={{
                ...styles.charBtn,
                backgroundColor: activeCitizenId === 'ben' ? '#2563eb' : '#334155',
              }}
              onClick={() => handleSelectCitizen('ben')}
            >
              Control Ben ({citizens.ben.animState})
            </button>
            <button
              style={{
                ...styles.charBtn,
                backgroundColor: activeCitizenId === 'julie' ? '#2563eb' : '#334155',
              }}
              onClick={() => handleSelectCitizen('julie')}
            >
              Julie ({citizens.julie.animState})
            </button>
            <button
              style={{
                ...styles.charBtn,
                backgroundColor: activeCitizenId === 'ravi' ? '#10b981' : '#334155',
              }}
              onClick={() => handleSelectCitizen('ravi')}
            >
              Ravi ({raviState.currentState})
            </button>
          </div>
          <div style={styles.controlsTip}>
            WASD/Arrows to walk &bull; Hold Shift to run &bull; Mouse Drag to orbit
          </div>
        </div>
      </div>

      {/* Map Editor Modal Overlay */}
      <MapEditorModal />
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  infoCard: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '290px',
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    padding: '16px 18px',
    color: '#ffffff',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
    zIndex: 10,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    pointerEvents: 'auto',
  },
  cardTag: {
    fontSize: '9.5px',
    fontWeight: 700,
    letterSpacing: '1.6px',
    color: '#d97706',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: 800,
    margin: '3px 0 4px 0',
    color: '#f8fafc',
    letterSpacing: '-0.4px',
  },
  cardDesc: {
    fontSize: '11.5px',
    color: '#94a3b8',
    margin: '0 0 12px 0',
    lineHeight: 1.4,
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
  },
  featureIcon: {
    fontSize: '13px',
    width: '16px',
    textAlign: 'center',
  },
  featureText: {
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.8px',
    color: '#cbd5e1',
    textTransform: 'uppercase',
  },
  worldHudCard: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '310px',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '16px',
    padding: '14px 16px',
    color: '#ffffff',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
    zIndex: 10,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    pointerEvents: 'auto',
  },
  locationBadgeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  locationTag: {
    fontSize: '9.5px',
    fontWeight: 700,
    color: '#38bdf8',
    letterSpacing: '0.6px',
  },
  hudPeriodBadge: {
    fontSize: '9.5px',
    fontWeight: 700,
    backgroundColor: '#334155',
    color: '#f59e0b',
    padding: '2px 7px',
    borderRadius: '10px',
    textTransform: 'uppercase',
  },
  hudHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  hudDate: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#94a3b8',
  },
  hudTime: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#ffffff',
    fontFamily: 'monospace',
    letterSpacing: '1px',
  },
  speedControlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginBottom: '10px',
  },
  speedLabel: {
    fontSize: '10.5px',
    color: '#94a3b8',
    marginRight: '2px',
  },
  speedBtn: {
    padding: '3px 7px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '10.5px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  weatherMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '8px',
    padding: '8px',
    marginBottom: '10px',
  },
  metricCell: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
  },
  metricLabel: {
    color: '#94a3b8',
  },
  metricValue: {
    color: '#f8fafc',
    fontWeight: 600,
  },
  metricValueBold: {
    color: '#38bdf8',
    fontWeight: 700,
  },
  weatherOverrideRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  overrideLabel: {
    fontSize: '10.5px',
    color: '#94a3b8',
    marginRight: '2px',
  },
  overrideBtn: {
    flex: 1,
    padding: '4px 2px',
    border: 'none',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    textTransform: 'capitalize',
  },
  aiDrawerBtn: {
    width: '100%',
    padding: '5px',
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#cbd5e1',
    fontSize: '10.5px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  aiJsonPre: {
    marginTop: '6px',
    backgroundColor: '#090d16',
    border: '1px solid #1e293b',
    borderRadius: '6px',
    padding: '8px',
    fontSize: '10px',
    color: '#38bdf8',
    maxHeight: '130px',
    overflowY: 'auto',
    fontFamily: 'monospace',
  },
  compassContainer: {
    position: 'absolute',
    bottom: '24px',
    left: '24px',
    zIndex: 10,
    pointerEvents: 'none',
  },
  bottomHintPill: {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '20px',
    padding: '7px 16px',
    color: '#cbd5e1',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.4px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    zIndex: 10,
    pointerEvents: 'none',
  },
  topRightControls: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
    zIndex: 10,
    pointerEvents: 'auto',
  },
  viewToggleGroup: {
    display: 'flex',
    gap: '8px',
  },
  toggleBtn: {
    padding: '8px 14px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.2s ease',
  },
  charSelectBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    padding: '10px 12px',
    width: '270px',
  },
  charBtnRow: {
    display: 'flex',
    gap: '6px',
  },
  charBtn: {
    flex: 1,
    padding: '6px 8px',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  controlsTip: {
    fontSize: '10px',
    color: '#94a3b8',
    marginTop: '6px',
    textAlign: 'center',
  },
};

export default WillowbrookOverlay;
