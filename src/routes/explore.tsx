import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/explore")({ component: Explore });

function Explore() {
  const districts = useQuery({ queryKey: ["districts"], queryFn: fetchDistricts });
  const indicators = useQuery({
    queryKey: ["indicators"],
    queryFn: fetchIndicators,
  });

  const [districtId, setDistrictId] = useState<string>("");
  const [indicatorId, setIndicatorId] = useState<string>("");

  // default selections
  const dId = districtId || districts.data?.[0]?.id || "";
  const iId = indicatorId || indicators.data?.[0]?.id || "";

  const series = useQuery({
    queryKey: ["series", dId, iId],
    queryFn: () => fetchSeries(dId, iId),
    enabled: !!dId && !!iId,
  });

  const district = districts.data?.find((d) => d.id === dId);
  const indicator = indicators.data?.find((i) => i.id === iId);

  const csv = useMemo(() => {
    if (!series.data || !district || !indicator) return "";
    const rows = [
      ["district", "indicator", "unit", "year", "value"],
      ...series.data.map((s) => [
        district.name,
        indicator.name,
        indicator.unit,
        s.year,
        s.value,
      ]),
    ];
    return rows.map((r) => r.join(",")).join("\n");
  }, [series.data, district, indicator]);

  function downloadCsv() {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${district?.name}_${indicator?.key}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Explore
          </p>
          <h2 className="text-3xl mt-2">District Indicators</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">District</label>
            <Select value={dId} onValueChange={setDistrictId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pick a district" />
              </SelectTrigger>
              <SelectContent>
                {districts.data?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} · {d.province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Indicator</label>
            <Select value={iId} onValueChange={setIndicatorId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pick an indicator" />
              </SelectTrigger>
              <SelectContent>
                {indicators.data?.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name} ({i.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {district?.name} — {indicator?.name} ({indicator?.unit})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadCsv}
              disabled={!series.data?.length}
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series.data ?? []}>
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
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2">Year</th>
                    <th className="py-2">Value ({indicator?.unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {series.data?.map((r) => (
                    <tr key={r.year} className="border-b border-border/50">
                      <td className="py-2">{r.year}</td>
                      <td className="py-2">{r.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
