import { FC, useEffect, useState, useCallback } from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  Flame,
  Zap,
  Sun,
  CloudRain,
  Filter,
  X
} from 'lucide-react';
import eventApi from '@/services/eventApi';
import { CategoryStats } from '@/types';
import { LoadingSpinner } from '@components/common';
import './CityOverview.css';

// Types for city overview
interface CityOverviewData {
  city: string;
  totalEvents: number;
  totalActiveUsers: number;
  eventsThisWeek: number;
  eventsThisWeekend: number;
  trends: TrendItem[];
  highlights: HighlightEvent[];
  weather?: WeatherInfo;
}

interface TrendItem {
  type: 'rising' | 'hot' | 'new';
  label: string;
  growth: number;
  description: string;
}

interface HighlightEvent {
  id: string;
  title: string;
  date: string;
  attendees: number;
  image: string;
  type: string;
}

interface WeatherInfo {
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy';
  recommendation: string;
}

interface TagNode {
  id: string;
  label: string;
  icon?: string;
  count: number;
  children?: TagNode[];
}

interface HappeningNowEvent {
  id: string;
  title: string;
  startsIn: number;
  location: string;
  spotsLeft: number;
  type: string;
}

interface CityOverviewProps {
  onCategorySelect: (category: string) => void;
  onEventClick?: (eventId: string) => void;
  isActive: boolean;
}

// Mock data generators (will be replaced by API calls)
const getMockCityOverview = (): CityOverviewData => ({
  city: 'Брест',
  totalEvents: 1250,
  totalActiveUsers: 45000,
  eventsThisWeek: 342,
  eventsThisWeekend: 128,
  trends: [
    { type: 'rising', label: 'Стендап', growth: 45, description: '+45% за неделю' },
    { type: 'hot', label: 'Открытые лекции', growth: 30, description: 'Популярно сейчас' },
    { type: 'new', label: 'Арт-вечера', growth: 0, description: 'Новый тренд' },
  ],
  highlights: [
    { id: '1', title: 'Фестиваль уличной еды', date: '30 ноября', attendees: 2500, image: '', type: 'food' },
    { id: '2', title: 'Ночь музеев', date: '1 декабря', attendees: 5000, image: '', type: 'art' },
  ],
  weather: {
    temp: 5,
    condition: 'cloudy',
    recommendation: 'Отличный день для закрытых мероприятий'
  }
});

const getMockTagTree = (): TagNode[] => [
  {
    id: 'music',
    label: 'Музыка',
    icon: '🎵',
    count: 245,
    children: [
      { id: 'music-live', label: 'Живая музыка', icon: '🎸', count: 120, children: [
        { id: 'music-live-rock', label: 'Рок', count: 45 },
        { id: 'music-live-jazz', label: 'Джаз', count: 32 },
        { id: 'music-live-classical', label: 'Классика', count: 28 },
      ]},
      { id: 'music-dj', label: 'DJ сеты', count: 85, children: [
        { id: 'music-dj-techno', label: 'Техно', count: 40 },
        { id: 'music-dj-house', label: 'Хаус', count: 30 },
      ]},
      { id: 'music-karaoke', label: 'Караоке', count: 40 },
    ]
  },
  {
    id: 'sport',
    label: 'Спорт',
    icon: '⚽',
    count: 180,
    children: [
      { id: 'sport-football', label: 'Футбол', count: 45 },
      { id: 'sport-basketball', label: 'Баскетбол', count: 30 },
      { id: 'sport-yoga', label: 'Йога', count: 60 },
      { id: 'sport-run', label: 'Бег', count: 25 },
    ]
  },
  {
    id: 'education',
    label: 'Образование',
    icon: '📚',
    count: 320,
    children: [
      { id: 'edu-lectures', label: 'Лекции', count: 150 },
      { id: 'edu-masterclass', label: 'Мастер-классы', count: 100 },
      { id: 'edu-courses', label: 'Курсы', count: 70 },
    ]
  },
  {
    id: 'art',
    label: 'Искусство',
    icon: '🎨',
    count: 210,
    children: [
      { id: 'art-exhibition', label: 'Выставки', count: 80 },
      { id: 'art-theater', label: 'Театр', count: 65 },
      { id: 'art-cinema', label: 'Кино', count: 45 },
    ]
  },
  {
    id: 'social',
    label: 'Общение',
    icon: '💬',
    count: 175,
    children: [
      { id: 'social-networking', label: 'Нетворкинг', count: 60 },
      { id: 'social-party', label: 'Вечеринки', count: 80 },
      { id: 'social-dating', label: 'Знакомства', count: 35 },
    ]
  },
  {
    id: 'food',
    label: 'Еда и напитки',
    icon: '🍕',
    count: 95,
    children: [
      { id: 'food-tasting', label: 'Дегустации', count: 40 },
      { id: 'food-cooking', label: 'Кулинарные МК', count: 35 },
      { id: 'food-festival', label: 'Фуд-фестивали', count: 20 },
    ]
  },
];

