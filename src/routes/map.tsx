import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDistricts,
  fetchIndicators,
  fetchLatestForIndicator,
} from "@/lib/data";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/map")({ component: MapPage });

function MapPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const districts = useQuery({ queryKey: ["districts"], queryFn: fetchDistricts });
  const indicators = useQuery({
    queryKey: ["indicators"],
    queryFn: fetchIndicators,
  });

  const [iId, setIId] = useState("");
  const indicatorId = iId || indicators.data?.[0]?.id || "";

  const latest = useQuery({
    queryKey: ["latest", indicatorId],
    queryFn: () => fetchLatestForIndicator(indicatorId),
    enabled: !!indicatorId,
  });

  const indicator = indicators.data?.find((i) => i.id === indicatorId);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Geographic View
          </p>
          <h2 className="text-3xl mt-2">Rwanda Map</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Circle size reflects the latest value for the selected indicator.
          </p>
        </div>

        <div className="max-w-sm">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {indicator?.name} ({indicator?.unit}) · latest year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[520px] rounded-md overflow-hidden border border-border">
              {mounted && districts.data && latest.data && (
                <LeafletMap
                  districts={districts.data}
                  values={latest.data}
                  unit={indicator?.unit ?? ""}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

import type { District } from "@/lib/data";

function LeafletMap({
  districts,
  values,
  unit,
}: {
  districts: District[];
  values: { district_id: string; value: number; year: number }[];
  unit: string;
}) {
  // Dynamic import so SSR doesn't break
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MapContainer, TileLayer, CircleMarker, Tooltip } = require("react-leaflet");
  const valueMap = new Map(values.map((v) => [v.district_id, v]));
  const max = Math.max(...values.map((v) => v.value));
  const min = Math.min(...values.map((v) => v.value));

  return (
    <MapContainer
      center={[-1.95, 30] as [number, number]}
      zoom={8}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {districts.map((d) => {
        const v = valueMap.get(d.id);
        if (!v) return null;
        const norm = (v.value - min) / (max - min || 1);
        const radius = 8 + norm * 22;
        return (
          <CircleMarker
            key={d.id}
            center={[d.lat, d.lng] as [number, number]}
            radius={radius}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.5,
              weight: 1.5,
            }}
          >
            <Tooltip>
              <div className="text-xs">
                <strong>{d.name}</strong>
                <br />
                {d.province}
                <br />
                {v.value.toLocaleString()} {unit} ({v.year})
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
