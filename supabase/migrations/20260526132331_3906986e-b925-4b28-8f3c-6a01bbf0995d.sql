
CREATE TABLE public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  province text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  unit text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.district_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id uuid NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  indicator_id uuid NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  year int NOT NULL,
  value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (district_id, indicator_id, year)
);
CREATE INDEX di_district_idx ON public.district_indicators(district_id);
CREATE INDEX di_indicator_idx ON public.district_indicators(indicator_id);

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "districts public read" ON public.districts FOR SELECT USING (true);
CREATE POLICY "indicators public read" ON public.indicators FOR SELECT USING (true);
CREATE POLICY "di public read" ON public.district_indicators FOR SELECT USING (true);
