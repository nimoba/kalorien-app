'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  flat?: boolean;
}

export default function Card({ title, subtitle, right, flat, className = '', children, ...rest }: CardProps) {
  return (
    <div className={`${flat ? 'card-flat' : 'card'} ${className}`} {...rest}>
      {(title || right) && (
        <div className="row-between" style={{ marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Stat({ value, label, color, size = 'md' }: { value: React.ReactNode; label: string; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  const fs = size === 'lg' ? 28 : size === 'sm' ? 16 : 20;
  return (
    <div>
      <div className="num" style={{ fontSize: fs, fontWeight: 700, color: color || 'var(--text)', lineHeight: 1.1 }}>{value}</div>
      <div className="tiny faint" style={{ marginTop: 3 }}>{label}</div>
    </div>
  );
}

export function EmptyState({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <div className="empty">
      {icon && <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: 'var(--text-3)' }}>{icon}</div>}
      {text}
    </div>
  );
}
