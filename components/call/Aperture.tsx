export interface ApertureProps {
  size?: number;
  blades?: number;
  open?: number;
  color?: string;
}

export default function Aperture({ size = 96, blades = 7, open = 1, color = "var(--accent)" }: ApertureProps) {
  const radius = size / 2;
  const bladeLength = radius * 0.94;
  const items = Array.from({ length: blades });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle cx={radius} cy={radius} r={radius - 1} fill="none" stroke="var(--line)" strokeWidth="1" />
      <g style={{ transformOrigin: `${radius}px ${radius}px` }}>
        {items.map((_, i) => {
          const angle = (360 / blades) * i;
          return (
            <path
              key={i}
              d={`M ${radius} ${radius} L ${radius} ${radius - bladeLength} A ${bladeLength} ${bladeLength} 0 0 1 ${
                radius + bladeLength * Math.sin((2 * Math.PI) / blades)
              } ${radius - bladeLength * Math.cos((2 * Math.PI) / blades)} Z`}
              fill={color}
              opacity={0.14 + (i % 2) * 0.08}
              transform={`rotate(${angle} ${radius} ${radius})`}
            />
          );
        })}
      </g>
      <circle cx={radius} cy={radius} r={radius * open * 0.34} fill={color} opacity={0.9} />
    </svg>
  );
}
