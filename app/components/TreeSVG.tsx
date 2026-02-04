"use client";

interface TreeSVGProps {
  speciesName: string;
  yearProgress: number;
  maturityYears: number;
  healthScore: number;
}

export function TreeSVG({ speciesName, yearProgress, maturityYears, healthScore }: TreeSVGProps) {
  const progress = Math.min(1, yearProgress / maturityYears);
  const opacity = 0.3 + progress * 0.7;
  const leafColor = healthScore > 0.6 ? "#22c55e" : healthScore > 0.3 ? "#eab308" : "#fb923c";

  // Species-specific rendering
  if (speciesName === "Banyan") {
    return <BanyanTree progress={progress} opacity={opacity} leafColor={leafColor} />;
  } else if (speciesName === "Neem") {
    return <NeemTree progress={progress} opacity={opacity} leafColor={leafColor} />;
  } else if (speciesName === "Peepal") {
    return <PeepalTree progress={progress} opacity={opacity} leafColor={leafColor} />;
  } else if (speciesName === "Teak") {
    return <TeakTree progress={progress} opacity={opacity} leafColor={leafColor} />;
  } else if (speciesName === "Sal") {
    return <SalTree progress={progress} opacity={opacity} leafColor={leafColor} />;
  }

  // Default generic tree
  return <GenericTree progress={progress} opacity={opacity} leafColor={leafColor} />;
}

function BanyanTree({
  progress,
  opacity,
  leafColor,
}: {
  progress: number;
  opacity: number;
  leafColor: string;
}) {
  const trunkHeight = 80 + progress * 180;
  const canopyRadius = 50 + progress * 120;
  const rootCount = Math.floor(progress * 8); // Aerial roots appear

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 500" className="transition-all duration-700">
      {/* Ground */}
      <ellipse cx="200" cy="480" rx="80" ry="15" fill="#8b7355" opacity="0.3" />

      {/* Main trunk */}
      <rect
        x={200 - 20 - progress * 8}
        y={480 - trunkHeight}
        width={40 + progress * 16}
        height={trunkHeight}
        fill="#654321"
        rx="8"
        opacity={opacity}
        className="transition-all duration-700"
      />

      {/* Main canopy - wide and dense */}
      <ellipse
        cx="200"
        cy={480 - trunkHeight - 30}
        rx={canopyRadius * 1.1}
        ry={canopyRadius * 0.9}
        fill={leafColor}
        opacity={opacity * 0.9}
        className="transition-all duration-700"
      />

      {/* Secondary canopy lobes */}
      {progress > 0.3 && (
        <>
          <ellipse
            cx={200 - canopyRadius * 0.6}
            cy={480 - trunkHeight - 50}
            rx={canopyRadius * 0.7}
            ry={canopyRadius * 0.6}
            fill={leafColor}
            opacity={opacity * 0.7}
            className="transition-all duration-700"
          />
          <ellipse
            cx={200 + canopyRadius * 0.6}
            cy={480 - trunkHeight - 50}
            rx={canopyRadius * 0.7}
            ry={canopyRadius * 0.6}
            fill={leafColor}
            opacity={opacity * 0.7}
            className="transition-all duration-700"
          />
        </>
      )}

      {/* Aerial roots (appear in later stages) */}
      {progress > 0.5 && (
        <>
          {[...Array(rootCount)].map((_, i) => (
            <line
              key={`root-${i}`}
              x1={200 + Math.cos((i / rootCount) * Math.PI * 2) * canopyRadius * 0.8}
              y1={480 - trunkHeight - 30 + Math.sin((i / rootCount) * Math.PI * 2) * canopyRadius * 0.6}
              x2={200 + Math.cos((i / rootCount) * Math.PI * 2) * canopyRadius * 0.4}
              y2="450"
              stroke="#8b6f47"
              strokeWidth="2"
              opacity={opacity * (progress - 0.5) * 2}
              className="transition-all duration-700"
            />
          ))}
        </>
      )}

      <text x="200" y="30" textAnchor="middle" fontSize="14" fill="#22c55e" fontWeight="bold">
        Banyan
      </text>
    </svg>
  );
}

function NeemTree({
  progress,
  opacity,
  leafColor,
}: {
  progress: number;
  opacity: number;
  leafColor: string;
}) {
  const trunkHeight = 100 + progress * 160;
  const canopyHeight = 80 + progress * 100;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 500" className="transition-all duration-700">
      {/* Ground */}
      <ellipse cx="200" cy="480" rx="70" ry="15" fill="#8b7355" opacity="0.3" />

      {/* Trunk */}
      <rect
        x={200 - 15 - progress * 5}
        y={480 - trunkHeight}
        width={30 + progress * 10}
        height={trunkHeight}
        fill="#7a5230"
        rx="6"
        opacity={opacity}
        className="transition-all duration-700"
      />

      {/* Dense oval canopy - characteristic of Neem */}
      <ellipse
        cx="200"
        cy={480 - trunkHeight - 20}
        rx={45 + progress * 80}
        ry={canopyHeight * 0.7}
        fill={leafColor}
        opacity={opacity * 0.85}
        className="transition-all duration-700"
      />

      {/* Leaf texture circles */}
      {progress > 0.2 && (
        <>
          {[...Array(Math.floor(progress * 12))].map((_, i) => (
            <circle
              key={`leaf-${i}`}
              cx={200 + Math.random() * 100 - 50}
              cy={480 - trunkHeight - 30 + Math.random() * 60 - 30}
              r={5 + progress * 5}
              fill={leafColor}
              opacity={opacity * 0.3}
              className="transition-all duration-700"
            />
          ))}
        </>
      )}

      <text x="200" y="30" textAnchor="middle" fontSize="14" fill="#22c55e" fontWeight="bold">
        Neem
      </text>
    </svg>
  );
}

