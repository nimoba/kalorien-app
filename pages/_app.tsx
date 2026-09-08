import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ToastProvider } from "../components/ui/Toast";
import Icon from "../components/ui/Icon";

const COOKIE_NAME = "app_access_token";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(name + '='));
  return match ? match.substring(name.length + 1) : null;
}

export default function App({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (getCookie(COOKIE_NAME) === "authenticated") setIsAuthenticated(true);
    setLoading(false);
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(false);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (data.success) {
        setCookie(COOKIE_NAME, "authenticated", 30);
        setIsAuthenticated(true);
      } else {
        setError(true);
        setPassword("");
      }
    } catch {
      setError(true);
    }
    setIsSubmitting(false);
  };

  const head = (
    <Head>
      <title>Kalorien</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
    </Head>
  );

  if (loading) {
    return (
      <>
        {head}
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="spinner" style={{ width: 28, height: 28, color: 'var(--accent)' }} />
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {head}
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.form
            onSubmit={handlePasswordSubmit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card"
            style={{ width: '100%', maxWidth: 360, padding: 28 }}
          >
            <div className="icon-box" style={{ width: 48, height: 48, background: 'var(--accent-soft)', color: 'var(--accent)', marginBottom: 18 }}>
              <Icon name="lock" size={22} />
            </div>
            <h1 className="page-title" style={{ fontSize: 22 }}>Willkommen zurück</h1>
            <p className="page-subtitle" style={{ marginBottom: 20 }}>Passwort eingeben, um fortzufahren</p>

            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              disabled={isSubmitting}
              autoFocus
              style={{ borderColor: error ? 'var(--danger)' : undefined }}
            />
            {error && <p className="small" style={{ color: 'var(--danger)', marginTop: 8 }}>Falsches Passwort</p>}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={isSubmitting} style={{ marginTop: 14 }}>
              {isSubmitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <>Einloggen <Icon name="arrowRight" size={16} /></>}
            </button>
            <p className="tiny faint" style={{ textAlign: 'center', marginTop: 14 }}>Angemeldet bleiben für 30 Tage</p>
          </motion.form>
        </div>
      </>
    );
  }

  return (
    <ToastProvider>
      {head}
      <Component {...pageProps} />
    </ToastProvider>
  );
}
