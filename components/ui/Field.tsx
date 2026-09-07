'use client';

import React from 'react';
import Icon, { IconName } from './Icon';

interface FieldProps {
  label?: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Field({ label, hint, children, style }: FieldProps) {
  return (
    <div className="field" style={style}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <span className="tiny faint">{hint}</span>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suffix?: string;
  prefixIcon?: IconName;
  small?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { suffix, prefixIcon, small, className = '', ...rest }, ref
) {
  const cls = `input ${small ? 'input-sm' : ''} ${className}`;
  if (!suffix && !prefixIcon) return <input ref={ref} className={cls} {...rest} />;
  return (
    <div className={`input-affix ${prefixIcon ? 'has-prefix' : ''}`}>
      {prefixIcon && <span className="prefix-icon"><Icon name={prefixIcon} size={18} /></span>}
      <input ref={ref} className={cls} {...rest} />
      {suffix && <span className="affix">{suffix}</span>}
    </div>
  );
});

export function Select({ className = '', children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`input ${className}`} {...rest}>{children}</select>;
}

export function Textarea({ className = '', ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`input ${className}`} {...rest} />;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: IconName }[];
}

export function Segmented<T extends string>({ value, onChange, options }: SegmentedProps<T>) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} type="button" className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={15} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label className="row-between" style={{ cursor: 'pointer', gap: 14 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {sub && <div className="small faint">{sub}</div>}
      </div>
      <span className={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange(!on)} />
    </label>
  );
}
