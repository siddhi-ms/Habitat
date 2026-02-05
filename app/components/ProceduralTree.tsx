"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { TreeSpecies } from "../data/parseTrees";

interface ProceduralTreeProps {
  speciesName: string;
  yearProgress: number;
  maturityYears: number;
  healthScore: number;
  species: TreeSpecies;
}

/**
 * Procedural Tree Component - Smooth continuous growth animation
 * Uses CatmullRomCurve3 for roots, TubeGeometry for structure, and cloud clusters for canopy
 */
export function ProceduralTree({
  speciesName,
  yearProgress,
  maturityYears,
  healthScore,
  species,
}: ProceduralTreeProps) {
  const growthProgress = Math.min(1, yearProgress / maturityYears);

  // Vibrant green palette based on health
  let leafColor = "#4a7c2f"; // Deep green (healthy)
  if (healthScore > 0.7) leafColor = "#7ec850"; // Bright green
  else if (healthScore > 0.5) leafColor = "#6ba840"; // Mid green
  else if (healthScore > 0.3) leafColor = "#5a9030"; // Muted green
  else leafColor = "#3d6b1f"; // Dark olive

  // Species-specific parameters
  const getTreeParams = () => {
    const params: any = {
      maxTrunkHeight: 1.4,
      maxTrunkRadius: 0.16,
      canopyRadius: 0.7,
      maxRootDepth: 0.8,
      maxRootSpread: 0.9,
      rootCount: 9,
      canopyBlobCount: 48, // High density: 40-50 blobs
    };

    if (speciesName === "Banyan") {
      params.maxTrunkHeight = 1.1;
      params.maxTrunkRadius = 0.2;
      params.canopyRadius = 0.85;
      params.maxRootDepth = 1.2;
      params.maxRootSpread = 1.3;
      params.rootCount = 12;
      params.canopyBlobCount = 52; // Higher for wider tree
    } else if (speciesName === "Neem") {
      params.maxTrunkHeight = 1.5;
      params.maxTrunkRadius = 0.13;
      params.canopyRadius = 0.75;
      params.maxRootDepth = 0.9;
      params.maxRootSpread = 1.0;
      params.rootCount = 10;
      params.canopyBlobCount = 50; // Tall, dense canopy
    } else if (speciesName === "Peepal") {
      params.maxTrunkHeight = 1.3;
      params.maxTrunkRadius = 0.14;
      params.canopyRadius = 0.8;
      params.maxRootDepth = 1.0;
      params.maxRootSpread = 0.95;
      params.rootCount = 8;
      params.canopyBlobCount = 48; // Rounded, full canopy
    } else if (speciesName === "Teak") {
      params.maxTrunkHeight = 1.6;
      params.maxTrunkRadius = 0.17;
      params.canopyRadius = 0.68;
      params.maxRootDepth = 1.1;
      params.maxRootSpread = 1.1;
      params.rootCount = 10;
      params.canopyBlobCount = 46; // Pyramidal shape, still dense
    } else if (speciesName === "Sal") {
      params.maxTrunkHeight = 1.2;
      params.maxTrunkRadius = 0.15;
      params.canopyRadius = 0.65;
      params.maxRootDepth = 0.75;
      params.maxRootSpread = 0.8;
      params.rootCount = 8;
      params.canopyBlobCount = 44; // Compact, dense
    }

    return params;
  };

  const params = useMemo(() => getTreeParams(), [speciesName]);

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

        {/* Lighting */}
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[6, 10, 4]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-4, 3, -3]} intensity={0.4} color="#87CEEB" />

        {/* Ground */}
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[15, 15]} />
          <meshStandardMaterial color="#5a6a52" roughness={0.9} metalness={0} />
        </mesh>

        {/* Procedural Tree */}
        <TreeRenderer
          growthProgress={growthProgress}
          params={params}
          leafColor={leafColor}
          trunkColor="#5d4e37"
          species={species}
        />

        <OrbitControls enableZoom={false} autoRotate={false} />
      </Canvas>

      {/* Growth stage label */}
      <div className="absolute top-4 left-4 rounded-full border border-white/20 bg-black/50 px-4 py-2 backdrop-blur">
        <div className="text-xs font-semibold text-emerald-300">
          {(growthProgress * 100).toFixed(0)}% Growth
        </div>
      </div>
    </div>
  );
}

/**
 * Sapling Geometry Component
 * Young plant with thin stem and 2-4 large simple leaves
 * Reference: Young plant sprout visualization
 */
