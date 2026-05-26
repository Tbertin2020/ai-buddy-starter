import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDistricts, fetchIndicators, fetchSeries } from "@/lib/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/compare")({ component: Compare });

function Compare() {
  const districts = useQuery({ queryKey: ["districts"], queryFn: fetchDistricts });
  const indicators = useQuery({
    queryKey: ["indicators"],
    queryFn: fetchIndicators,
  });

  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [ind, setInd] = useState<string>("");

  const aId = a || districts.data?.find((d) => d.name === "Nyarugenge")?.id || "";
  const bId = b || districts.data?.find((d) => d.name === "Musanze")?.id || "";
  const iId = ind || indicators.data?.[0]?.id || "";

  const sA = useQuery({
    queryKey: ["s", aId, iId],
    queryFn: () => fetchSeries(aId, iId),
    enabled: !!aId && !!iId,
  });
  const sB = useQuery({
    queryKey: ["s", bId, iId],
    queryFn: () => fetchSeries(bId, iId),
    enabled: !!bId && !!iId,
  });

  const dA = districts.data?.find((d) => d.id === aId);
  const dB = districts.data?.find((d) => d.id === bId);
  const indicator = indicators.data?.find((i) => i.id === iId);

  const merged = (sA.data ?? []).map((r, i) => ({
    year: r.year,
    [dA?.name ?? "A"]: r.value,
    [dB?.name ?? "B"]: sB.data?.[i]?.value,
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Compare
          </p>
          <h2 className="text-3xl mt-2">Two Districts, Side by Side</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SelectField
            label="District A"
            value={aId}
            onChange={setA}
            options={districts.data?.map((d) => ({ id: d.id, label: d.name })) ?? []}
          />
          <SelectField
            label="District B"
            value={bId}
            onChange={setB}
            options={districts.data?.map((d) => ({ id: d.id, label: d.name })) ?? []}
          />
          <SelectField
            label="Indicator"
            value={iId}
            onChange={setInd}
            options={indicators.data?.map((i) => ({ id: i.id, label: i.name })) ?? []}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {indicator?.name} ({indicator?.unit})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={merged}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  {dA && (
                    <Line
                      type="monotone"
                      dataKey={dA.name}
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                    />
                  )}
                  {dB && (
                    <Line
                      type="monotone"
                      dataKey={dB.name}
                      stroke="var(--chart-3)"
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DistrictSummary name={dA?.name} series={sA.data} unit={indicator?.unit} />
          <DistrictSummary name={dB?.name} series={sB.data} unit={indicator?.unit} />
        </div>
      </div>
    </AppShell>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DistrictSummary({
  name,
  series,
  unit,
}: {
  name?: string;
  series?: { year: number; value: number }[];
  unit?: string;
}) {
  if (!series?.length) return null;
  const first = series[0];
  const last = series[series.length - 1];
  const change = ((last.value - first.value) / first.value) * 100;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label={`${first.year}`} value={`${first.value.toLocaleString()} ${unit}`} />
        <Row label={`${last.year}`} value={`${last.value.toLocaleString()} ${unit}`} />
        <Row
          label="Change"
          value={`${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
        />
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/50 pb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
