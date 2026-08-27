import React from 'react';
import { useGLTF } from '@react-three/drei';
import { Citizen } from './Citizen';
import { CitizenState } from '../../types/citizen';
import { JULIE_CONFIG } from '../../config/citizens';

export { JULIE_CONFIG };

// Preload model asset for immediate R3F availability
useGLTF.preload('/assets/characters/julie.glb');

interface JulieProps {
  state: CitizenState;
  isSelected: boolean;
}

export const Julie: React.FC<JulieProps> = ({ state, isSelected }) => {
  return <Citizen config={JULIE_CONFIG} state={state} isSelected={isSelected} />;
};
