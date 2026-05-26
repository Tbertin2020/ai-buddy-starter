import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDistricts,
  fetchIndicators,
  fetchLatestForIndicator,
  fetchSeries,
} from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const districts = useQuery({ queryKey: ["districts"], queryFn: fetchDistricts });
  const indicators = useQuery({ queryKey: ["indicators"], queryFn: fetchIndicators });

  const pop = indicators.data?.find((i) => i.key === "population");
  const gdp = indicators.data?.find((i) => i.key === "gdp_per_capita");
  const lit = indicators.data?.find((i) => i.key === "literacy_rate");

  const latestPop = useQuery({
    queryKey: ["latest", pop?.id],
    queryFn: () => fetchLatestForIndicator(pop!.id),
    enabled: !!pop,
  });

  const kigaliGdp = useQuery({
    queryKey: ["series-kigali-gdp", gdp?.id, districts.data?.[0]?.id],
    queryFn: async () => {
      const nyarugenge = districts.data!.find((d) => d.name === "Nyarugenge")!;
      return fetchSeries(nyarugenge.id, gdp!.id);
    },
    enabled: !!gdp && !!districts.data,
  });

  const totalPop =
    latestPop.data?.reduce((acc, r) => acc + Number(r.value), 0) ?? 0;

  const topPopulated =
    latestPop.data && districts.data
      ? [...latestPop.data]
          .sort((a, b) => b.value - a.value)
          .slice(0, 8)
          .map((r) => ({
            name: districts.data!.find((d) => d.id === r.district_id)?.name ?? "",
            value: Math.round(r.value / 1000),
          }))
      : [];

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Overview · 2024
          </p>
          <h2 className="text-4xl mt-2">Rwanda at a Glance</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Explore official statistics across Rwanda's 30 districts. Compare
            indicators, view geographic patterns, and forecast future trends with AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            label="Total Population"
            value={`${(totalPop / 1_000_000).toFixed(2)}M`}
            sub="Sum across 30 districts"
          />
          <KpiCard
            label="Districts Tracked"
            value={String(districts.data?.length ?? "–")}
            sub="Across 5 provinces"
          />
          <KpiCard
            label="Indicators"
            value={String(indicators.data?.length ?? "–")}
            sub="Demographics · Economy · Health · Education"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                GDP per Capita — Nyarugenge (Kigali)
              </CardTitle>
              <Link
                to="/explore"
                className="text-xs text-primary inline-flex items-center gap-1"
              >
                Explore <ArrowUpRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kigaliGdp.data ?? []}>
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
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Most Populated Districts (2024, thousands)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPopulated}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: 11 }}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick start</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <QuickLink to="/explore" title="Browse Districts" desc="See charts per district" />
            <QuickLink to="/compare" title="Compare 2 Districts" desc="Side by side" />
            <QuickLink to="/map" title="View Map" desc="Geographic patterns" />
            <QuickLink to="/predict" title="AI Forecast" desc="Predict future trends" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-3xl mt-2">{value}</p>
        <p className="text-xs text-muted-foreground mt-2">{sub}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  to,
  title,
  desc,
}: {
  to: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="block p-4 rounded-md border border-border hover:border-primary hover:bg-accent transition-colors"
    >
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}
