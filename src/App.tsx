import React, { useEffect, useState } from 'react';
import { World } from './components/world/World';
import { WillowbrookOverlay } from './components/ui/WillowbrookOverlay';
import { simulationEngine } from './systems/simulation/SimulationEngine';
import { SimulationState } from './types/citizen';

export const App: React.FC = () => {
  const [simState, setSimState] = useState<SimulationState>(simulationEngine.getState());
  const [viewMode, setViewMode] = useState<'overview' | 'follow'>('overview');

  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe((newState) => {
      setSimState(newState);
    });
    return unsubscribe;
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#0f172a' }}>
      <WillowbrookOverlay
        simState={simState}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />
      <World simState={simState} viewMode={viewMode} />
    </div>
  );
};

export default App;
