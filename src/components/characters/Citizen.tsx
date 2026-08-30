import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, useFBX } from '@react-three/drei';
import { Group, Mesh, Bone } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { CitizenConfig, CitizenState, AnimationState } from '../../types/citizen';
import { speechSystem, ActiveSpeech } from '../../systems/speech/SpeechSystem';
import { SpeechBubble3D } from '../world/SpeechBubble3D';

// Preload FBX animation assets for instant R3F availability
useFBX.preload('/assets/animations/Breathing Idle.fbx');
useFBX.preload('/assets/animations/Walking.fbx');
useFBX.preload('/assets/animations/Running.fbx');
useFBX.preload('/assets/animations/Swimming.fbx');
useFBX.preload('/assets/animations/Treading Water.fbx');
useFBX.preload('/assets/animations/Talking.fbx');
useFBX.preload('/assets/animations/Farming Pack/watering.fbx');
useFBX.preload('/assets/animations/Farming Pack/pick fruit.fbx');
useFBX.preload('/assets/animations/Farming Pack/plant a plant.fbx');
useFBX.preload('/assets/animations/Farming Pack/pull plant.fbx');
useFBX.preload('/assets/animations/Farming Pack/cow milking.fbx');
useFBX.preload('/assets/animations/Farming Pack/wheelbarrow walk.fbx');

interface CitizenProps {
  config: CitizenConfig;
  state: CitizenState;
  isSelected: boolean;
}

