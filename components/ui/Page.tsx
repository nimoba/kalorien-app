'use client';

import React from 'react';
import TabBar from './TabBar';

interface Props {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  noTabBar?: boolean;
}

export default function Page({ title, subtitle, right, children, noTabBar }: Props) {
  return (
    <>
      <main className="page">
        {(title || right) && (
          <header className="page-header">
            <div style={{ minWidth: 0 }}>
              {title && <h1 className="page-title">{title}</h1>}
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {right && <div className="row">{right}</div>}
          </header>
        )}
        {children}
      </main>
      {!noTabBar && <TabBar />}
    </>
  );
}

export function Loading({ text = 'Lade…' }: { text?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: '50vh', color: 'var(--text-3)' }}>
      <span className="spinner" style={{ width: 28, height: 28, color: 'var(--accent)' }} />
      <span className="small">{text}</span>
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 28 }}>
      <p style={{ fontWeight: 600 }}>{text}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={onRetry}>Erneut versuchen</button>
      )}
    </div>
  );
}