const getMockHappeningNow = (): HappeningNowEvent[] => [
  { id: '1', title: 'Йога в парке', startsIn: 30, location: 'Парк Горького', spotsLeft: 5, type: 'sport' },
  { id: '2', title: 'Джазовый джем', startsIn: 45, location: 'Jazz Club', spotsLeft: 12, type: 'music' },
  { id: '3', title: 'Лекция по дизайну', startsIn: 60, location: 'Коворкинг "Точка"', spotsLeft: 8, type: 'education' },
];

const CATEGORY_COLORS: Record<string, string> = {
  music: '#9333EA',
  sport: '#EF4444',
  education: '#3B82F6',
  art: '#F59E0B',
  social: '#EC4899',
  food: '#10B981',
  entertainment: '#F97316',
  business: '#8B5CF6',
};

// Tag Tree Component
const TagTreeNode: FC<{
  node: TagNode;
  level: number;
  selectedTags: Set<string>;
  onToggle: (tagId: string) => void;
  expandedNodes: Set<string>;
  onExpand: (nodeId: string) => void;
}> = ({ node, level, selectedTags, onToggle, expandedNodes, onExpand }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedTags.has(node.id);

  return (
    <div className="tag-tree-node" style={{ '--level': level } as React.CSSProperties}>
      <div 
        className={`tag-tree-item ${isSelected ? 'selected' : ''}`}
        onClick={() => onToggle(node.id)}
      >
        {hasChildren && (
          <button 
            className="tag-expand-btn"
            onClick={(e) => { e.stopPropagation(); onExpand(node.id); }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        {!hasChildren && <span className="tag-spacer" />}
        {node.icon && <span className="tag-icon">{node.icon}</span>}
        <span className="tag-label">{node.label}</span>
        <span className="tag-count">{node.count}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className="tag-tree-children">
          {node.children!.map(child => (
            <TagTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedTags={selectedTags}
              onToggle={onToggle}
              expandedNodes={expandedNodes}
              onExpand={onExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Polar Area Chart (improved petal chart)
const PolarAreaChart: FC<{
  stats: CategoryStats[];
  onCategorySelect: (category: string) => void;
  size?: number;
}> = ({ stats, onCategorySelect, size = 280 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  if (stats.length === 0) return null;
  
  const center = size / 2;
  const maxRadius = (size / 2) - 50;
  const maxCount = Math.max(...stats.map(s => s.count), 1);
  const angleStep = (Math.PI * 2) / stats.length;
  
  const getColor = (index: number, type: string) => {
    const colors = [
      '#9333EA', '#EC4899', '#3B82F6', '#F59E0B', 
      '#10B981', '#EF4444', '#6366F1', '#F97316'
    ];
    return CATEGORY_COLORS[type] || colors[index % colors.length];
  };

  return (
    <div className="polar-chart-container">
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className="polar-chart-svg"
      >
        {/* Background grid circles */}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle
            key={scale}
            cx={center}
            cy={center}
            r={maxRadius * scale}
            className="polar-grid-circle"
          />
        ))}
        
        {/* Axis lines */}
        {stats.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x2 = center + maxRadius * Math.cos(angle);
          const y2 = center + maxRadius * Math.sin(angle);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              className="polar-axis-line"
            />
          );
        })}

        {/* Segments */}
        {stats.map((stat, i) => {
          const startAngle = i * angleStep - Math.PI / 2;
          const endAngle = (i + 1) * angleStep - Math.PI / 2;
          const r = (stat.count / maxCount) * maxRadius * 0.9 + maxRadius * 0.1;
          const isHovered = hoveredIndex === i;
          const scale = isHovered ? 1.05 : 1;
          
          // Arc path
          const x1 = center + r * Math.cos(startAngle) * scale;
          const y1 = center + r * Math.sin(startAngle) * scale;
          const x2 = center + r * Math.cos(endAngle) * scale;
          const y2 = center + r * Math.sin(endAngle) * scale;
          
          const pathData = `
            M ${center},${center}
            L ${x1},${y1}
            A ${r * scale},${r * scale} 0 0,1 ${x2},${y2}
            Z
          `;
          
          // Label position
          const labelAngle = startAngle + angleStep / 2;
          const labelR = maxRadius + 25;
          const labelX = center + labelR * Math.cos(labelAngle);
          const labelY = center + labelR * Math.sin(labelAngle);
          
          const color = getColor(i, stat.type);

          return (
            <g 
              key={stat.type}
              className="polar-segment-group"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onCategorySelect(stat.type)}
            >
              <path
                d={pathData}
                fill={color}
                fillOpacity={isHovered ? 0.9 : 0.7}
                stroke={color}
                strokeWidth={isHovered ? 3 : 2}
                className="polar-segment"
                style={{
                  filter: isHovered ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' : 'none',
                  transition: 'all 0.2s ease-out'
                }}
              />
              <text
                x={labelX}
                y={labelY}
                className="polar-label"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {stat.label}
              </text>
              {isHovered && (
                <text
                  x={labelX}
                  y={labelY + 16}
                  className="polar-count-label"
                  textAnchor="middle"
                >
                  {stat.count} событий
                </text>
              )}
            </g>
          );
        })}
        
        {/* Center circle */}
        <circle
          cx={center}
          cy={center}
          r={20}
          className="polar-center-circle"
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          className="polar-center-text"
        >
          {stats.reduce((sum, s) => sum + s.count, 0)}
        </text>
      </svg>
      
      {hoveredIndex !== null && stats[hoveredIndex] && (
        <div className="polar-tooltip">
          <span className="tooltip-label">{stats[hoveredIndex]!.label}</span>
          <span className="tooltip-count">{stats[hoveredIndex]!.count} событий</span>
        </div>
      )}
    </div>
  );
};

// Main Component
export const CityOverview: FC<CityOverviewProps> = ({ onCategorySelect, onEventClick, isActive }) => {
  const [loading, setLoading] = useState(true);
  const [cityData, setCityData] = useState<CityOverviewData | null>(null);
  const [tagTree, setTagTree] = useState<TagNode[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [happeningNow, setHappeningNow] = useState<HappeningNowEvent[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showTagFilter, setShowTagFilter] = useState(false);

  useEffect(() => {
    if (isActive) {
      loadData();
    }
  }, [isActive]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load category stats from existing API
      const stats = await eventApi.getCategoryStats();
      setCategoryStats(stats);

      // Mock data for now (will be replaced with real API calls)
      setCityData(getMockCityOverview());
      setTagTree(getMockTagTree());
      setHappeningNow(getMockHappeningNow());

      // Auto-expand first level
      setExpandedNodes(new Set(getMockTagTree().map(t => t.id)));
    } catch (err) {
      console.error('Failed to load city overview', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }, []);

  const handleNodeExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const clearFilters = () => {
    setSelectedTags(new Set());
  };

  const applyFilters = () => {
    if (selectedTags.size > 0) {
      const tagsArray = Array.from(selectedTags);
      if (tagsArray[0]) {
        onCategorySelect(tagsArray[0]);
      }
    }
    setShowTagFilter(false);
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun size={20} className="weather-icon sunny" />;
      case 'rainy': return <CloudRain size={20} className="weather-icon rainy" />;
      default: return <Sun size={20} className="weather-icon cloudy" />;
    }
  };

  const getTrendIcon = (type: string) => {
    switch (type) {
      case 'rising': return <TrendingUp size={16} className="trend-icon rising" />;
      case 'hot': return <Flame size={16} className="trend-icon hot" />;
      case 'new': return <Zap size={16} className="trend-icon new" />;
      default: return <TrendingUp size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="city-overview-container loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (!cityData) {
    return (
      <div className="city-overview-container error">
        <p>Не удалось загрузить данные</p>
      </div>
    );
  }

  return (
    <div className="city-overview-container">
      {/* Header with city name and weather */}
      <header className="city-header">
        <div className="city-title">
          <MapPin size={24} className="city-icon" />
          <h1>{cityData.city}</h1>
        </div>
        {cityData.weather && (
          <div className="weather-badge">
            {getWeatherIcon(cityData.weather.condition)}
            <span>{cityData.weather.temp}°C</span>
          </div>
        )}
      </header>

      {/* Quick stats */}
      <section className="quick-stats">
        <div className="stat-card">
          <Calendar size={20} />
          <div className="stat-content">
            <span className="stat-value">{cityData.eventsThisWeek}</span>
            <span className="stat-label">на этой неделе</span>
          </div>
        </div>
        <div className="stat-card highlight">
          <Flame size={20} />
          <div className="stat-content">
            <span className="stat-value">{cityData.eventsThisWeekend}</span>
            <span className="stat-label">на выходных</span>
          </div>
        </div>
        <div className="stat-card">
          <Users size={20} />
          <div className="stat-content">
            <span className="stat-value">{(cityData.totalActiveUsers / 1000).toFixed(0)}K</span>
            <span className="stat-label">активных</span>
          </div>
        </div>
      </section>

      {/* Happening Now Section */}
      {happeningNow.length > 0 && (
        <section className="happening-now-section">
          <h2 className="section-title">
            <Zap size={18} className="section-icon pulse" />
            Скоро начнётся
          </h2>
          <div className="happening-now-list">
            {happeningNow.map(event => (
              <div 
                key={event.id} 
                className="happening-card"
                onClick={() => onEventClick?.(event.id)}
              >
                <div className="happening-time">
                  <Clock size={14} />
                  <span>через {event.startsIn} мин</span>
                </div>
                <h3 className="happening-title">{event.title}</h3>
                <p className="happening-location">
                  <MapPin size={12} />
                  {event.location}
                </p>
                {event.spotsLeft <= 10 && (
                  <span className="spots-badge">Осталось {event.spotsLeft} мест</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trends Section */}
      <section className="trends-section">
        <h2 className="section-title">
          <TrendingUp size={18} className="section-icon" />
          Тренды
        </h2>
        <div className="trends-list">
          {cityData.trends.map((trend, i) => (
            <div 
              key={i} 
              className={`trend-chip ${trend.type}`}
              onClick={() => onCategorySelect(trend.label)}
            >
              {getTrendIcon(trend.type)}
              <span className="trend-label">{trend.label}</span>
              <span className="trend-desc">{trend.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tag Filter Toggle */}
      <section className="tag-filter-section">
        <button 
          className={`filter-toggle-btn ${showTagFilter ? 'active' : ''}`}
          onClick={() => setShowTagFilter(!showTagFilter)}
        >
          <Filter size={18} />
          <span>Фильтр по тегам</span>
          {selectedTags.size > 0 && (
            <span className="filter-count">{selectedTags.size}</span>
          )}
          <ChevronDown size={18} className={`chevron ${showTagFilter ? 'rotated' : ''}`} />
        </button>

        {showTagFilter && (
          <div className="tag-filter-panel">
            <div className="tag-tree-container">
              {tagTree.map(node => (
                <TagTreeNode
                  key={node.id}
                  node={node}
                  level={0}
                  selectedTags={selectedTags}
                  onToggle={handleTagToggle}
                  expandedNodes={expandedNodes}
                  onExpand={handleNodeExpand}
                />
              ))}
            </div>
            
            {selectedTags.size > 0 && (
              <div className="filter-actions">
                <button className="btn-clear" onClick={clearFilters}>
                  <X size={16} />
                  Сбросить
                </button>
                <button className="btn-apply" onClick={applyFilters}>
                  Показать события
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Highlight Events */}
      {cityData.highlights.length > 0 && (
        <section className="highlights-section">
          <h2 className="section-title">Главные события</h2>
          <div className="highlights-scroll">
            {cityData.highlights.map(event => (
              <div 
                key={event.id} 
                className="highlight-card"
                onClick={() => onEventClick?.(event.id)}
              >
                <div 
                  className="highlight-image"
                  style={{ 
                    backgroundColor: CATEGORY_COLORS[event.type] || '#6366F1' 
                  }}
                >
                  {event.image ? (
                    <img src={event.image} alt={event.title} />
                  ) : (
                    <span className="highlight-placeholder">{event.title[0]}</span>
                  )}
                </div>
                <div className="highlight-content">
                  <h3>{event.title}</h3>
                  <p className="highlight-date">{event.date}</p>
                  <p className="highlight-attendees">
                    <Users size={12} />
                    {event.attendees.toLocaleString()} участников
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category Chart - at the bottom */}
      <section className="category-chart-section">
        <h2 className="section-title">Распределение по категориям</h2>
        <p className="section-subtitle">Нажмите на сегмент для просмотра событий</p>
        
        <div className="chart-wrapper">
          <PolarAreaChart 
            stats={categoryStats}
            onCategorySelect={onCategorySelect}
            size={300}
          />
        </div>
        
        {/* Legend */}
        <div className="chart-legend">
          {categoryStats.map((stat, i) => (
            <div 
              key={stat.type} 
              className="legend-item"
              onClick={() => onCategorySelect(stat.type)}
            >
              <span 
                className="legend-color" 
                style={{ 
                  backgroundColor: CATEGORY_COLORS[stat.type] || 
                    ['#9333EA', '#EC4899', '#3B82F6', '#F59E0B', '#10B981', '#EF4444'][i % 6]
                }}
              />
              <span className="legend-label">{stat.label}</span>
              <span className="legend-count">{stat.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Weather recommendation */}
      {cityData.weather && (
        <div className="weather-recommendation">
          <span className="recommendation-text">{cityData.weather.recommendation}</span>
        </div>
      )}
    </div>
  );
};

export default CityOverview;
