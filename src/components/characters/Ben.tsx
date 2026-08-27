import React from 'react';
import { useGLTF } from '@react-three/drei';
import { Citizen } from './Citizen';
import { CitizenState } from '../../types/citizen';
import { BEN_CONFIG } from '../../config/citizens';

export { BEN_CONFIG };

// Preload model asset for immediate R3F availability
useGLTF.preload('/assets/characters/ben.glb');

interface BenProps {
  state: CitizenState;
  isSelected: boolean;
}

export const Ben: React.FC<BenProps> = ({ state, isSelected }) => {
  return <Citizen config={BEN_CONFIG} state={state} isSelected={isSelected} />;
};
