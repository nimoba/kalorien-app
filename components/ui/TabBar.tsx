'use client';

import React from 'react';
import { useRouter } from 'next/router';
import Icon, { IconName } from './Icon';

const tabs: { path: string; label: string; icon: IconName }[] = [
  { path: '/', label: 'Heute', icon: 'home' },
  { path: '/gewicht', label: 'Gewicht', icon: 'scale' },
  { path: '/fortschritt', label: 'Fotos', icon: 'camera' },
  { path: '/kuehlschrank', label: 'Rezepte', icon: 'chefHat' },
  { path: '/empfehlung', label: 'Ideen', icon: 'sparkles' },
];

export default function TabBar() {
  const router = useRouter();
  const pathname = router.pathname;

  return (
    <nav className="tabbar">
      <div className="tabbar-inner">
        {tabs.map((t) => {
          const active = pathname === t.path;
          return (
            <button key={t.path} className={`tab ${active ? 'active' : ''}`} onClick={() => router.push(t.path)} aria-current={active ? 'page' : undefined}>
              <Icon name={t.icon} size={22} strokeWidth={active ? 2.2 : 1.9} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
