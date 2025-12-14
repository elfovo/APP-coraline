import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';

import styles from './ElasticSlider.module.css';

const MAX_OVERFLOW = 50;

interface ElasticSliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  trackColor?: string;
  rangeColor?: string;
  labelFormatter?: (val: number) => string;
}

export default function ElasticSlider({
  value = 0,
  min = 0,
  max = 10,
  step = 1,
  onChange,
  className = '',
  leftIcon, 
  rightIcon, 
  trackColor = 'rgba(255,255,255,0.15)',
  rangeColor = 'white',
  labelFormatter = (val) => `${Math.round(val)}`
}: ElasticSliderProps) {
  return (
    <div className={`${styles['slider-container']} ${className}`}>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        trackColor={trackColor}
        rangeColor={rangeColor}
        labelFormatter={labelFormatter}
      />
    </div>
  );
}

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange?: (value: number) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  trackColor?: string;
  rangeColor?: string;
  labelFormatter: (val: number) => string;
}

function Slider({ value, min, max, step, onChange, leftIcon, rightIcon, trackColor, rangeColor, labelFormatter }: SliderProps) {
  const [internalValue, setInternalValue] = useState(value);
  const sliderRef = useRef(null);
  const [region, setRegion] = useState('middle');
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useMotionValueEvent(clientX, 'change', latest => {
    if (sliderRef.current) {
      const { left, right } = sliderRef.current.getBoundingClientRect();
      let newValue;

      if (latest < left) {
        setRegion('left');
        newValue = left - latest;
      } else if (latest > right) {
        setRegion('right');
        newValue = latest - right;
      } else {
        setRegion('middle');
        newValue = 0;
      }

      overflow.jump(decay(newValue, MAX_OVERFLOW));
    }
  });

  const clampValue = (val) => {
    return Math.min(Math.max(val, min), max);
  };

  const getNextValue = (clientPosition) => {
    if (!sliderRef.current) return internalValue;
    const { left, width } = sliderRef.current.getBoundingClientRect();
    let newValue = min + ((clientPosition - left) / width) * (max - min);

    if (step) {
      newValue = Math.round(newValue / step) * step;
    }

    return clampValue(newValue);
  };

  const handlePointerMove = e => {
    if (e.buttons > 0) {
      const newValue = getNextValue(e.clientX);
      setInternalValue(newValue);
      clientX.jump(e.clientX);
      onChange?.(newValue);
    }
  };

  const handlePointerDown = e => {
    const newValue = getNextValue(e.clientX);
    setInternalValue(newValue);
    onChange?.(newValue);
    clientX.jump(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    animate(overflow, 0, { type: 'spring', bounce: 0.5 });
  };

  const getRangePercentage = () => {
    const totalRange = max - min;
    if (totalRange === 0) return 0;

    return ((internalValue - min) / totalRange) * 100;
  };

  return (
    <div className={styles['slider-relative']}>
      <motion.div
        style={{
          scale,
          opacity: useTransform(scale, [1, 1.1], [0.85, 1])
        }}
        className={styles['slider-wrapper']}
      >
        <motion.div
          animate={{
            scale: region === 'left' ? [1, 1.3, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === 'left' ? -overflow.get() / Math.max(scale.get(), 1) : 0))
          }}
        >
          {leftIcon}
        </motion.div>

        <div
          ref={sliderRef}
        className={styles['slider-root']}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <motion.div
            style={{
              scaleX: useTransform(() => {
                if (sliderRef.current) {
                  const { width } = sliderRef.current.getBoundingClientRect();
                  return 1 + overflow.get() / width;
                }
                return 1;
              }),
              scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.85]),
              transformOrigin: useTransform(() => {
                if (sliderRef.current) {
                  const { left, width } = sliderRef.current.getBoundingClientRect();
                  return clientX.get() < left + width / 2 ? 'right' : 'left';
                }
                return 'center';
              })
            }}
            className={styles['slider-track-wrapper']}
          >
            <div className={styles['slider-track']} style={{ backgroundColor: trackColor }}>
              <div
                className={styles['slider-range']}
                style={{ width: `${getRangePercentage()}%`, background: rangeColor }}
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          animate={{
            scale: region === 'right' ? [1, 1.3, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === 'right' ? overflow.get() / Math.max(scale.get(), 1) : 0))
          }}
        >
          {rightIcon}
        </motion.div>
      </motion.div>
      <p className={styles['value-indicator']}>{labelFormatter(internalValue)}</p>
    </div>
  );
}

function decay(value: number, max: number): number {
  if (max === 0) {
    return 0;
  }

  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);

  return sigmoid * max;
}
