"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import type { TreeSpecies } from "../data/parseTrees";

interface Tree3DProps {
  speciesName: string;
  yearProgress: number;
  maturityYears: number;
  healthScore: number;
  species: TreeSpecies;
}

/**
 * Main 3D Tree Component - Procedurally generated stylized tree
 * Renders 3D lifecycle progression with roots, curved trunk, and canopy clouds
 */
export function Tree3D({
  speciesName,
  yearProgress,
  maturityYears,
  healthScore,
  species,
}: Tree3DProps) {
  const progress = Math.min(1, yearProgress / maturityYears);
  
  // Vibrant green palette based on health
  let leafColor = "#4a7c2f"; // Deep green (healthy)
  if (healthScore > 0.7) leafColor = "#7ec850"; // Bright green
  else if (healthScore > 0.5) leafColor = "#6ba840"; // Mid green
  else if (healthScore > 0.3) leafColor = "#5a9030"; // Muted green
  else leafColor = "#3d6b1f"; // Dark olive

  const stageConfig = useMemo(() => {
    let stage = "sapling";
    let stageProgress = 0;

    if (progress < 0.25) {
      stage = "sapling";
      stageProgress = progress / 0.25;
    } else if (progress < 0.5) {
      stage = "small-plant";
      stageProgress = (progress - 0.25) / 0.25;
    } else if (progress < 0.75) {
      stage = "half-grown";
      stageProgress = (progress - 0.5) / 0.25;
    } else {
      stage = "fully-grown";
      stageProgress = (progress - 0.75) / 0.25;
    }

    return { stage, stageProgress, progress };
  }, [progress]);

  // Determine root characteristics from species data
  let maxRootDepth = 0.5;
  let rootSpread = 0.6;
  if (species.root_deep === 1) {
    maxRootDepth = 1.2;
    rootSpread = 1.2;
  } else if (species.root_medium === 1) {
    maxRootDepth = 0.8;
    rootSpread = 0.9;
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-sky-900/30 to-emerald-950/40 relative flex flex-col items-center justify-center">
      <Canvas
        camera={{ position: [0, 2.5, 6], fov: 40 }}
        className="w-full h-full"
        gl={{
          antialias: true,
          alpha: true,
        } as any}
      >
        <PerspectiveCamera makeDefault position={[0, 2.5, 6]} fov={40} />

        {/* Lighting setup */}
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[6, 10, 4]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-4, 3, -3]} intensity={0.4} color="#87CEEB" />

        {/* Ground plane */}
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[15, 15]} />
          <meshStandardMaterial color="#5a6a52" roughness={0.9} metalness={0} />
        </mesh>

        {/* Root system */}
        <RootSystem
          progress={stageConfig.progress}
          maxDepth={maxRootDepth}
          spread={rootSpread}
        />

        {/* Procedural 3D Tree */}
        <TreeModel
          speciesName={speciesName}
          progress={stageConfig.progress}
          stageProgress={stageConfig.stageProgress}
          stage={stageConfig.stage}
          leafColor={leafColor}
          trunkColor="#5d4e37"
        />

        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.2} />
      </Canvas>

      {/* Stage label */}
      <motion.div
        key={stageConfig.stage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-4 left-4 rounded-full border border-white/20 bg-black/50 px-4 py-2 backdrop-blur"
      >
        <div className="text-xs font-semibold text-emerald-300 capitalize">
          {stageConfig.stage === "small-plant"
            ? "Small Plant"
            : stageConfig.stage === "half-grown"
              ? "Half-Grown"
              : stageConfig.stage === "fully-grown"
                ? "Fully Grown"
                : "Sapling"}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Root System Component
 * Procedurally generates fibrous roots extending downward and outward
 */
function RootSystem({
  progress,
  maxDepth,
  spread,
}: {
  progress: number;
  maxDepth: number;
  spread: number;
}) {
  const rootGeometries = useMemo(() => {
    const geometries: { position: THREE.Vector3; scale: THREE.Vector3 }[] = [];

    // Primary taproot
    geometries.push({
      position: new THREE.Vector3(0, -maxDepth * progress * 0.5, 0),
      scale: new THREE.Vector3(0.12 * (0.8 + progress * 0.4), maxDepth * progress, 0.12 * (0.8 + progress * 0.4)),
    });

    // 6 lateral roots in radial pattern
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * spread * progress * 0.6;
      const z = Math.sin(angle) * spread * progress * 0.6;
      const length = maxDepth * progress * 0.65;

      geometries.push({
        position: new THREE.Vector3(x, -0.15 - length * 0.3, z),
        scale: new THREE.Vector3(
          0.08 * (0.7 + progress * 0.3),
          length,
          0.08 * (0.7 + progress * 0.3)
        ),
      });

      // Secondary rootlets
      if (progress > 0.4) {
        const subAngle = angle + 0.3;
        const sx = Math.cos(subAngle) * spread * progress * 0.4;
        const sz = Math.sin(subAngle) * spread * progress * 0.4;
        geometries.push({
          position: new THREE.Vector3(sx, -0.1 - length * 0.5, sz),
          scale: new THREE.Vector3(0.04, length * 0.5, 0.04),
        });
      }
    }

    return geometries;
  }, [progress, maxDepth, spread]);

  return (
    <group>
      {rootGeometries.map((root, idx) => (
        <mesh key={`root-${idx}`} position={root.position} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 1, 8]} />
          <meshStandardMaterial
            color={idx === 0 ? "#6b4423" : "#7a5230"}
            roughness={0.85}
            metalness={0}
            transparent
            opacity={0.75}
          />
          <primitive object={new THREE.Object3D()} scale={root.scale} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Generate curved trunk path using CatmullRomCurve3
 */
function generateTrunkCurve(height: number): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.08, height * 0.3, -0.05),
    new THREE.Vector3(0.05, height * 0.6, 0.08),
    new THREE.Vector3(-0.06, height * 0.9, 0),
    new THREE.Vector3(0, height, 0),
  ];
  return new THREE.CatmullRomCurve3(points);
}

