'use client';

/**
 * FallbackSvg - Safe SVG rendering without dangerouslySetInnerHTML
 * Renders a placeholder SVG when DALL-E image generation fails
 */

interface FallbackSvgProps {
  ingredients: string[];
  template: string;
}

// Brand colors
const COLORS = {
  cream: '#FAF9F7',
  mocha: '#A47864',
  coral: '#FF6F61',
  lavender: '#A78BFA',
  peach: '#E8B4A0',
};

const CIRCLE_COLORS = [COLORS.coral, COLORS.lavender, COLORS.mocha, COLORS.peach];

export function FallbackSvg({ ingredients, template }: FallbackSvgProps) {
  const displayIngredients = ingredients.slice(0, 4);
  const ingredientText = displayIngredients.join(' + ') || 'your spread';

  // Generate deterministic circle positions based on ingredient count
  const circles = displayIngredients.map((_, i) => {
    const angle = (i * 90) + 45;
    const radius = 55;
    const x = 200 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 195 + radius * Math.sin((angle * Math.PI) / 180);
    // Use deterministic size based on index instead of Math.random()
    const size = 20 + (i * 3);

    return (
      <circle
        key={i}
        cx={x}
        cy={y}
        r={size}
        fill={CIRCLE_COLORS[i]}
        opacity={0.75}
      />
    );
  });

  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background */}
      <rect width="400" height="400" fill={COLORS.cream} />

      {/* Linen texture pattern */}
      <defs>
        <pattern id="linen" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill={COLORS.cream} />
          <rect width="1" height="1" fill={COLORS.mocha} opacity={0.1} />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#linen)" opacity={0.3} />

      {/* Plate shadow */}
      <ellipse cx={205} cy={210} rx={130} ry={120} fill={COLORS.mocha} opacity={0.1} />

      {/* Main plate */}
      <ellipse cx={200} cy={200} rx={130} ry={120} fill="white" />
      <ellipse
        cx={200}
        cy={200}
        rx={130}
        ry={120}
        fill="none"
        stroke={COLORS.mocha}
        strokeWidth={2}
        opacity={0.4}
      />

      {/* Inner plate ring */}
      <ellipse
        cx={200}
        cy={200}
        rx={110}
        ry={100}
        fill="none"
        stroke={COLORS.mocha}
        strokeWidth={1}
        opacity={0.2}
      />

      {/* Ingredient circles */}
      <g>{circles}</g>

      {/* Center decoration */}
      <circle cx={200} cy={195} r={18} fill={COLORS.mocha} opacity={0.6} />
      <circle cx={200} cy={195} r={12} fill={COLORS.coral} opacity={0.5} />

      {/* Decorative dots */}
      <g fill={COLORS.coral} opacity={0.5}>
        <circle cx={280} cy={110} r={3} />
        <circle cx={115} cy={140} r={2.5} />
        <circle cx={295} cy={260} r={2} />
        <circle cx={95} cy={230} r={2.5} />
        <circle cx={310} cy={175} r={2} />
      </g>

      {/* Template name */}
      <text
        x={200}
        y={340}
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize={14}
        fill={COLORS.mocha}
        fontStyle="italic"
      >
        {template || 'Your Spread'}
      </text>

      {/* Ingredients list */}
      <text
        x={200}
        y={362}
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontSize={11}
        fill="#999"
      >
        {ingredientText}
      </text>

      {/* Tagline */}
      <text
        x={200}
        y={385}
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontSize={9}
        fill="#bbb"
        fontStyle="italic"
      >
        imagine the magic
      </text>
    </svg>
  );
}

export default FallbackSvg;
