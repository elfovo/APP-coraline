'use client';

import { useCallback, useEffect, useRef, useId, useState } from 'react';
import './GlassSurface.css';

const GlassSurface = ({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  className = '',
  style = {}
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;

  const containerRef = useRef(null);
  const feImageRef = useRef(null);
  const redChannelRef = useRef(null);
  const greenChannelRef = useRef(null);
  const blueChannelRef = useRef(null);
  const gaussianBlurRef = useRef(null);
  const rafRef = useRef(null);

  const [isClient, setIsClient] = useState(false);
  const [advancedFilterSupported, setAdvancedFilterSupported] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const generateDisplacementMap = useCallback(
    (actualWidth, actualHeight) => {
      const clampedWidth = Math.max(actualWidth, 1);
      const clampedHeight = Math.max(actualHeight, 1);
      const edgeSize = Math.min(clampedWidth, clampedHeight) * (borderWidth * 0.5);

      const svgContent = `
        <svg viewBox="0 0 ${clampedWidth} ${clampedHeight}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#0000"/>
              <stop offset="100%" stop-color="red"/>
            </linearGradient>
            <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#0000"/>
              <stop offset="100%" stop-color="blue"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="${clampedWidth}" height="${clampedHeight}" fill="black"></rect>
          <rect x="0" y="0" width="${clampedWidth}" height="${clampedHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
          <rect x="0" y="0" width="${clampedWidth}" height="${clampedHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
          <rect x="${edgeSize}" y="${edgeSize}" width="${clampedWidth - edgeSize * 2}" height="${clampedHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
        </svg>
      `;

      return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
    },
    [borderRadius, borderWidth, brightness, opacity, blur, mixBlendMode, redGradId, blueGradId]
  );

  const updateDisplacementMap = useCallback(() => {
    if (!containerRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const actualWidth = rect?.width || 400;
    const actualHeight = rect?.height || 200;
    const map = generateDisplacementMap(actualWidth, actualHeight);

    if (feImageRef.current) {
      feImageRef.current.setAttribute('href', map);
    }

    setDimensions((prev) => {
      if (prev.width === actualWidth && prev.height === actualHeight) {
        return prev;
      }

      return { width: actualWidth, height: actualHeight };
    });
  }, [generateDisplacementMap]);

  const scheduleMapUpdate = useCallback(() => {
    if (typeof window === 'undefined') {
      updateDisplacementMap();
      return;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = window.requestAnimationFrame(() => {
      updateDisplacementMap();
    });
  }, [updateDisplacementMap]);

  const supportsSVGFilters = useCallback(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    const testElement = document.createElement('div');
    const style = testElement.style;
    const backdropProperty =
      'backdropFilter' in style
        ? 'backdropFilter'
        : 'webkitBackdropFilter' in style
          ? 'webkitBackdropFilter'
          : null;

    if (!backdropProperty) {
      return false;
    }

    try {
      style[backdropProperty] = `url(#${filterId}) saturate(1)`;
    } catch (_error) {
      return false;
    }

    const hasUrlSupport =
      typeof style[backdropProperty] === 'string' && style[backdropProperty].includes('url(');

    if (!hasUrlSupport) {
      return false;
    }

    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
      const filterUrlSupported = CSS.supports('filter', `url(#${filterId})`);
      if (!filterUrlSupported) {
        return false;
      }
    }

    return true;
  }, [filterId]);

  useEffect(() => {
    setIsClient(true);
    setAdvancedFilterSupported(supportsSVGFilters());
  }, [supportsSVGFilters]);

  useEffect(() => {
    scheduleMapUpdate();
  }, [scheduleMapUpdate, width, height]);

  useEffect(() => {
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (!ref.current) {
        return;
      }

      ref.current.setAttribute('scale', (distortionScale + offset).toString());
      ref.current.setAttribute('xChannelSelector', xChannel);
      ref.current.setAttribute('yChannelSelector', yChannel);
    });

    if (gaussianBlurRef.current) {
      gaussianBlurRef.current.setAttribute('stdDeviation', displace.toString());
    }
  }, [distortionScale, redOffset, greenOffset, blueOffset, xChannel, yChannel, displace]);

  useEffect(() => {
    if (!isClient || !containerRef.current) {
      return;
    }

    const handleResize = () => {
      scheduleMapUpdate();
    };

    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }

    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }

    handleResize();
  }, [isClient, scheduleMapUpdate]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const showFallbackVisual =
    isClient && !advancedFilterSupported && dimensions.width > 0 && dimensions.height > 0;

  const containerStyle = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    '--glass-frost': backgroundOpacity,
    '--glass-saturation': saturation,
    '--filter-id': `url(#${filterId})`
  };

  return (
    <div
      ref={containerRef}
      className={`glass-surface ${
        isClient && advancedFilterSupported ? 'glass-surface--svg' : 'glass-surface--fallback'
      } ${className}`}
      style={containerStyle}
    >
      <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />

            <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" id="redchannel" result="dispRed" />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="red"
            />

            <feDisplacementMap
              ref={greenChannelRef}
              in="SourceGraphic"
              in2="map"
              id="greenchannel"
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="green"
            />

            <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="blue"
            />

            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      {showFallbackVisual && (
        <svg
          className="glass-surface__visual"
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <rect
            x="0"
            y="0"
            width={dimensions.width}
            height={dimensions.height}
            rx={borderRadius}
            ry={borderRadius}
            fill={`hsl(0 0% ${brightness}% / ${opacity})`}
            filter={`url(#${filterId})`}
          />
        </svg>
      )}

      <div className="glass-surface__content">{children}</div>
    </div>
  );
};

export default GlassSurface;



