import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
  decimals?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  formatter,
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, duration]);

  const formattedValue = formatter
    ? formatter(displayValue)
    : displayValue.toFixed(decimals);

  return (
    <span
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum"',
      }}
    >
      {formattedValue}
    </span>
  );
};
