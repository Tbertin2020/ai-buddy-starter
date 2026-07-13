import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, FileText, Loader2, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/forecast-upload")({ component: ForecastUpload });

type Row = { District: string; Indicator: string; Year: number; Value: number };
type ForecastPoint = { year: number; value: number };
type GroupResult = {
  district: string;
  indicator: string;
  history: ForecastPoint[];
  forecast: ForecastPoint[];
  direction: "upward" | "downward" | "stable";
  insight: string;
  recommendation: string;
};

function linearRegression(points: ForecastPoint[]) {
  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of points) {
    sumX += p.year; sumY += p.value;
    sumXY += p.year * p.value; sumXX += p.year * p.year;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: points[0]?.value ?? 0 };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function recommend(indicator: string, dir: "upward" | "downward" | "stable", district: string): string {
  const k = indicator.toLowerCase();
  const up = dir === "upward", down = dir === "downward";
  if (k.includes("population")) {
    if (up) return `Population in ${district} is projected to keep rising. Government should strengthen family planning strategies, expand reproductive health education, invest in additional schools and health centers, and plan urban infrastructure (water, housing, transport) to absorb the growth sustainably.`;
    if (down) return `Population is projected to decline in ${district}. Government should investigate causes (migration, mortality, fertility), invest in job creation and youth retention programs, and reassess service delivery.`;
    return `Population is stable in ${district}. Government should maintain service capacity and monitor migration and fertility quarterly.`;
  }
  if (k.includes("literacy") || k.includes("education")) {
    if (up) return `Literacy is improving in ${district}. Government should sustain teacher training, expand digital learning, and shift focus to TVET quality.`;
    if (down) return `Literacy is declining in ${district}. Government should audit school attendance, deploy remedial reading programs, and expand adult literacy campaigns.`;
    return `Literacy is stagnating in ${district}. Government should introduce community reading clubs and performance-based teacher incentives.`;
  }
  if (k.includes("gdp") || k.includes("income") || k.includes("economic")) {
    if (up) return `Economic output in ${district} is growing. Government should channel gains into infrastructure, SME financing, and diversify beyond the leading sector.`;
    if (down) return `Economic output is contracting in ${district}. Government should launch stimulus — SME grants, tax relief, cash-for-work — and accelerate priority infrastructure.`;
    return `Economy is flat in ${district}. Government should attract private investment through incentives and upgrade market infrastructure.`;
  }
  if (k.includes("poverty") || k.includes("unemployment")) {
    if (up) return `${indicator} is worsening in ${district}. Government should scale social safety nets (VUP, Ubudehe), expand vocational training, and prioritize labor-intensive public works.`;
    if (down) return `${indicator} is improving in ${district}. Government should protect gains through graduation programs, financial inclusion, and continuous skills upgrading.`;
    return `${indicator} is stagnant in ${district}. Government should re-evaluate targeting of social programs and pilot new livelihood interventions.`;
  }
  if (k.includes("mortality")) {
    if (up) return `Mortality is rising in ${district}. Government must investigate drivers (disease outbreak, maternal health, road safety), reinforce primary healthcare staffing, and expand community health workers.`;
    if (down) return `Mortality is declining in ${district} — positive. Government should maintain immunization and maternal health services and continue investing in referral hospitals.`;
    return `Mortality is stable in ${district}. Government should continue preventive care and routine monitoring.`;
  }
  if (k.includes("health") || k.includes("life")) {
    if (up) return `Health indicators improving in ${district}. Government should expand Mutuelle coverage and prepare for the shift to non-communicable diseases.`;
    if (down) return `Health indicators worsening in ${district}. Government should reinforce primary care staffing and audit service delivery.`;
    return `Health indicators stable in ${district}. Continue preventive care and monitoring.`;
  }
  if (k.includes("water") || k.includes("electricity") || k.includes("access")) {
    if (up) return `Access to ${indicator} is expanding in ${district}. Government should keep infrastructure investment steady and focus on reliability, affordability, and last-mile connections.`;
    if (down) return `Access to ${indicator} is regressing in ${district}. Government should audit distribution infrastructure, allocate emergency maintenance, and engage private operators.`;
    return `Access to ${indicator} is unchanged in ${district}. Government should accelerate connections to underserved sectors.`;
  }
  if (k.includes("agriculture") || k.includes("crop") || k.includes("yield") || k.includes("production")) {
    if (up) return `Agricultural production growing in ${district}. Government should invest in post-harvest storage, market roads, and export value chains.`;
    if (down) return `Agricultural production declining in ${district}. Government should provide subsidized inputs, expand irrigation, and roll out climate-smart practices.`;
    return `Agricultural output stable in ${district}. Government should promote crop diversification and mechanization.`;
  }
  if (up) return `${indicator} projected to keep rising in ${district}. Government should plan proportional service expansion and allocate budget in the medium-term expenditure framework.`;
  if (down) return `${indicator} projected to decline in ${district}. Government should investigate causes, design targeted interventions, and set corrective KPIs for the next planning cycle.`;
  return `${indicator} expected to remain stable in ${district}. Government should maintain current policy and monitor for early signs of change.`;
}

