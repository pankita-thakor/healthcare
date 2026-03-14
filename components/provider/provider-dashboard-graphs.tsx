"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const pieColors = ["#14b8a6", "#3b82f6", "#f59e0b", "#ef4444"];

interface StatusDatum {
  name: string;
  value: number;
}

interface ScheduleDatum {
  label: string;
  appointments: number;
}

export function ProviderDashboardGraphs({
  statusData,
  scheduleData
}: {
  statusData: StatusDatum[];
  scheduleData: ScheduleDatum[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={4}>
              {statusData.map((entry, index) => (
                <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scheduleData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="appointments" fill="#14b8a6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
