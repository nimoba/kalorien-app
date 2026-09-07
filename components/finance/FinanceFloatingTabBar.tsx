'use client';

import { useRouter } from "next/router";
import Icon, { IconName } from "../ui/Icon";

const tabs: { path: string; label: string; icon: IconName }[] = [
  { path: "/finanzen", label: "Übersicht", icon: "wallet" },
  { path: "/finanzen/transaktionen", label: "Buchungen", icon: "list" },
  { path: "/finanzen/budgets", label: "Budgets", icon: "target" },
  { path: "/finanzen/analysen", label: "Analysen", icon: "pie" },
  { path: "/finanzen/abos", label: "Abos", icon: "repeat" },
];

export default function FinanceFloatingTabBar() {
  const router = useRouter();
  const pathname = router.pathname;
  return (
    <nav className="tabbar">
      <div className="tabbar-inner">
        {tabs.map((t) => {
          const active = pathname === t.path;
          return (
            <button key={t.path} className={`tab ${active ? 'active' : ''}`} onClick={() => router.push(t.path)} aria-current={active ? 'page' : undefined} style={active ? { color: '#3b82f6' } : undefined}>
              <Icon name={t.icon} size={22} strokeWidth={active ? 2.2 : 1.9} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
