import React, { useState, useEffect, useRef } from 'react';

interface NumFieldProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  allowDecimal?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * A numeric input that never shows a stray leading zero and never fights the
 * user mid-keystroke.
 *
 * Native `type="number"` is inconsistent across mobile browsers/WebViews about
 * clearing an existing "0" before a new digit lands — on several of them,
 * focusing a field that reads "0" and typing "450" produces "0450" on screen,
 * because the leading "0" isn't selected/cleared first the way desktop Chrome
 * does it. That matters here since this app ships as a Capacitor Android app.
 *
 * Fix: track our own text buffer that's authoritative only while the field is
 * focused (synced from `value` the rest of the time, so preset buttons and
 * other external updates still show immediately), and strip leading zeros and
 * non-numeric characters on every keystroke instead of trusting the browser to.
 */
export const NumField: React.FC<NumFieldProps> = ({
  value,
  onChange,
  min = 0,
  allowDecimal = false,
  className,
  placeholder,
  id,
  disabled,
  required,
  autoFocus,
  onKeyDown,
}) => {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  const sanitize = (raw: string): string => {
    let s = allowDecimal ? raw.replace(/[^0-9.]/g, '') : raw.replace(/[^0-9]/g, '');
    if (allowDecimal) {
      const firstDot = s.indexOf('.');
      if (firstDot !== -1) {
        s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
      }
    }
    // Keep a bare "0" or "0." (still mid-edit), but drop a leading zero the
    // moment a real digit follows it — "0" + "4" becomes "4", not "04".
    return s.replace(/^0+(?=\d)/, '');
  };

  return (
    <input
      id={id}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e) => {
        const clean = sanitize(e.target.value);
        setText(clean);
        if (clean === '' || clean === '.') {
          onChange(0);
        } else {
          const n = Number(clean);
          if (!Number.isNaN(n)) onChange(Math.max(min, n));
        }
      }}
      onBlur={() => {
        focused.current = false;
        setText(String(Math.max(min, value)));
      }}
      onKeyDown={onKeyDown}
    />
  );
};
