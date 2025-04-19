'use client';

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  BarController,
  LineController,
} from "chart.js";

import { Chart } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { getOvershootColor } from "../../utils/colors";
import { useEffect, useState } from "react";
import { useZiele } from "../../hooks/useZiele"

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  BarController,
  LineController
);

export function WochenChart() {
  const [history, setHistory] = useState<{ datum: string; kalorien: number; ziel: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history") // ⬅️ erwartet jetzt auch ziel mit
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ color: "#fff" }}>⏳ Lade Monatsverlauf...</p>;
  }

  const labels = history.map((e) => e.datum);
  const daten = history.map((e) => e.kalorien);
  const ziele = history.map((e) => e.ziel);
  const barColors = daten.map((val, i) => getOvershootColor(val, ziele[i], "#36a2eb"));

  const data: ChartData<"bar" | "line"> = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "Kalorien",
        data: daten,
        backgroundColor: barColors,
        borderRadius: 6,
      },
      {
        type: "line",
        label: "Tagesziel",
        data: ziele,
        borderColor: "#ff6384",
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"bar" | "line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>📆 Kalorien im Monatsverlauf</h3>
      <Chart type="bar" data={data} options={options} />
    </div>
  );
}