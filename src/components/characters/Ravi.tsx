import React from 'react';
import { useGLTF } from '@react-three/drei';
import { Citizen } from './Citizen';
import { CitizenState } from '../../types/citizen';
import { RAVI_CONFIG } from '../../config/citizens';

export { RAVI_CONFIG };

// Preload Ravi NPC model asset for immediate R3F availability
useGLTF.preload('/assets/characters/NPC.glb');

interface RaviProps {
  state: CitizenState;
  isSelected: boolean;
}

export const Ravi: React.FC<RaviProps> = ({ state, isSelected }) => {
  return <Citizen config={RAVI_CONFIG} state={state} isSelected={isSelected} />;
};

export default Ravi;
