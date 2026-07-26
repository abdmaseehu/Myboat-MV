'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { name: "2016", Revenue: 2400, Orders: 2400 },
  { name: "2017", Revenue: 3600, Orders: 4000 },
  { name: "2018", Revenue: 3200, Orders: 3600 },
  { name: "2019", Revenue: 4500, Orders: 4400 },
  { name: "2020", Revenue: 5200, Orders: 5000 },
  { name: "2021", Revenue: 6800, Orders: 6200 },
  { name: "2022", Revenue: 4800, Orders: 4800 },
  { name: "2023", Revenue: 5800, Orders: 5400 },
  { name: "2024", Revenue: 7200, Orders: 6600 },
  { name: "2025", Revenue: 4200, Orders: 4000 },
];

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-sm text-muted-foreground" />
        <YAxis className="text-sm text-muted-foreground" />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Revenue
                      </span>
                      <span className="font-bold text-sky-500">
                        ${payload[0].value}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Orders
                      </span>
                      <span className="font-bold text-blue-500">
                        ${payload[1].value}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="Revenue"
          stroke="#eab308"
          fill="#eab308"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Orders"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