/**
 * TreeModel Component
 * Procedurally generates trunk, branches, and canopy clouds
 */
function TreeModel({
  speciesName,
  progress,
  stageProgress,
  stage,
  leafColor,
  trunkColor,
}: {
  speciesName: string;
  progress: number;
  stageProgress: number;
  stage: string;
  leafColor: string;
  trunkColor: string;
}) {
  // Species-specific parameters
  const getTreeParams = () => {
    const params: any = {
      trunkHeight: 1.2,
      trunkRadiusBase: 0.15,
      canopyHeight: 0.8,
      canopyRadius: 0.6,
      branchCount: 3,
      branchAngle: Math.PI / 6,
      rootSpreads: [0.6, 0.5, 0.4],
    };

    if (speciesName === "Banyan") {
      params.trunkHeight = 1.0;
      params.trunkRadiusBase = 0.18;
      params.canopyRadius = 0.8;
      params.canopyHeight = 0.7;
      params.branchCount = 4;
    } else if (speciesName === "Neem") {
      params.trunkHeight = 1.3;
      params.trunkRadiusBase = 0.12;
      params.canopyRadius = 0.7;
      params.canopyHeight = 0.9;
      params.branchCount = 3;
    } else if (speciesName === "Peepal") {
      params.trunkHeight = 1.2;
      params.trunkRadiusBase = 0.13;
      params.canopyRadius = 0.75;
      params.canopyHeight = 0.85;
      params.branchCount = 3;
    } else if (speciesName === "Teak") {
      params.trunkHeight = 1.35;
      params.trunkRadiusBase = 0.16;
      params.canopyRadius = 0.65;
      params.canopyHeight = 0.95;
      params.branchCount = 3;
    } else if (speciesName === "Sal") {
      params.trunkHeight = 1.1;
      params.trunkRadiusBase = 0.14;
      params.canopyRadius = 0.55;
      params.canopyHeight = 0.75;
      params.branchCount = 3;
    }

    return params;
  };

  const params = useMemo(() => getTreeParams(), [speciesName]);

  // Scale based on growth stage
  let trunkHeightScale = 0.3;
  let trunkRadiusScale = 0.3;
  let canopyScale = 0;

  if (stage === "sapling") {
    trunkHeightScale = 0.3 + stageProgress * 0.2;
    trunkRadiusScale = 0.3 + stageProgress * 0.15;
    canopyScale = stageProgress * 0.4;
  } else if (stage === "small-plant") {
    trunkHeightScale = 0.5 + stageProgress * 0.25;
    trunkRadiusScale = 0.45 + stageProgress * 0.2;
    canopyScale = 0.4 + stageProgress * 0.3;
  } else if (stage === "half-grown") {
    trunkHeightScale = 0.75 + stageProgress * 0.2;
    trunkRadiusScale = 0.65 + stageProgress * 0.15;
    canopyScale = 0.7 + stageProgress * 0.25;
  } else {
    trunkHeightScale = 0.95 + stageProgress * 0.05;
    trunkRadiusScale = 0.8 + stageProgress * 0.1;
    canopyScale = 0.95 + stageProgress * 0.05;
  }

  const trunkHeight = params.trunkHeight * trunkHeightScale;
  const trunkRadiusBase = params.trunkRadiusBase * trunkRadiusScale;
  const canopyRadius = params.canopyRadius * Math.sqrt(canopyScale);

  return (
    <group position={[0, 0, 0]}>
      {/* Curved Trunk */}
      <TrunkMesh
        height={trunkHeight}
        radiusBase={trunkRadiusBase}
        color={trunkColor}
        progress={progress}
      />

      {/* Branches (visual guides for canopy placement) */}
      {canopyScale > 0.1 && (
        <BranchGroup
          trunkHeight={trunkHeight}
          branchCount={params.branchCount}
          canopyRadius={canopyRadius}
          progress={progress}
          leafColor={leafColor}
        />
      )}

      {/* Canopy Cloud - multiple distorted spheres */}
      {canopyScale > 0.2 && (
        <CanopyCloud
          centerX={0}
          centerY={trunkHeight + 0.15}
          centerZ={0}
          radius={canopyRadius}
          blobCount={8 + Math.floor(canopyScale * 4)}
          leafColor={leafColor}
          scale={canopyScale}
          progress={progress}
        />
      )}
    </group>
  );
}

