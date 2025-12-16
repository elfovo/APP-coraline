import React, { useId, useMemo, useState } from 'react';

type Period = 7 | 30 | 90 | 360;

export interface TrendChartDataPoint {
  dateISO: string;
  label: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  description?: string;
  data: TrendChartDataPoint[];
  period: Period;
  onPeriodChange?: (period: Period) => void;
  lineColor?: string;
  valueFormatter?: (value: number) => string;
  emptyStateText?: string;
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

const PERIOD_OPTIONS: Period[] = [7, 30, 90, 360];

export default function TrendChart({
  title,
  description,
  data,
  period,
  onPeriodChange,
  lineColor = '#C084FC',
  valueFormatter = (value) => `${value}`,
  emptyStateText = 'Aucune donnée à afficher pour cette période.',
}: TrendChartProps) {
  const gradientId = useId();

  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint>(null);
  const [mousePosition, setMousePosition] = useState<MousePosition>(null);

  const chartState = useMemo(() => {
    if (!data.length) {
      return null;
    }

    const dataMax = Math.max(...data.map((d) => d.value), 0);
    const maxValue = dataMax > 0 ? Math.ceil(dataMax * 1.1) : 10;
    const padding = 20;
    const chartWidth = 520;
    const chartHeight = 160;
    const dataLength = data.length;
    const step = dataLength > 1 ? chartWidth / (dataLength - 1) : 0;
    const labelInterval =
      period <= 7 ? 1 : period <= 30 ? 3 : period <= 90 ? 7 : 30;

    const points = data.map((d, index) => {
      const x = 40 + index * step;
      const y = 200 - padding - (d.value / maxValue) * chartHeight;

      return {
        x,
        y,
        value: d.value,
        label: d.label,
        showLabel: index % labelInterval === 0 || index === dataLength - 1,
      };
    });

    const yLabels = Array.from({ length: 6 }, (_, idx) => {
      const value = Math.round((maxValue / 5) * (5 - idx));
      const y = 40 + (idx * chartHeight) / 5;
      return { value, y };
    });

    return {
      points,
      yLabels,
      maxValue,
      chartWidth,
      padding,
      chartHeight,
      step,
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
        <p className="text-white/60 text-sm">{emptyStateText}</p>
      </section>
    );
  }

  const { points, yLabels, maxValue, chartWidth, padding, chartHeight, step } =
    chartState;

  const pathData = createSmoothPath(points);
  const areaPath = `${pathData} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`;

  return (
    <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-1">
            {title}
          </p>
          {description && <p className="text-white/80 text-sm">{description}</p>}
        </div>
        {onPeriodChange && (
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            {PERIOD_OPTIONS.map((option) => (
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
                {option}j
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
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

          {yLabels.map((label, index) => (
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

          <path d={areaPath} fill={`url(#${gradientId}-area)`} />

          <path
            d={pathData}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {period <= 30 &&
            points.map((point, index) => (
              <g key={`point-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={period <= 7 ? 5 : 3}
                  fill={lineColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {period <= 7 && (
                  <text
                    x={point.x}
                    y={point.y - 10}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {point.value}
                  </text>
                )}
              </g>
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
