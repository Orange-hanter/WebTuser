import { FC, useEffect, useState, useMemo, useRef } from 'react';
import eventApi from '@/services/eventApi';
import { CategoryStats } from '@/types';
import { LoadingSpinner } from '@components/common';
import './EventByCategory.css';

interface EventByCategoryProps {
  onCategorySelect: (category: string) => void;
  isActive: boolean;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
];

export const EventByCategory: FC<EventByCategoryProps> = ({ onCategorySelect, isActive }) => {
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });

  useEffect(() => {
    if (isActive) {
      loadStats();
    }
  }, [isActive]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // Ensure we have some dimension to work with
        if (clientWidth > 0 && clientHeight > 0) {
          const size = Math.min(clientWidth, clientHeight);
          setDimensions({ width: size, height: size });
        }
      }
    };

    // Initial update
    updateDimensions();

    // Use ResizeObserver for robust updates
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getCategoryStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load category stats', err);
      setError('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  };

  const maxCount = useMemo(() => {
    return Math.max(...stats.map(s => s.count), 1);
  }, [stats]);

  const renderRadar = () => {
    const size = Math.min(dimensions.width, dimensions.height);
    const center = size / 2;
    const radius = (size / 2) - 40; // Padding for labels
    const angleStep = (Math.PI * 2) / stats.length;

    return (
      <svg 
        width={size} 
        height={size} 
        className="radar-chart-svg"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background Circles */}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle
            key={scale}
            cx={center}
            cy={center}
            r={radius * scale}
            className="radar-grid-circle"
          />
        ))}

        {/* Petals */}
        {stats.map((stat, i) => {
          const startAngle = i * angleStep - Math.PI / 2;
          const endAngle = (i + 1) * angleStep - Math.PI / 2;
          
          // Polar Area Chart Logic
          // We draw an arc segment
          const r = (stat.count / maxCount) * radius;
          
          // Points for the arc
          const x1 = center + r * Math.cos(startAngle);
          const y1 = center + r * Math.sin(startAngle);
          const x2 = center + r * Math.cos(endAngle);
          const y2 = center + r * Math.sin(endAngle);

          // Path command
          // M center,center L x1,y1 A r,r 0 0,1 x2,y2 Z
          const pathData = `
            M ${center},${center}
            L ${x1},${y1}
            A ${r},${r} 0 0,1 ${x2},${y2}
            Z
          `;

          // Label position (at the edge of the max radius for this sector)
          const labelAngle = startAngle + angleStep / 2;
          const labelR = radius + 20;
          const labelX = center + labelR * Math.cos(labelAngle);
          const labelY = center + labelR * Math.sin(labelAngle);

          return (
            <g key={stat.type} onClick={() => onCategorySelect(stat.type)}>
              <path
                d={pathData}
                className="radar-petal"
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.6}
                stroke={COLORS[i % COLORS.length]}
                role="button"
                aria-label={`${stat.label}, ${stat.count} участников`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onCategorySelect(stat.type);
                  }
                }}
              />
              <text
                x={labelX}
                y={labelY}
                className="radar-label"
                textAnchor="middle"
              >
                {stat.label}
              </text>
              <text
                x={labelX}
                y={labelY + 12}
                className="radar-count"
                textAnchor="middle"
              >
                {stat.count}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  if (loading && stats.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Mobile fallback check could be here, but we'll rely on responsive SVG for now
  // If screen is too small, we could switch to list
  const isTooSmall = dimensions.width < 300;

  if (isTooSmall) {
    return (
      <div className="category-list-fallback">
        {stats.map((stat) => (
          <div 
            key={stat.type} 
            className="category-list-item"
            onClick={() => onCategorySelect(stat.type)}
          >
            <span className="category-name">{stat.label}</span>
            <span className="category-count">{stat.count}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="category-radar-container" ref={containerRef}>
      {renderRadar()}
    </div>
  );
};

export default EventByCategory;
