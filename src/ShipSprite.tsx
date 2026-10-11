import { ShipType, Heading } from './types';

interface ShipSpriteProps {
  type: ShipType;
  heading: Heading;
  isPlayer: boolean;
  size?: number;
}

export default function ShipSprite({ type, heading, isPlayer, size = 24 }: ShipSpriteProps) {
  // Поворот по 6 направлениям гекса (0°, 60°, 120°, 180°, 240°, 300°)
  const rotation = heading * 60;
  
  // Цвета
  const hullColor = isPlayer ? '#3b82f6' : '#ef4444';
  const deckColor = isPlayer ? '#60a5fa' : '#f87171';
  const detailColor = isPlayer ? '#1e40af' : '#991b1b';

  // Разные формы для разных типов кораблей
  const renderShip = () => {
    switch (type) {
      case 'battleship':
        // Линкор - большой, с тремя башнями
        return (
          <g>
            {/* Корпус */}
            <path
              d={`M 0,${-size * 0.9} 
                  L ${size * 0.25},${-size * 0.6}
                  L ${size * 0.3},${-size * 0.2}
                  L ${size * 0.3},${size * 0.6}
                  L ${size * 0.2},${size * 0.85}
                  L 0,${size * 0.9}
                  L ${-size * 0.2},${size * 0.85}
                  L ${-size * 0.3},${size * 0.6}
                  L ${-size * 0.3},${-size * 0.2}
                  L ${-size * 0.25},${-size * 0.6}
                  Z`}
              fill={hullColor}
              stroke={isPlayer ? '#2563eb' : '#dc2626'}
              strokeWidth="1.5"
            />
            {/* Палуба */}
            <rect
              x={-size * 0.2}
              y={-size * 0.5}
              width={size * 0.4}
              height={size * 1.2}
              fill={deckColor}
              opacity="0.5"
              rx="2"
            />
            {/* Носовая башня */}
            <circle cx={0} cy={-size * 0.5} r={size * 0.12} fill={detailColor} stroke="#fff" strokeWidth="0.5" />
            {/* Средняя башня */}
            <circle cx={0} cy={-size * 0.1} r={size * 0.12} fill={detailColor} stroke="#fff" strokeWidth="0.5" />
            {/* Кормовая башня */}
            <circle cx={0} cy={size * 0.4} r={size * 0.12} fill={detailColor} stroke="#fff" strokeWidth="0.5" />
            {/* Труба */}
            <rect x={-size * 0.08} y={size * 0.1} width={size * 0.16} height={size * 0.15} fill={detailColor} />
            {/* Мостик */}
            <rect x={-size * 0.1} y={-size * 0.3} width={size * 0.2} height={size * 0.15} fill={detailColor} opacity="0.7" />
          </g>
        );

      case 'cruiser':
        // Крейсер - средний, с двумя башнями
        return (
          <g>
            {/* Корпус */}
            <path
              d={`M 0,${-size * 0.85}
                  L ${size * 0.2},${-size * 0.55}
                  L ${size * 0.25},${-size * 0.15}
                  L ${size * 0.25},${size * 0.5}
                  L ${size * 0.15},${size * 0.8}
                  L 0,${size * 0.85}
                  L ${-size * 0.15},${size * 0.8}
                  L ${-size * 0.25},${size * 0.5}
                  L ${-size * 0.25},${-size * 0.15}
                  L ${-size * 0.2},${-size * 0.55}
                  Z`}
              fill={hullColor}
              stroke={isPlayer ? '#2563eb' : '#dc2626'}
              strokeWidth="1.5"
            />
            {/* Палуба */}
            <rect
              x={-size * 0.15}
              y={-size * 0.45}
              width={size * 0.3}
              height={size * 1.1}
              fill={deckColor}
              opacity="0.5"
              rx="2"
            />
            {/* Носовая башня */}
            <circle cx={0} cy={-size * 0.4} r={size * 0.1} fill={detailColor} stroke="#fff" strokeWidth="0.5" />
            {/* Кормовая башня */}
            <circle cx={0} cy={size * 0.35} r={size * 0.1} fill={detailColor} stroke="#fff" strokeWidth="0.5" />
            {/* Труба */}
            <rect x={-size * 0.06} y={0} width={size * 0.12} height={size * 0.12} fill={detailColor} />
            {/* Мостик */}
            <rect x={-size * 0.08} y={-size * 0.2} width={size * 0.16} height={size * 0.12} fill={detailColor} opacity="0.7" />
          </g>
        );

      case 'destroyer':
        // Эсминец - маленький, быстрый, с одной башней
        return (
          <g>
            {/* Корпус */}
            <path
              d={`M 0,${-size * 0.8}
                  L ${size * 0.15},${-size * 0.5}
                  L ${size * 0.18},${-size * 0.1}
                  L ${size * 0.18},${size * 0.45}
                  L ${size * 0.12},${size * 0.75}
                  L 0,${size * 0.8}
                  L ${-size * 0.12},${size * 0.75}
                  L ${-size * 0.18},${size * 0.45}
                  L ${-size * 0.18},${-size * 0.1}
                  L ${-size * 0.15},${-size * 0.5}
                  Z`}
              fill={hullColor}
              stroke={isPlayer ? '#2563eb' : '#dc2626'}
              strokeWidth="1.5"
            />
            {/* Палуба */}
            <rect
              x={-size * 0.1}
              y={-size * 0.4}
              width={size * 0.2}
              height={size * 0.95}
              fill={deckColor}
              opacity="0.5"
              rx="1.5"
            />
            {/* Носовая башня */}
            <circle cx={0} cy={-size * 0.35} r={size * 0.08} fill={detailColor} stroke="#fff" strokeWidth="0.5" />
            {/* Труба */}
            <rect x={-size * 0.05} y={-size * 0.05} width={size * 0.1} height={size * 0.1} fill={detailColor} />
            {/* Мостик */}
            <rect x={-size * 0.06} y={-size * 0.2} width={size * 0.12} height={size * 0.1} fill={detailColor} opacity="0.7" />
            {/* Торпедные аппараты */}
            <rect x={size * 0.08} y={size * 0.15} width={size * 0.08} height={size * 0.04} fill={detailColor} />
            <rect x={-size * 0.16} y={size * 0.15} width={size * 0.08} height={size * 0.04} fill={detailColor} />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <g transform={`rotate(${rotation})`}>
      {renderShip()}
    </g>
  );
}
