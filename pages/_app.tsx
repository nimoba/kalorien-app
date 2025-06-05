// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useState, useEffect } from "react";

// ✅ Passwort aus Environment Variable laden
const CORRECT_PASSWORD = process.env.PASSWORD;
const COOKIE_NAME = "app_access_token";

export default function App({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated via cookie
    const savedAuth = getCookie(COOKIE_NAME);
    if (savedAuth === "authenticated") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      // Set cookie that expires in 30 days
      setCookie(COOKIE_NAME, "authenticated", 30);
      setIsAuthenticated(true);
    } else {
      alert("❌ Falsches Passwort!");
      setPassword("");
    }
  };

  // Cookie helper functions
  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#2c2c2c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        <div>⏳ Loading...</div>
      </div>
    );
  }

  // Password protection screen
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#2c2c2c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          backgroundColor: '#1e1e1e',
          padding: 40,
          borderRadius: 16,
          border: '2px solid #444',
          maxWidth: 400,
          width: '90%',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#fff', marginBottom: 24 }}>🔐 App Protection</h2>
          <p style={{ color: '#ccc', marginBottom: 24 }}>
            Bitte Passwort eingeben um fortzufahren:
          </p>
          
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort eingeben..."
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                borderRadius: 8,
                border: '1px solid #555',
                backgroundColor: '#333',
                color: '#fff',
                marginBottom: 16,
                outline: 'none'
              }}
              autoFocus
            />
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#36a2eb',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🚀 Einloggen
            </button>
          </form>
          
          <p style={{ 
            color: '#666', 
            fontSize: 12, 
            marginTop: 20,
            fontStyle: 'italic'
          }}>
            Cookie wird für 30 Tage gespeichert
          </p>
        </div>
      </div>
    );
  }

  // Authenticated - show the app
  return <Component {...pageProps} />;
}