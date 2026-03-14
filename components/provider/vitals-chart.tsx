"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface VitalPoint {
  recorded_at: string;
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  weight: number | null;
  glucose: number | null;
}

export function VitalsChart({ data }: { data: VitalPoint[] }) {
  const formatted = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        date: new Date(item.recorded_at).toLocaleDateString()
      })),
    [data]
  );

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="heart_rate" stroke="#ef4444" name="Heart Rate" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="systolic_bp" stroke="#2563eb" name="Systolic BP" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="diastolic_bp" stroke="#1d4ed8" name="Diastolic BP" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="weight" stroke="#059669" name="Weight" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="glucose" stroke="#f59e0b" name="Glucose" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