function SaplingGeometry({
  leafColor,
  opacity,
}: {
  leafColor: string;
  opacity: number;
}) {
  return (
    <group>
      {/* Thin green stem */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.6, 8]} />
        <meshStandardMaterial
          color="#4a7c2f"
          roughness={0.7}
          metalness={0}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Simple large leaves - 4 leaves arranged around stem */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2;
        const x = Math.cos(angle) * 0.15;
        const z = Math.sin(angle) * 0.15;
        const leafRotX = Math.PI / 3; // Angle leaves downward slightly

        return (
          <mesh
            key={`sapling-leaf-${i}`}
            position={[x, 0.55, z]}
            rotation={[leafRotX, angle, 0]}
            castShadow
          >
            {/* Ellipsoid leaf shape */}
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshStandardMaterial
              color={leafColor}
              roughness={0.65}
              metalness={0}
              transparent
              opacity={opacity * 0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Small roots at base */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2;
        const x = Math.cos(angle) * 0.08;
        const z = Math.sin(angle) * 0.08;

        return (
          <mesh
            key={`sapling-root-${i}`}
            position={[x, 0.05, z]}
            rotation={[Math.PI / 4, angle, 0]}
          >
            <cylinderGeometry args={[0.02, 0.03, 0.1, 6]} />
            <meshStandardMaterial
              color="#6b4423"
              roughness={0.8}
              metalness={0}
              transparent
              opacity={opacity * 0.7}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Main tree renderer component with sapling morphing logic
 */
function TreeRenderer({
  growthProgress,
  params,
  leafColor,
  trunkColor,
  species,
}: {
  growthProgress: number;
  params: any;
  leafColor: string;
  trunkColor: string;
  species: TreeSpecies;
}) {
  // Morphing logic: 0-15% sapling, 15-25% crossover, 25%+ main tree
  const saplingPhase = growthProgress < 0.15;
  const crossoverPhase = growthProgress >= 0.15 && growthProgress < 0.25;
  const mainTreePhase = growthProgress >= 0.25;

  // Sapling scales from 0 to 1 during 0-15%
  const saplingScale = saplingPhase ? (growthProgress / 0.15) : (1 - (growthProgress - 0.15) / 0.1);
  const saplingOpacity = Math.max(0, Math.min(1, saplingScale));

  // Main tree scales in during 15-25%
  const mainTreeScale = mainTreePhase ? 1 : Math.max(0, (growthProgress - 0.15) / 0.1);
  const mainTreeOpacity = Math.min(1, (growthProgress - 0.15) / 0.1);

  return (
    <group position={[0, 0, 0]}>
      {/* Sapling phase (0-25%) */}
      {growthProgress < 0.25 && (
        <group scale={saplingScale} position={[0, 0, 0]}>
          <SaplingGeometry leafColor={leafColor} opacity={saplingOpacity} />
        </group>
      )}

      {/* Main tree phase (15%+) */}
      {growthProgress >= 0.15 && (
        <group scale={mainTreeScale} position={[0, 0, 0]}>
          {/* Root system */}
          <ProceduralRootSystem
            growthProgress={mainTreeScale}
            rootCount={params.rootCount}
            maxDepth={params.maxRootDepth}
            maxSpread={params.maxRootSpread}
          />

          {/* Trunk */}
          <ProceduralTrunk
            growthProgress={mainTreeScale}
            maxHeight={params.maxTrunkHeight}
            maxRadius={params.maxTrunkRadius}
            color={trunkColor}
          />

          {/* Branches */}
          {mainTreeScale > 0.15 && (
            <ProceduralBranches
              growthProgress={mainTreeScale}
              trunkHeight={params.maxTrunkHeight * mainTreeScale}
              maxRadius={params.maxTrunkRadius}
              color={trunkColor}
            />
          )}

          {/* Canopy cloud - high density */}
          {mainTreeScale > 0.2 && (
            <CanopyCluster
              growthProgress={mainTreeScale}
              centerY={params.maxTrunkHeight * mainTreeScale + 0.1}
              canopyRadius={params.canopyRadius}
              blobCount={params.canopyBlobCount}
              leafColor={leafColor}
            />
          )}
        </group>
      )}
    </group>
  );
}

/**
 * Procedural Root System
 * Uses CatmullRomCurve3 to create organic, tapering roots
 */
function ProceduralRootSystem({
  growthProgress,
  rootCount,
  maxDepth,
  maxSpread,
}: {
  growthProgress: number;
  rootCount: number;
  maxDepth: number;
  maxSpread: number;
}) {
  const rootGeometries = useMemo(() => {
    const geometries: {
      curve: THREE.TubeGeometry;
      position: THREE.Vector3;
    }[] = [];

    // Central taproot
    if (growthProgress > 0) {
      const taprootDepth = maxDepth * growthProgress;
      const taprootCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.02, -taprootDepth * 0.3, 0),
        new THREE.Vector3(-0.01, -taprootDepth * 0.6, 0),
        new THREE.Vector3(0, -taprootDepth, 0),
      ]);

      const taprootGeometry = new THREE.TubeGeometry(
        taprootCurve,
        16,
        0.08 * growthProgress,
        8,
        false
      );

      geometries.push({
        curve: taprootGeometry,
        position: new THREE.Vector3(0, 0, 0),
      });
    }

    // Lateral roots - radial distribution
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI * 2;
      const lateralSpread = maxSpread * growthProgress;
      const lateralDepth = maxDepth * growthProgress * 0.7;

      // Create curved root path
      const startX = 0;
      const endX = Math.cos(angle) * lateralSpread;
      const endZ = Math.sin(angle) * lateralSpread;

      const rootCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          startX + (endX - startX) * 0.3,
          -lateralDepth * 0.2,
          0 + (endZ - 0) * 0.3
        ),
        new THREE.Vector3(
          startX + (endX - startX) * 0.7,
          -lateralDepth * 0.5,
          0 + (endZ - 0) * 0.7
        ),
        new THREE.Vector3(endX, -lateralDepth, endZ),
      ]);

      const rootRadius = 0.06 * growthProgress * (0.8 + Math.random() * 0.2);
      const rootGeometry = new THREE.TubeGeometry(
        rootCurve,
        14,
        rootRadius * 1.2,
        8,
        false
      );

      geometries.push({
        curve: rootGeometry,
        position: new THREE.Vector3(0, 0, 0),
      });

      // Secondary rootlets (appear later)
      if (growthProgress > 0.4) {
        const subAngle = angle + 0.4;
        const subDepth = lateralDepth * 0.5;
        const subSpread = lateralSpread * 0.6;

        const subCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(
            Math.cos(angle) * lateralSpread * 0.5,
            -lateralDepth * 0.3,
            Math.sin(angle) * lateralSpread * 0.5
          ),
          new THREE.Vector3(
            Math.cos(subAngle) * subSpread * 0.7,
            -subDepth * 0.6,
            Math.sin(subAngle) * subSpread * 0.7
          ),
          new THREE.Vector3(
            Math.cos(subAngle) * subSpread,
            -subDepth,
            Math.sin(subAngle) * subSpread
          ),
        ]);

        const subGeometry = new THREE.TubeGeometry(
          subCurve,
          10,
          rootRadius * 0.5,
          6,
          false
        );

        geometries.push({
          curve: subGeometry,
          position: new THREE.Vector3(0, 0, 0),
        });
      }
    }

    return geometries;
  }, [growthProgress, rootCount, maxDepth, maxSpread]);

  return (
    <group>
      {rootGeometries.map((root, idx) => (
        <mesh key={`root-${idx}`} geometry={root.curve} position={root.position} castShadow>
          <meshStandardMaterial
            color={idx === 0 ? "#6b4423" : "#7a5230"}
            roughness={0.85}
            metalness={0}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Procedural Trunk with tapering
 */
function ProceduralTrunk({
  growthProgress,
  maxHeight,
  maxRadius,
  color,
}: {
  growthProgress: number;
  maxHeight: number;
  maxRadius: number;
  color: string;
}) {
  const geometry = useMemo(() => {
    const trunkHeight = maxHeight * growthProgress;
    const radiusBase = maxRadius * growthProgress;
    const radiusTop = radiusBase * 0.5; // Taper to 50% of base

    // Create slight curve in trunk
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, trunkHeight * 0.3, -0.02),
      new THREE.Vector3(0.02, trunkHeight * 0.6, 0.05),
      new THREE.Vector3(-0.03, trunkHeight * 0.9, -0.01),
      new THREE.Vector3(0, trunkHeight, 0),
    ]);

    const geo = new THREE.TubeGeometry(trunkCurve, 20, radiusBase, 12, false);
    return geo;
  }, [growthProgress, maxHeight, maxRadius]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
    </mesh>
  );
}

/**
 * Procedural Branches
 * Smaller cylinders extending from trunk to support canopy
 */
function ProceduralBranches({
  growthProgress,
  trunkHeight,
  maxRadius,
  color,
}: {
  growthProgress: number;
  trunkHeight: number;
  maxRadius: number;
  color: string;
}) {
  const branchCount = Math.ceil(2 + growthProgress * 2); // 2-4 branches

  const branches = useMemo(() => {
    const branchList: {
      geometry: THREE.TubeGeometry;
      position: [number, number, number];
    }[] = [];

    for (let i = 0; i < branchCount; i++) {
      const angle = (i / branchCount) * Math.PI * 2;
      const startHeight = trunkHeight * (0.5 + Math.random() * 0.3);
      const branchLength = 0.3 * growthProgress;
      const endX = Math.cos(angle) * branchLength;
      const endZ = Math.sin(angle) * branchLength;

      const branchCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(endX * 0.4, 0.1, endZ * 0.4),
        new THREE.Vector3(endX * 0.7, 0.15, endZ * 0.7),
        new THREE.Vector3(endX, 0.2, endZ),
      ]);

      const branchRadius = maxRadius * 0.4 * growthProgress;
      const geometry = new THREE.TubeGeometry(
        branchCurve,
        12,
        branchRadius,
        6,
        false
      );

      branchList.push({
        geometry,
        position: [0, startHeight, 0],
      });
    }

    return branchList;
  }, [growthProgress, trunkHeight, maxRadius, branchCount]);

  return (
    <group>
      {branches.map((branch, idx) => (
        <mesh
          key={`branch-${idx}`}
          geometry={branch.geometry}
          position={branch.position}
          castShadow
        >
          <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Canopy Cluster - Dense cloud of leaf blobs with tight clustering
 * 40-50 icosahedrons with scale variation for a full, lush appearance
 */
function CanopyCluster({
  growthProgress,
  centerY,
  canopyRadius,
  blobCount,
  leafColor,
}: {
  growthProgress: number;
  centerY: number;
  canopyRadius: number;
  blobCount: number;
  leafColor: string;
}) {
  const blobs = useMemo(() => {
    const blobList: {
      position: [number, number, number];
      size: number;
      delay: number;
    }[] = [];

    // Golden sphere distribution - tighter clustering for density
    for (let i = 0; i < blobCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / blobCount);
      const theta = Math.sqrt(Math.PI * blobCount) * phi;

      // Tighter spread: reduce noise variance and use smaller radius multiplier
      const noise = 0.7 + Math.random() * 0.25; // 0.7-0.95 instead of 0.15-0.25
      const x = Math.cos(theta) * Math.sin(phi) * canopyRadius * noise;
      const y = Math.cos(phi) * canopyRadius * 0.6 * noise;
      const z = Math.sin(theta) * Math.sin(phi) * canopyRadius * noise;

      // Scale variation: 0.5 to 1.2 to fill gaps and create visual density
      const size = 0.15 + Math.random() * 0.2; // 0.15-0.35 range
      const delay = (i / blobCount) * 0.3; // Stagger animation

      blobList.push({
        position: [x, centerY + y, z],
        size,
        delay,
      });
    }

    // Add extra small blobs in gaps for even denser appearance
    const extraBlobCount = Math.floor(blobCount * 0.3);
    for (let i = 0; i < extraBlobCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI;
      const radius = canopyRadius * (0.5 + Math.random() * 0.4);

      const x = Math.cos(angle) * Math.sin(elevation) * radius;
      const y = Math.cos(elevation) * radius * 0.5;
      const z = Math.sin(angle) * Math.sin(elevation) * radius;

      const size = 0.08 + Math.random() * 0.12; // Smaller filler blobs
      const delay = Math.random() * 0.3;

      blobList.push({
        position: [x, centerY + y, z],
        size,
        delay,
      });
    }

    return blobList;
  }, [blobCount, canopyRadius, centerY]);

  return (
    <group>
      {blobs.map((blob, idx) => (
        <CanopyBlob
          key={`blob-${idx}`}
          position={blob.position}
          size={blob.size}
          growthProgress={growthProgress}
          leafColor={leafColor}
          delay={blob.delay}
        />
      ))}
    </group>
  );
}

/**
 * Individual canopy blob with scale animation
 */
function CanopyBlob({
  position,
  size,
  growthProgress,
  leafColor,
  delay,
}: {
  position: [number, number, number];
  size: number;
  growthProgress: number;
  leafColor: string;
  delay: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Scale blobs based on growth progress with stagger delay
      const adjustedProgress = Math.max(0, growthProgress - delay * 0.5);
      const blobScale = Math.min(1, adjustedProgress * 1.5);
      meshRef.current.scale.setScalar(blobScale);

      // Slight rotation for visual interest
      meshRef.current.rotation.x += 0.002;
      meshRef.current.rotation.y += 0.003;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <icosahedronGeometry args={[size, 2]} />
      <meshStandardMaterial
        color={leafColor}
        roughness={0.65}
        metalness={0}
        transparent
        opacity={0.88}
      />
    </mesh>
  );
}
