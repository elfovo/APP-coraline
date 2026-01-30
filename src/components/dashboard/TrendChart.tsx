import React, { useId, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface TrendChartDataPoint {
  dateISO: string;
  label: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  description?: string;
  data: TrendChartDataPoint[];
  period: number;
  onPeriodChange?: (period: number) => void;
  lineColor?: string;
  valueFormatter?: (value: number) => string;
  emptyStateText?: string;
  customPeriodLabel?: string; // Label personnalisé pour la période dynamique (ex: "Depuis l'accident")
  daysSinceAccident?: number | null; // Nombre de jours depuis l'accident pour remplacer 360
}

type HoveredPoint = {
  x: number;
  y: number;
  value: number;
  label: string;
} | null;

type MousePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

export default function TrendChart({
  title,
  description,
  data,
  period,
  onPeriodChange,
  lineColor = '#C084FC',
  valueFormatter = (value) => `${value}`,
  emptyStateText,
  customPeriodLabel,
  daysSinceAccident,
}: TrendChartProps) {
  const { t } = useLanguage();
  const defaultEmptyStateText = emptyStateText || t('noDataForPeriod');
  
  // Options : 7j, 30j, 90j, et "Depuis l'accident" (remplace 360j) si une date d'accident existe
  const defaultPeriods = [7, 30, 90];
  const allPeriods = daysSinceAccident != null
    ? [...defaultPeriods, daysSinceAccident]
    : defaultPeriods;
  
  // Trier les périodes et supprimer les doublons
  const PERIOD_OPTIONS = Array.from(new Set(allPeriods)).sort((a, b) => a - b);
  const gradientId = useId();

  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint>(null);
  const [mousePosition, setMousePosition] = useState<MousePosition>(null);

  const chartState = useMemo(() => {
    if (!data.length) {
      return null;
    }

    const dataValues = data.map((d) => d.value);
    const dataMax = Math.max(...dataValues, 0);
    const dataMin = dataValues.length ? Math.min(...dataValues) : 0;
    
    // On conserve un léger décalage visuel même si la plus petite valeur est 0
    const hasOnlyPositiveValues = dataMin >= 0;
    const baselinePadding =
      dataMax > 0 ? Math.max(1, Math.round(dataMax * 0.03)) : 1;
    const minValue = hasOnlyPositiveValues
      ? -baselinePadding
      : Math.min(dataMin - baselinePadding, 0);
    const maxValue = dataMax > 0 ? Math.ceil(dataMax * 1.1) : 10;
    
    const valueRange = maxValue - minValue;
    
    const chartTop = 40;
    const chartBottom = 200;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = 520;
    const dataLength = data.length;
    const step = dataLength > 1 ? chartWidth / (dataLength - 1) : 0;
    const labelInterval =
      period <= 7 ? 1 : period <= 30 ? 3 : period <= 90 ? 7 : 30;

    const points = data.map((d, index) => {
      const x = 40 + index * step;
      // Normaliser la valeur par rapport à la plage minValue-maxValue
      const normalizedValueRaw = valueRange > 0 ? (d.value - minValue) / valueRange : 0;
      const normalizedValue = Math.min(1, Math.max(0, normalizedValueRaw));
      const y = chartBottom - normalizedValue * chartHeight;

      return {
        x,
        y,
        value: d.value,
        label: d.label,
        showLabel: index % labelInterval === 0 || index === dataLength - 1,
      };
    });

    let yLabels = Array.from({ length: 6 }, (_, idx) => {
      const value = minValue + (valueRange / 5) * (5 - idx);
      const y = chartTop + (idx * chartHeight) / 5;
      return { value: Math.round(value), y };
    });
    
    if (minValue < 0 && maxValue >= 0) {
      const zeroNormalized = valueRange > 0 ? (0 - minValue) / valueRange : 0;
      const zeroY = chartBottom - zeroNormalized * chartHeight;
      const hasZeroLabel = yLabels.some((label) => label.value === 0);
      if (hasZeroLabel) {
        yLabels = yLabels.map((label) =>
          label.value === 0 ? { ...label, y: zeroY } : label
        );
      } else {
        yLabels.push({ value: 0, y: zeroY });
      }
      yLabels = yLabels.sort((a, b) => a.y - b.y);
    }

    const visibleYLabels = yLabels.filter((label) => label.value >= 0);

    return {
      points,
      visibleYLabels,
    };
  }, [data, period]);

  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    const tension = 0.3;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  if (!chartState) {
    return (
      <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-1">
              {title}
            </p>
            {description && <p className="text-white/80 text-sm">{description}</p>}
          </div>
        </div>
        <p className="text-white/60 text-sm">{defaultEmptyStateText}</p>
      </section>
    );
  }

  const { points, visibleYLabels } = chartState;

  const pathData = createSmoothPath(points);
  const areaPath = `${pathData} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`;

  return (
    <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md w-full min-w-0 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-1">
            {title}
          </p>
          {description && <p className="text-white/80 text-sm">{description}</p>}
        </div>
        {onPeriodChange && (
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            {PERIOD_OPTIONS.map((option) => {
              const isCustomPeriod = daysSinceAccident && option === daysSinceAccident;
              const label = isCustomPeriod && customPeriodLabel 
                ? customPeriodLabel 
                : t('daysLabel', { days: option });
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onPeriodChange(option)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    period === option
                      ? 'bg-white/20 text-white border border-white/40'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative flex-1 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="w-full h-full"
          >
            <svg
              viewBox="0 0 600 200"
              className="w-full h-auto"
              preserveAspectRatio="none"
              onMouseMove={(event) => {
            const svg = event.currentTarget;
            const rect = svg.getBoundingClientRect();
            const relativeX = event.clientX - rect.left;
            const relativeY = event.clientY - rect.top;

            const viewBox = svg.viewBox.baseVal;
            const scaleX = viewBox.width / rect.width;
            const scaleY = viewBox.height / rect.height;
            const x = relativeX * scaleX;
            const y = relativeY * scaleY;

            setMousePosition({
              x: relativeX,
              y: relativeY,
              width: rect.width,
              height: rect.height,
            });

            let closest: HoveredPoint = null;
            let minDistance = Infinity;
            const threshold =
              points.length > 1
                ? Math.max(Math.abs(points[1].x - points[0].x) * 0.6, 25)
                : 25;

            points.forEach((point) => {
              const distance = Math.hypot(x - point.x, y - point.y);
              if (distance < minDistance && distance < threshold) {
                minDistance = distance;
                closest = {
                  x: point.x,
                  y: point.y,
                  value: point.value,
                  label: point.label,
                };
              }
            });

            setHoveredPoint(closest);
          }}
          onMouseLeave={() => {
            setHoveredPoint(null);
            setMousePosition(null);
          }}
        >
          <defs>
            <linearGradient id={`${gradientId}-area`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((index) => {
            const y = 40 + (index * 40);
            return (
              <line
                key={`grid-${index}`}
                x1="40"
                y1={y}
                x2="560"
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            );
          })}

          <line
            x1="40"
            y1="40"
            x2="40"
            y2="200"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          <line
            x1="40"
            y1="200"
            x2="560"
            y2="200"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />

          {visibleYLabels.map((label, index) => (
            <text
              key={`y-label-${index}`}
              x="35"
              y={label.y + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.5)"
              fontSize="10"
            >
              {label.value}
            </text>
          ))}

          <motion.path
            d={areaPath}
            fill={`url(#${gradientId}-area)`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.3 },
            }}
          />

          <motion.path
            d={pathData}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.4 },
            }}
          />

          {period <= 30 &&
            points.map((point, index) => (
              <motion.g
                key={`point-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.5 + (index * 0.03),
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={period <= 7 ? 5 : 3}
                  fill={lineColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </motion.g>
            ))}

          {hoveredPoint && (
            <g>
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="10"
                fill={lineColor}
                opacity="0.2"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="6"
                fill={lineColor}
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
          )}

          {points
            .filter((point) => point.showLabel)
            .map((point, index) => (
              <text
                key={`label-${index}`}
                x={point.x}
                y="220"
                textAnchor="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize="10"
              >
                {point.label}
              </text>
            ))}
            </svg>
          </motion.div>
        </AnimatePresence>

        {hoveredPoint && mousePosition && (
          <div
            className="absolute pointer-events-none z-50 bg-black/90 border border-white/20 rounded-xl px-3 py-2 backdrop-blur-md shadow-lg"
            style={{
              left: `${Math.min(mousePosition.x + 20, mousePosition.width - 140)}px`,
              top: `${Math.max(mousePosition.y - 50, 10)}px`,
              transform:
                mousePosition.x + 20 > mousePosition.width - 140
                  ? 'translateX(-100%)'
                  : 'translateX(0)',
            }}
          >
            <p className="text-white font-semibold text-sm">{hoveredPoint.label}</p>
            <p className="text-white/70 text-xs">{valueFormatter(hoveredPoint.value)}</p>
          </div>
        )}
      </div>
    </section>
  );
}

