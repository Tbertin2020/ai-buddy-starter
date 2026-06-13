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

const API_BASE_URL = "http://localhost/rwandadb-api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

export async function fetchDistricts(): Promise<District[]> {
  const res = await fetch(`${API_BASE_URL}/districts.php`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    throw new Error("Failed to fetch districts");
  }
  return res.json();
}

export async function fetchIndicators(): Promise<Indicator[]> {
  const res = await fetch(`${API_BASE_URL}/indicators.php`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    throw new Error("Failed to fetch indicators");
  }
  return res.json();
}

export async function fetchSeries(
  districtId: string,
  indicatorId: string,
): Promise<{ year: number; value: number }[]> {
  const res = await fetch(
    `${API_BASE_URL}/series.php?district_id=${encodeURIComponent(
      districtId,
    )}&indicator_id=${encodeURIComponent(indicatorId)}`,
    {
      headers: getHeaders(),
    },
  );
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    throw new Error("Failed to fetch series");
  }
  return res.json();
}

export async function fetchLatestForIndicator(
  indicatorId: string,
): Promise<{ district_id: string; value: number; year: number }[]> {
  const res = await fetch(
    `${API_BASE_URL}/latest.php?indicator_id=${encodeURIComponent(indicatorId)}`,
    {
      headers: getHeaders(),
    },
  );
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    throw new Error("Failed to fetch latest data");
  }
  return res.json();
}