/**
 * Trunk Mesh - curved, tapered trunk using TubeGeometry
 */
function TrunkMesh({
  height,
  radiusBase,
  color,
  progress,
}: {
  height: number;
  radiusBase: number;
  color: string;
  progress: number;
}) {
  const curveRef = useRef<THREE.TubeGeometry>(null);

  const curve = useMemo(() => {
    return generateTrunkCurve(height);
  }, [height]);

  const tubeGeometry = useMemo(() => {
    const geo = new THREE.TubeGeometry(curve, 20, radiusBase * 1.1, 8, false);
    return geo;
  }, [curve, radiusBase]);

  return (
    <mesh geometry={tubeGeometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        roughness={0.8}
        metalness={0}
      />
    </mesh>
  );
}

/**
 * Branch Group - visual structure for canopy support
 */
function BranchGroup({
  trunkHeight,
  branchCount,
  canopyRadius,
  progress,
  leafColor,
}: {
  trunkHeight: number;
  branchCount: number;
  canopyRadius: number;
  progress: number;
  leafColor: string;
}) {
  return (
    <group>
      {[...Array(branchCount)].map((_, i) => {
        const angle = (i / branchCount) * Math.PI * 2;
        const spread = canopyRadius * 0.5;
        const x = Math.cos(angle) * spread;
        const z = Math.sin(angle) * spread;
        const y = trunkHeight - 0.2;

        return (
          <mesh key={`branch-${i}`} position={[x, y, z]} castShadow>
            <sphereGeometry args={[canopyRadius * 0.35, 10, 8]} />
            <meshStandardMaterial
              color={leafColor}
              roughness={0.6}
              metalness={0}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Canopy Cloud - procedurally generated distorted spheres
 */
function CanopyCloud({
  centerX,
  centerY,
  centerZ,
  radius,
  blobCount,
  leafColor,
  scale,
  progress,
}: {
  centerX: number;
  centerY: number;
  centerZ: number;
  radius: number;
  blobCount: number;
  leafColor: string;
  scale: number;
  progress: number;
}) {
  const blobs = useMemo(() => {
    const blobPositions: { pos: THREE.Vector3; size: number }[] = [];

    // Distribute blobs in a spherical pattern
    for (let i = 0; i < blobCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / blobCount); // Golden sphere distribution
      const theta = Math.sqrt(Math.PI * blobCount) * phi;

      const x = Math.cos(theta) * Math.sin(phi) * radius;
      const y = Math.cos(phi) * radius * 0.7;
      const z = Math.sin(theta) * Math.sin(phi) * radius;

      const size = 0.25 + Math.random() * 0.15;

      blobPositions.push({
        pos: new THREE.Vector3(centerX + x, centerY + y, centerZ + z),
        size,
      });
    }

    return blobPositions;
  }, [blobCount, radius, centerX, centerY, centerZ]);

  return (
    <group>
      {blobs.map((blob, idx) => (
        <BlobMesh
          key={`blob-${idx}`}
          position={[blob.pos.x, blob.pos.y, blob.pos.z]}
          size={blob.size}
          scale={scale}
          delay={idx * 0.02}
          leafColor={leafColor}
        />
      ))}
    </group>
  );
}

/**
 * Individual blob with spring animation
 */
function BlobMesh({
  position,
  size,
  scale,
  delay,
  leafColor,
}: {
  position: [number, number, number];
  size: number;
  scale: number;
  delay: number;
  leafColor: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      scale={[0, 0, 0]}
    >
      <icosahedronGeometry args={[size, 3]} />
      <meshStandardMaterial
        color={leafColor}
        roughness={0.65}
        metalness={0}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
