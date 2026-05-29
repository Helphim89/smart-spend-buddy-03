import { useMemo, useState } from "react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import type { Purchase } from "@/lib/budget-types";
import { startOfMonth, endOfMonth, formatSEK } from "@/lib/budget-math";
import { cn } from "@/lib/utils";

type Mode = "day" | "week" | "month";

function dailyData(purchases: Purchase[]) {
  const ref = new Date();
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  const days = end.getDate();
  const map = new Map<number, number>();
  for (let i = 1; i <= days; i++) map.set(i, 0);
  for (const p of purchases) {
    const d = new Date(p.date);
    if (d >= start && d <= end) {
      map.set(d.getDate(), (map.get(d.getDate()) ?? 0) + p.amount);
    }
  }
  return Array.from(map.entries()).map(([day, value]) => ({
    label: String(day),
    value: Math.round(value),
  }));
}

function weeklyData(purchases: Purchase[]) {
  const ref = new Date();
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  const buckets = [0, 0, 0, 0, 0];
  for (const p of purchases) {
    const d = new Date(p.date);
    if (d >= start && d <= end) {
      const idx = Math.min(Math.floor((d.getDate() - 1) / 7), 4);
      buckets[idx] += p.amount;
    }
  }
  return buckets.map((v, i) => ({ label: `V${i + 1}`, value: Math.round(v) }));
}

function monthlyData(purchases: Purchase[]) {
  const now = new Date();
  const months: { label: string; value: number; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString("sv-SE", { month: "short" }),
      value: 0,
      key: `${d.getFullYear()}-${d.getMonth()}`,
    });
  }
  for (const p of purchases) {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const m = months.find((x) => x.key === key);
    if (m) m.value += p.amount;
  }
  return months.map((m) => ({ label: m.label, value: Math.round(m.value) }));
}

export function SpendingChart({ purchases }: { purchases: Purchase[] }) {
  const [mode, setMode] = useState<Mode>("day");

  const data = useMemo(() => {
    if (mode === "day") return dailyData(purchases);
    if (mode === "week") return weeklyData(purchases);
    return monthlyData(purchases);
  }, [purchases, mode]);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border/60 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Kostnader</h3>
        <div className="flex bg-muted rounded-lg p-0.5 text-xs font-medium">
          {(["day", "week", "month"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-3 py-1 rounded-md transition-colors",
                mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {m === "day" ? "Dag" : m === "week" ? "Vecka" : "Månad"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={mode === "day" ? 2 : 0}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: "var(--color-muted)" }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number) => [formatSEK(v), "Spenderat"]}
            />
            <Bar dataKey="value" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