function processRows(rows: Row[]): GroupResult[] {
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = `${r.District}||${r.Indicator}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const results: GroupResult[] = [];
  for (const [key, list] of groups) {
    const [district, indicator] = key.split("||");
    const sorted = [...list].sort((a, b) => a.Year - b.Year);
    const history = sorted.map((r) => ({ year: r.Year, value: r.Value }));
    if (history.length < 2) continue;
    const { slope, intercept } = linearRegression(history);
    const lastYear = history[history.length - 1].year;
    const forecast: ForecastPoint[] = [];
    for (let i = 1; i <= 3; i++) {
      const y = lastYear + i;
      let v = slope * y + intercept;
      if (v < 0) v = 0;
      forecast.push({ year: y, value: Math.round(v * 100) / 100 });
    }
    const dir: "upward" | "downward" | "stable" =
      slope > 0.01 ? "upward" : slope < -0.01 ? "downward" : "stable";
    const last = forecast[forecast.length - 1];
    const verb = dir === "upward" ? "increase to" : dir === "downward" ? "decrease to" : "remain near";
    const insight = `Based on historical statistical modeling for ${district}, ${indicator} shows a ${dir} trend and is expected to ${verb} approximately ${last.value} by ${last.year}.`;
    results.push({
      district, indicator, history, forecast, direction: dir, insight,
      recommendation: recommend(indicator, dir, district),
    });
  }
  return results.sort((a, b) => a.district.localeCompare(b.district) || a.indicator.localeCompare(b.indicator));
}

function ForecastUpload() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [results, setResults] = useState<GroupResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function normalizeRow(raw: Record<string, unknown>): Row | null {
    const get = (k: string) => {
      for (const key of Object.keys(raw)) {
        if (key.trim().toLowerCase() === k.toLowerCase()) return raw[key];
      }
      return undefined;
    };
    const district = String(get("District") ?? "").trim();
    const indicator = String(get("Indicator") ?? "").trim();
    const year = Number(get("Year"));
    const value = Number(get("Value"));
    if (!district || !indicator || !Number.isFinite(year) || !Number.isFinite(value)) return null;
    return { District: district, Indicator: indicator, Year: year, Value: value };
  }

  async function handleFile(file: File) {
    setLoading(true);
    setResults(null);
    setRows(null);
    setFileName(file.name);
    try {
      let parsed: Row[] = [];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv") {
        const text = await file.text();
        const { data, errors } = Papa.parse<Record<string, unknown>>(text, {
          header: true, skipEmptyLines: true, dynamicTyping: false,
        });
        if (errors.length) console.warn("CSV parse warnings", errors);
        parsed = data.map(normalizeRow).filter((r): r is Row => r !== null);
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        parsed = json.map(normalizeRow).filter((r): r is Row => r !== null);
      } else {
        throw new Error("Unsupported file type. Upload .csv, .xlsx, or .xls");
      }
      if (parsed.length === 0) throw new Error("No valid rows found. Required columns: District, Indicator, Year, Value");
      setRows(parsed);
      const res = processRows(parsed);
      if (res.length === 0) throw new Error("Need at least 2 years of data per District+Indicator group");
      setResults(res);
      toast.success(`Forecasted ${res.length} District/Indicator series from ${parsed.length} rows.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to process file");
    } finally {
      setLoading(false);
    }
  }

  function downloadExcel() {
    if (!results) return;
    const flat = results.flatMap((r) => [
      ...r.history.map((p) => ({
        District: r.district, Indicator: r.indicator, Year: p.year,
        Value: p.value, Type: "Historical", Trend: r.direction,
      })),
      ...r.forecast.map((p) => ({
        District: r.district, Indicator: r.indicator, Year: p.year,
        Value: p.value, Type: "Forecast", Trend: r.direction,
      })),
    ]);
    const summary = results.map((r) => ({
      District: r.district, Indicator: r.indicator, Trend: r.direction,
      Insight: r.insight, Recommendation: r.recommendation,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flat), "Forecast Data");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Insights");
    XLSX.writeFile(wb, `forecast_${Date.now()}.xlsx`);
  }

  function downloadPDF() {
    if (!results) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Rwanda Statistics — AI Forecast Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Source: ${fileName} · Generated ${new Date().toLocaleString()}`, 14, 22);
    let y = 30;
    for (const r of results) {
      if (y > 260) { doc.addPage(); y = 15; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${r.district} — ${r.indicator}`, 14, y);
      y += 5;
      autoTable(doc, {
        startY: y,
        head: [["Year", "Value", "Type"]],
        body: [
          ...r.history.map((p) => [p.year, p.value, "Historical"]),
          ...r.forecast.map((p) => [p.year, p.value, "Forecast"]),
        ],
        styles: { fontSize: 8 }, margin: { left: 14 }, theme: "grid",
      });
      // @ts-expect-error - lastAutoTable added by autoTable
      y = doc.lastAutoTable.finalY + 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const insight = doc.splitTextToSize(`Insight: ${r.insight}`, 180);
      doc.text(insight, 14, y); y += insight.length * 4 + 2;
      const rec = doc.splitTextToSize(`Recommendation: ${r.recommendation}`, 180);
      doc.text(rec, 14, y); y += rec.length * 4 + 6;
    }
    doc.save(`forecast_${Date.now()}.pdf`);
  }

  function downloadTemplate() {
    const sample = [
      { District: "Kigali", Indicator: "Population", Year: 2020, Value: 1200000 },
      { District: "Kigali", Indicator: "Population", Year: 2021, Value: 1240000 },
      { District: "Kigali", Indicator: "Population", Year: 2022, Value: 1285000 },
      { District: "Kigali", Indicator: "Literacy Rate", Year: 2020, Value: 78.5 },
      { District: "Kigali", Indicator: "Literacy Rate", Year: 2021, Value: 79.8 },
      { District: "Kigali", Indicator: "Literacy Rate", Year: 2022, Value: 81.2 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sample), "Data");
    XLSX.writeFile(wb, "forecast_template.xlsx");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Custom Data Forecast
          </p>
          <h2 className="text-3xl mt-2">Upload & Forecast</h2>
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
            Upload a CSV or Excel file with columns <code className="bg-muted px-1 rounded">District, Indicator, Year, Value</code>.
            The system will forecast the next 3 years per series and produce AI insights and government recommendations.
            Nothing is saved to the database.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Upload your data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Drop or select a .csv, .xlsx, or .xls file
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="flex gap-2 justify-center flex-wrap">
                <Button onClick={() => inputRef.current?.click()} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Select file
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download template
                </Button>
              </div>
              {fileName && (
                <p className="text-xs text-muted-foreground mt-3">
                  {fileName} · {rows?.length ?? 0} rows parsed
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {results && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  2. Forecast results ({results.length} series)
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={downloadExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((r, i) => (
                    <div key={i} className="border rounded-md p-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-semibold">{r.district}</h3>
                          <p className="text-xs text-muted-foreground">{r.indicator}</p>
                        </div>
                        <span className={
                          "text-xs px-2 py-1 rounded uppercase tracking-wider " +
                          (r.direction === "upward" ? "bg-green-500/10 text-green-500" :
                            r.direction === "downward" ? "bg-red-500/10 text-red-500" :
                            "bg-muted text-muted-foreground")
                        }>
                          {r.direction}
                        </span>
                      </div>

                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b text-muted-foreground text-left">
                              <th className="py-1 pr-3">Year</th>
                              <th className="py-1 pr-3">Value</th>
                              <th className="py-1">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.history.map((p) => (
                              <tr key={"h" + p.year} className="border-b border-border/40">
                                <td className="py-1 pr-3">{p.year}</td>
                                <td className="py-1 pr-3">{p.value}</td>
                                <td className="py-1 text-muted-foreground">Historical</td>
                              </tr>
                            ))}
                            {r.forecast.map((p) => (
                              <tr key={"f" + p.year} className="border-b border-border/40">
                                <td className="py-1 pr-3 font-medium">{p.year}</td>
                                <td className="py-1 pr-3 font-medium">{p.value}</td>
                                <td className="py-1 text-primary">Forecast</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 p-3 rounded bg-accent text-xs">
                        <p className="uppercase tracking-widest text-muted-foreground mb-1">AI Insight</p>
                        {r.insight}
                      </div>
                      <div className="mt-2 p-3 rounded border-l-4 border-primary bg-primary/5 text-xs">
                        <p className="uppercase tracking-widest text-primary mb-1">Recommendation</p>
                        {r.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
