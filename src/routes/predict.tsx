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
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
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
import { toast } from "sonner";

export const Route = createFileRoute("/predict")({ component: Predict });

type Forecast = { year: number; value: number };

function Predict() {
  const districts = useQuery({ queryKey: ["districts"], queryFn: fetchDistricts });
  const indicators = useQuery({
    queryKey: ["indicators"],
    queryFn: fetchIndicators,
  });

  const [dId, setDId] = useState("");
  const [iId, setIId] = useState("");
  const districtId = dId || districts.data?.[0]?.id || "";
  const indicatorId = iId || indicators.data?.[0]?.id || "";

  const series = useQuery({
    queryKey: ["s", districtId, indicatorId],
    queryFn: () => fetchSeries(districtId, indicatorId),
    enabled: !!districtId && !!indicatorId,
  });

  const district = districts.data?.find((d) => d.id === districtId);
  const indicator = indicators.data?.find((i) => i.id === indicatorId);

  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<Forecast[] | null>(null);
  const [insight, setInsight] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");

  async function runForecast() {
    if (!series.data?.length || !district || !indicator) return;
    setLoading(true);
    setForecast(null);
    setInsight("");
    setRecommendation("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost/rwandadb-api/predict.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          districtName: district.name,
          indicatorName: indicator.name,
          unit: indicator.unit,
          history: series.data,
          forecastYears: 3,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to generate forecast from PHP API");
      }
      
      const r = await res.json() as { forecast: Forecast[]; insight: string; recommendation?: string };
      setForecast(r.forecast);
      setInsight(r.insight);
      setRecommendation(r.recommendation ?? "");
    } catch (e) {
      toast.error("Forecast failed: " + (e instanceof Error ? e.message : "unknown"));
    } finally {
      setLoading(false);
    }
  }

  const chartData = [
    ...(series.data ?? []).map((p) => ({ year: p.year, historical: p.value })),
    ...(forecast ?? []).map((p) => ({ year: p.year, forecast: p.value })),
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            AI Predictions
          </p>
          <h2 className="text-3xl mt-2">Forecast Future Trends</h2>
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
            Uses Lovable AI to forecast the next 3 years based on historical
            district-level data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">District</label>
            <Select value={districtId} onValueChange={setDId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {districts.data?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Indicator</label>
            <Select value={indicatorId} onValueChange={setIId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {indicators.data?.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={runForecast}
              disabled={loading || !series.data?.length}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate forecast
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {district?.name} — {indicator?.name} ({indicator?.unit})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {insight && (
              <div className="mt-6 p-4 rounded-md bg-accent text-sm">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  AI Insight
                </p>
                {insight}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