function PeepalTree({
  progress,
  opacity,
  leafColor,
}: {
  progress: number;
  opacity: number;
  leafColor: string;
}) {
  const trunkHeight = 90 + progress * 170;
  const canopyRadius = 60 + progress * 100;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 500" className="transition-all duration-700">
      {/* Ground */}
      <ellipse cx="200" cy="480" rx="75" ry="15" fill="#8b7355" opacity="0.3" />

      {/* Trunk */}
      <path
        d={`M ${200 - 18} ${480} Q ${200 - 22} ${480 - trunkHeight * 0.5} ${200 - 16} ${480 - trunkHeight} L ${200 + 16} ${480 - trunkHeight} Q ${200 + 22} ${480 - trunkHeight * 0.5} ${200 + 18} ${480}`}
        fill="#8b6f47"
        opacity={opacity}
        className="transition-all duration-700"
      />

      {/* Heart-shaped canopy (Peepal characteristic) */}
      <path
        d={`M 200 ${480 - trunkHeight - canopyRadius * 0.3}
           C ${200 - canopyRadius * 0.7} ${480 - trunkHeight - canopyRadius * 0.8}
             ${200 - canopyRadius * 0.6} ${480 - trunkHeight - canopyRadius * 1.2}
             200 ${480 - trunkHeight - canopyRadius * 1.4}
           C ${200 + canopyRadius * 0.6} ${480 - trunkHeight - canopyRadius * 1.2}
             ${200 + canopyRadius * 0.7} ${480 - trunkHeight - canopyRadius * 0.8}
             200 ${480 - trunkHeight - canopyRadius * 0.3}`}
        fill={leafColor}
        opacity={opacity * 0.85}
        className="transition-all duration-700"
      />

      {/* Sacred aspect - radiant glow */}
      {progress > 0.6 && (
        <circle
          cx="200"
          cy={480 - trunkHeight - canopyRadius * 0.5}
          r={canopyRadius * 1.2}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1"
          opacity={opacity * 0.4 * (progress - 0.6) * 2.5}
          className="transition-all duration-700"
        />
      )}

      <text x="200" y="30" textAnchor="middle" fontSize="14" fill="#22c55e" fontWeight="bold">
        Peepal
      </text>
    </svg>
  );
}

function TeakTree({
  progress,
  opacity,
  leafColor,
}: {
  progress: number;
  opacity: number;
  leafColor: string;
}) {
  const trunkHeight = 110 + progress * 150;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 500" className="transition-all duration-700">
      <ellipse cx="200" cy="480" rx="80" ry="15" fill="#8b7355" opacity="0.3" />

      {/* Thick trunk - Teak is hardwood */}
      <rect
        x={200 - 22 - progress * 6}
        y={480 - trunkHeight}
        width={44 + progress * 12}
        height={trunkHeight}
        fill="#5a4033"
        rx="8"
        opacity={opacity}
        className="transition-all duration-700"
      />

      {/* Pyramidal canopy */}
      <polygon
        points={`200,${480 - trunkHeight - 80 - progress * 80} 
                 ${200 - 45 - progress * 60},${480 - trunkHeight + 20 - progress * 50}
                 ${200 + 45 + progress * 60},${480 - trunkHeight + 20 - progress * 50}`}
        fill={leafColor}
        opacity={opacity * 0.85}
        className="transition-all duration-700"
      />

      <text x="200" y="30" textAnchor="middle" fontSize="14" fill="#22c55e" fontWeight="bold">
        Teak
      </text>
    </svg>
  );
}

function SalTree({
  progress,
  opacity,
  leafColor,
}: {
  progress: number;
  opacity: number;
  leafColor: string;
}) {
  const trunkHeight = 100 + progress * 160;
  const canopyRadius = 40 + progress * 90;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 500" className="transition-all duration-700">
      <ellipse cx="200" cy="480" rx="70" ry="15" fill="#8b7355" opacity="0.3" />

      {/* Trunk */}
      <rect
        x={200 - 18 - progress * 6}
        y={480 - trunkHeight}
        width={36 + progress * 12}
        height={trunkHeight}
        fill="#6b4423"
        rx="7"
        opacity={opacity}
        className="transition-all duration-700"
      />

      {/* Compact, rounded canopy */}
      <circle
        cx="200"
        cy={480 - trunkHeight - 30}
        r={canopyRadius}
        fill={leafColor}
        opacity={opacity * 0.85}
        className="transition-all duration-700"
      />

      <text x="200" y="30" textAnchor="middle" fontSize="14" fill="#22c55e" fontWeight="bold">
        Sal
      </text>
    </svg>
  );
}

function GenericTree({
  progress,
  opacity,
  leafColor,
}: {
  progress: number;
  opacity: number;
  leafColor: string;
}) {
  const trunkHeight = 100 + progress * 160;
  const canopyRadius = 50 + progress * 100;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 500" className="transition-all duration-700">
      <ellipse cx="200" cy="480" rx="75" ry="15" fill="#8b7355" opacity="0.3" />

      <rect
        x={200 - 18 - progress * 6}
        y={480 - trunkHeight}
        width={36 + progress * 12}
        height={trunkHeight}
        fill="#7a5230"
        rx="7"
        opacity={opacity}
        className="transition-all duration-700"
      />

      <circle
        cx="200"
        cy={480 - trunkHeight - 30}
        r={canopyRadius}
        fill={leafColor}
        opacity={opacity * 0.85}
        className="transition-all duration-700"
      />

      <text x="200" y="30" textAnchor="middle" fontSize="14" fill="#22c55e" fontWeight="bold">
        Tree
      </text>
    </svg>
  );
}
