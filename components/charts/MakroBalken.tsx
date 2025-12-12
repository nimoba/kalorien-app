'use client';

import React from "react";
import { motion } from "framer-motion";
import { getStatusInfo } from "../../utils/colors";

interface Props {
  label: string;
  value: number;
  ziel: number;
}

const macroIcons: Record<string, { icon: React.ReactElement; color: string }> = {
  "Kohlenhydrate": {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.54" />
      </svg>
    ),
    color: "#f59e0b",
  },
  "Eiweiß": {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a9 9 0 0 0-9 9c0 4.17 2.84 7.67 6.69 8.69a3.32 3.32 0 0 0 4.62 0C18.16 18.67 21 15.17 21 11a9 9 0 0 0-9-9z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    ),
    color: "#6366f1",
  },
  "Fett": {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z" />
      </svg>
    ),
    color: "#ec4899",
  },
};

export function MakroBalken({ label, value, ziel }: Props) {
  const prozent = Math.min((value / ziel) * 100, 100);
  const progress = value / ziel;
  const statusInfo = getStatusInfo(progress);
  const macroInfo = macroIcons[label] || { icon: null, color: "#6366f1" };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'rgba(28, 28, 38, 0.6)',
        borderRadius: 16,
        padding: 16,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        marginBottom: 12,
      }}
    >
      {/* Header Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {/* Icon */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `${macroInfo.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: macroInfo.color,
          }}>
            {macroInfo.icon}
          </div>

          {/* Label */}
          <span style={{
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
          }}>
            {label}
          </span>
        </div>

        {/* Values */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}>
          <span style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#fff',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {Math.round(value)}
          </span>
          <span style={{
            fontSize: 13,
            color: '#71717a',
          }}>
            / {Math.round(ziel)}g
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: 8,
        background: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${prozent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${macroInfo.color} 0%, ${macroInfo.color}cc 100%)`,
            borderRadius: 10,
            position: 'relative',
            boxShadow: `0 0 10px ${macroInfo.color}40`,
          }}
        >
          {/* Shine effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)',
            borderRadius: '10px 10px 0 0',
          }} />
        </motion.div>
      </div>

      {/* Bottom info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 8,
        fontSize: 12,
      }}>
        <span style={{
          color: '#71717a',
        }}>
          {Math.round(prozent)}% erreicht
        </span>
        <span style={{
          color: statusInfo.color,
          fontWeight: 500,
        }}>
          {statusInfo.text}
        </span>
      </div>
    </motion.div>
  );
}
