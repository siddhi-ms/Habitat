"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface TreeGrowthModelProps {
  growthProgress: number; // 0 to 100
  speciesName?: string;
}

interface StageInfo {
  id: number;
  object: THREE.Object3D;
  baseScale: THREE.Vector3;
}

export function TreeGrowthModel({ growthProgress }: TreeGrowthModelProps) {
  // Load the model
  const gltf = useGLTF("/tree_image/tropical_mango_trees_free.glb");

  // Clone the scene so we can modify it safely
  const clonedScene = useMemo(() => {
    if (!gltf.scene) return null;
    return gltf.scene.clone(true);
  }, [gltf.scene]);

  const [stages, setStages] = useState<StageInfo[]>([]);
  const scaleRef = useRef<number[]>([]);

  useLayoutEffect(() => {
    if (!clonedScene) return;

    // --- STEP 1: FIND ALL TREE STAGES ---
    const foundStages: THREE.Object3D[] = [];
    
    // Attempt to find top-level groups or meshes
    clonedScene.traverse((child) => {
      if (child.parent === clonedScene && (child.type === 'Group' || child.type === 'Mesh')) {
        foundStages.push(child);
      }
    });

    // Fallback: If hierarchy is flat, find all meshes
    if (foundStages.length === 0) {
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) foundStages.push(child);
      });
    }

    // --- STEP 2: SORT BY HEIGHT (Sapling -> Mature) ---
    // We must reset them first to get accurate measurements
    foundStages.forEach(stage => {
      stage.scale.set(1, 1, 1);
      stage.rotation.set(0, 0, 0);
      stage.position.set(0, 0, 0);
      stage.updateWorldMatrix(true, true);
    });

    const measuredStages = foundStages.map(stage => {
      const bbox = new THREE.Box3().setFromObject(stage);
      const height = bbox.max.y - bbox.min.y;
      return { stage, height };
    });

    measuredStages.sort((a, b) => a.height - b.height);

    // --- STEP 3: NORMALIZE (Force Size & Center) ---
    // Target height for the largest tree (e.g., 5 meters)
    const TARGET_HEIGHT = 5; 
    const largestHeight = measuredStages[measuredStages.length - 1]?.height || 1;
    
    // Calculate global scale factor to make the biggest tree 5 units tall
    const globalScale = TARGET_HEIGHT / largestHeight;

    const processedStages: StageInfo[] = measuredStages.map((item, index) => {
      const { stage } = item;

      // Apply Scale
      stage.scale.setScalar(globalScale);
      stage.updateWorldMatrix(true, true);

      // Re-Center: Move bottom-center to (0,0,0)
      const bbox = new THREE.Box3().setFromObject(stage);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      
      const offsetX = -center.x;
      const offsetY = -bbox.min.y; // Move bottom to floor
      const offsetZ = -center.z;

      stage.position.set(offsetX, offsetY, offsetZ);

      // Force Material Visibility
      stage.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const m = (node as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (m) {
            m.side = THREE.DoubleSide; // Render both sides
            m.transparent = false;     // Disable transparency issues
            m.opacity = 1.0;
            m.depthWrite = true;
            m.needsUpdate = true;
          }
          // Enable Shadows
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      // Initial Visibility: Hide all except first
      stage.visible = index === 0;

      return { 
        id: index, 
        object: stage,
        baseScale: stage.scale.clone() 
      };
    });

    setStages(processedStages);
    // Initialize scale refs for animation
    scaleRef.current = processedStages.map((_, i) => (i === 0 ? 1 : 0));

  }, [clonedScene]);

  // --- ANIMATION LOOP ---
  useFrame((state, delta) => {
    if (stages.length === 0) return;

    // Calculate which stage should be active (0 to N) based on progress (0-100)
    // We clamp index so it doesn't go out of bounds
    const maxIndex = stages.length - 1;
    const activeIndex = Math.min(
      Math.floor((growthProgress / 100) * (stages.length)), 
      maxIndex
    );

    stages.forEach((stageInfo, idx) => {
      const isTarget = idx === activeIndex;
      
      // Smoothly animate scale factor (0 -> 1)
      // Damp(current, target, smoothTime, delta)
      const targetFactor = isTarget ? 1 : 0;
      scaleRef.current[idx] = THREE.MathUtils.damp(
        scaleRef.current[idx], 
        targetFactor, 
        isTarget ? 8 : 15, // Grow fast, shrink faster
        delta
      );

      const s = scaleRef.current[idx];

      // Apply the scale animation to the object's BASE scale
      if (s < 0.01) {
        stageInfo.object.visible = false;
      } else {
        stageInfo.object.visible = true;
        stageInfo.object.scale.copy(stageInfo.baseScale).multiplyScalar(s);
      }
    });
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Render the processed scene */}
      {clonedScene && <primitive object={clonedScene} />}
      
      {/* DEBUG: Uncomment this red box if tree is STILL invisible. 
          If you see the box but no tree, the tree is broken. */}
      {/* <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 1, 0.5]} />
        <meshStandardMaterial color="red" wireframe />
      </mesh> 
      */}
    </group>
  );
}