import { supabase } from "@/integrations/supabase/client";

export type District = {
  id: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
};

export type Indicator = {
  id: string;
  key: string;
  name: string;
  unit: string;
  category: string;
};

export type DistrictIndicator = {
  district_id: string;
  indicator_id: string;
  year: number;
  value: number;
};

export async function fetchDistricts(): Promise<District[]> {
  const { data, error } = await supabase
    .from("districts")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as District[];
}

export async function fetchIndicators(): Promise<Indicator[]> {
  const { data, error } = await supabase
    .from("indicators")
    .select("*")
    .order("category");
  if (error) throw error;
  return data as Indicator[];
}

export async function fetchSeries(
  districtId: string,
  indicatorId: string,
): Promise<{ year: number; value: number }[]> {
  const { data, error } = await supabase
    .from("district_indicators")
    .select("year,value")
    .eq("district_id", districtId)
    .eq("indicator_id", indicatorId)
    .order("year");
  if (error) throw error;
  return (data as { year: number; value: number }[]).map((r) => ({
    year: r.year,
    value: Number(r.value),
  }));
}

export async function fetchLatestForIndicator(
  indicatorId: string,
): Promise<{ district_id: string; value: number; year: number }[]> {
  const { data, error } = await supabase
    .from("district_indicators")
    .select("district_id,year,value")
    .eq("indicator_id", indicatorId)
    .order("year", { ascending: false });
  if (error) throw error;
  const seen = new Set<string>();
  const out: { district_id: string; year: number; value: number }[] = [];
  for (const r of data as { district_id: string; year: number; value: number }[]) {
    if (!seen.has(r.district_id)) {
      seen.add(r.district_id);
      out.push({ ...r, value: Number(r.value) });
    }
  }
  return out;
}