export const Citizen: React.FC<CitizenProps> = ({ config, state, isSelected }) => {
  const groupRef = useRef<Group>(null);
  const sceneRef = useRef<Group>(null);
  const headBoneRef = useRef<Bone | null>(null);

  const [activeSpeech, setActiveSpeech] = useState<ActiveSpeech | null>(null);

  // Subscribe to real-time speech synthesis system
  useEffect(() => {
    const unsubscribe = speechSystem.subscribe((map) => {
      setActiveSpeech(map[config.id] || null);
    });
    return unsubscribe;
  }, [config.id]);

  // Load character GLB model (Ben / Julie / Ravi)
  const { scene: rawScene, animations: glbAnimations } = useGLTF(config.modelPath);

  // Clone GLB scene per component instance to ensure independent skeleton bone bindings
  const scene = useMemo(() => SkeletonUtils.clone(rawScene), [rawScene]);

  // Load external FBX animations
  const fbxIdle = useFBX('/assets/animations/Breathing Idle.fbx');
  const fbxWalk = useFBX('/assets/animations/Walking.fbx');
  const fbxRun = useFBX('/assets/animations/Running.fbx');
  const fbxSwim = useFBX('/assets/animations/Swimming.fbx');
  const fbxTread = useFBX('/assets/animations/Treading Water.fbx');
  const fbxTalking = useFBX('/assets/animations/Talking.fbx');
  const fbxWatering = useFBX('/assets/animations/Farming Pack/watering.fbx');
  const fbxHarvest = useFBX('/assets/animations/Farming Pack/pick fruit.fbx');
  const fbxPlant = useFBX('/assets/animations/Farming Pack/plant a plant.fbx');
  const fbxPullPlant = useFBX('/assets/animations/Farming Pack/pull plant.fbx');
  const fbxCowMilking = useFBX('/assets/animations/Farming Pack/cow milking.fbx');
  const fbxWheelbarrow = useFBX('/assets/animations/Farming Pack/wheelbarrow walk.fbx');

  // Retarget Idle animation clip
  const idleClip = useMemo(() => {
    if (!fbxIdle?.animations?.length) return null;
    const clip = fbxIdle.animations[0].clone();
    clip.name = 'FBXIdle';
    return clip;
  }, [fbxIdle]);

  // Retarget Walk animation clip
  const walkClip = useMemo(() => {
    if (!fbxWalk?.animations?.length) return null;
    const clip = fbxWalk.animations[0].clone();
    clip.name = 'FBXWalk';
    return clip;
  }, [fbxWalk]);

  // Retarget Run animation clip
  const runClip = useMemo(() => {
    if (!fbxRun?.animations?.length) return null;
    const clip = fbxRun.animations[0].clone();
    clip.name = 'FBXRun';
    return clip;
  }, [fbxRun]);

  // Retarget Swim animation clip
  const swimClip = useMemo(() => {
    if (!fbxSwim?.animations?.length) return null;
    const clip = fbxSwim.animations[0].clone();
    clip.name = 'Swim';
    return clip;
  }, [fbxSwim]);

  // Retarget Treading Water animation clip
  const treadClip = useMemo(() => {
    if (!fbxTread?.animations?.length) return null;
    const clip = fbxTread.animations[0].clone();
    clip.name = 'TreadWater';
    return clip;
  }, [fbxTread]);

  // Retarget Talking animation clip
  const talkClip = useMemo(() => {
    if (!fbxTalking?.animations?.length) return null;
    const clip = fbxTalking.animations[0].clone();
    clip.name = 'Talk';
    return clip;
  }, [fbxTalking]);

  // Retarget Farming Pack animation clips
  const waterCropClip = useMemo(() => {
    if (!fbxWatering?.animations?.length) return null;
    const clip = fbxWatering.animations[0].clone();
    clip.name = 'WaterCrop';
    return clip;
  }, [fbxWatering]);

  const harvestCropClip = useMemo(() => {
    if (!fbxHarvest?.animations?.length) return null;
    const clip = fbxHarvest.animations[0].clone();
    clip.name = 'HarvestCrop';
    return clip;
  }, [fbxHarvest]);

  const plantCropClip = useMemo(() => {
    if (!fbxPlant?.animations?.length) return null;
    const clip = fbxPlant.animations[0].clone();
    clip.name = 'PlantCrop';
    return clip;
  }, [fbxPlant]);

  const plantClip = useMemo(() => {
    if (!fbxPlant?.animations?.length) return null;
    const clip = fbxPlant.animations[0].clone();
    clip.name = 'Plant';
    return clip;
  }, [fbxPlant]);

  const pullPlantClip = useMemo(() => {
    if (!fbxPullPlant?.animations?.length) return null;
    const clip = fbxPullPlant.animations[0].clone();
    clip.name = 'PullPlant';
    return clip;
  }, [fbxPullPlant]);

  const milkCowClip = useMemo(() => {
    if (!fbxCowMilking?.animations?.length) return null;
    const clip = fbxCowMilking.animations[0].clone();
    clip.name = 'MilkCow';
    return clip;
  }, [fbxCowMilking]);

  const wheelbarrowClip = useMemo(() => {
    if (!fbxWheelbarrow?.animations?.length) return null;
    const clip = fbxWheelbarrow.animations[0].clone();
    clip.name = 'Wheelbarrow';
    return clip;
  }, [fbxWheelbarrow]);

  // Combine GLB animations with FBX animation clips
  const allClips = useMemo(() => {
    const list = [...glbAnimations];
    if (idleClip) list.push(idleClip);
    if (walkClip) list.push(walkClip);
    if (runClip) list.push(runClip);
    if (swimClip) list.push(swimClip);
    if (treadClip) list.push(treadClip);
    if (talkClip) list.push(talkClip);
    if (waterCropClip) list.push(waterCropClip);
    if (harvestCropClip) list.push(harvestCropClip);
    if (plantCropClip) list.push(plantCropClip);
    if (plantClip) list.push(plantClip);
    if (pullPlantClip) list.push(pullPlantClip);
    if (milkCowClip) list.push(milkCowClip);
    if (wheelbarrowClip) list.push(wheelbarrowClip);
    return list;
  }, [
    glbAnimations,
    idleClip,
    walkClip,
    runClip,
    swimClip,
    treadClip,
    talkClip,
    waterCropClip,
    harvestCropClip,
    plantCropClip,
    plantClip,
    pullPlantClip,
    milkCowClip,
    wheelbarrowClip,
  ]);

  const { actions } = useAnimations(allClips, sceneRef);

  // Enable shadow casting & discover head bone reference
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.type === 'Bone' && (child.name.toLowerCase().includes('head') || child.name.toLowerCase().includes('neck'))) {
        headBoneRef.current = child as Bone;
      }
    });
  }, [scene]);

  // Handle smooth animation state transitions (including Talking gesture animation)
  useEffect(() => {
    const isSpeaking = activeSpeech?.isSpeaking;

    const actionNameMap: Record<string, string> = {
      IDLE: isSpeaking ? 'Talk' : 'Idle',
      WALK: 'Walk',
      RUN: 'Run',
      SWIM: 'Swim',
      TREAD_WATER: 'TreadWater',
      TALK: 'Talk',
      WATER_CROP: 'WaterCrop',
      HARVEST_CROP: 'HarvestCrop',
      PLANT_CROP: 'PlantCrop',
      DIG: 'PlantCrop',
      PLANT: 'Plant',
      PULL_PLANT: 'PullPlant',
      MILK_COW: 'MilkCow',
      WHEELBARROW: 'Wheelbarrow',
    };

    let targetName = actionNameMap[state.animState] || (isSpeaking ? 'Talk' : 'Idle');

    // Priority 1: Direct exact match in actions map
    let targetAction = actions[targetName];

    // Priority 2: Case-insensitive search preferring native GLB embedded clips
    if (!targetAction) {
      const keys = Object.keys(actions);
      const nativeKey = keys.find(
        (k) => !k.startsWith('FBX') && k.toLowerCase().includes(targetName.toLowerCase())
      );
      if (nativeKey) {
        targetAction = actions[nativeKey];
      }
    }

    // Priority 3: Fallback for Talk
    if (!targetAction && (targetName === 'Talk' || isSpeaking)) {
      targetAction = actions['Talk'] || actions['FBXIdle'] || actions['Idle'];
    }

    // Priority 4: For IDLE or generic standing on NPC.glb, use native upright clip 'mixamo.com'
    if (!targetAction && (state.animState === 'IDLE' || targetName === 'Idle')) {
      targetAction = actions['mixamo.com'] || actions['Idle'] || actions['FBXIdle'];
    }

    // Priority 5: Fallback for locomotion (WALK / RUN)
    if (!targetAction) {
      if (state.animState === 'WALK' || targetName === 'Walk') {
        targetAction = actions['FBXWalk'] || actions['mixamo.com'] || actions['Idle'];
      } else if (state.animState === 'RUN' || targetName === 'Run') {
        targetAction = actions['FBXRun'] || actions['FBXWalk'] || actions['mixamo.com'] || actions['Idle'];
      }
    }

    // Ultimate fallback
    if (!targetAction) {
      const keys = Object.keys(actions);
      if (keys.length > 0) {
        targetAction = actions[keys[0]];
      }
    }

    if (targetAction) {
      // Fade out all other currently running actions
      Object.keys(actions).forEach((key) => {
        const act = actions[key];
        if (act && act !== targetAction && act.isRunning()) {
          act.fadeOut(0.25);
        }
      });

      targetAction.reset().fadeIn(0.25).play();
    }
  }, [state.animState, activeSpeech?.isSpeaking, actions]);

  // Frame tick: Procedural head bobbing & mouth movement during speech + terrain position locking
  useFrame((_, delta) => {
    if (!groupRef.current || !sceneRef.current) return;

    const isSwimming = state.animState === 'SWIM' || state.animState === 'TREAD_WATER';
    if (isSwimming) {
      sceneRef.current.position.y = 0.1;
    } else {
      sceneRef.current.position.y = 0;
    }

    // Procedural speech animation: head nodding & jaw/mouth morph target inflations
    if (activeSpeech?.isSpeaking) {
      const mouthAmount = activeSpeech.mouthOpenAmount;
      const headNod = Math.sin(Date.now() * 0.012) * 0.06 * mouthAmount;

      if (headBoneRef.current) {
        headBoneRef.current.rotation.x += (headNod - headBoneRef.current.rotation.x) * Math.min(1, delta * 15);
      }

      // Traversal for morph target mouth/jaw animation if model supports morphTargets
      scene.traverse((child) => {
        if ((child as Mesh).isMesh && (child as Mesh).morphTargetInfluences) {
          const mesh = child as Mesh;
          const dict = mesh.morphTargetDictionary;
          if (dict) {
            const jawOpenIdx = dict['jawOpen'] ?? dict['mouthOpen'] ?? dict['viseme_aa'] ?? dict['vrc.v_aa'];
            if (jawOpenIdx !== undefined && mesh.morphTargetInfluences) {
              mesh.morphTargetInfluences[jawOpenIdx] = mouthAmount * 0.75;
            }
          }
        }
      });
    }
  });

  return (
    <group
      ref={groupRef}
      position={state.position}
      rotation={[0, state.rotationY, 0]}
    >
      <primitive ref={sceneRef} object={scene} />

      {/* Floating 3D Speech Bubble Overhead */}
      {activeSpeech && activeSpeech.isSpeaking && (
        <SpeechBubble3D citizenId={config.id} speech={activeSpeech} />
      )}

      {/* Selection indicator ring under character feet */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

export default Citizen;


