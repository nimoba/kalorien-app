'use client';

interface Props {
  label: string;
  value: number;
  ziel: number;
  farbe: string;
}

export function MakroBalken({ label, value, ziel, farbe }: Props) {
  const prozent = Math.min((value / ziel) * 100, 100);

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ margin: "4px 0" }}>{label}: {value} / {ziel} g</p>
      <div style={{
        height: 12,
        backgroundColor: "#e0e0e0",
        borderRadius: 12,
        overflow: "hidden"
      }}>
        <div style={{
          width: `${prozent}%`,
          height: "100%",
          backgroundColor: farbe,
          borderRadius: 12,
          transition: "width 0.3s ease"
        }} />
      </div>
    </div>
  );
}
