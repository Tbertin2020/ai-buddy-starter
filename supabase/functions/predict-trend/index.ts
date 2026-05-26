// Lovable AI trend prediction edge function
// Takes historical (year, value) points and asks the AI to forecast next N years.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReqBody {
  districtName: string;
  indicatorName: string;
  unit: string;
  history: { year: number; value: number }[];
  forecastYears?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { districtName, indicatorName, unit, history, forecastYears = 3 } =
      (await req.json()) as ReqBody;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const sortedHistory = [...history].sort((a, b) => a.year - b.year);
    const lastYear = sortedHistory[sortedHistory.length - 1].year;
    const targetYears = Array.from(
      { length: forecastYears },
      (_, i) => lastYear + i + 1,
    );

    const systemPrompt = `You are a statistical forecaster. Given historical yearly values for a Rwandan district indicator, predict future values using simple trend extrapolation. Be realistic and conservative.`;

    const userPrompt = `District: ${districtName}
Indicator: ${indicatorName} (${unit})
History (year, value):
${sortedHistory.map((h) => `${h.year}: ${h.value}`).join("\n")}

Forecast values for the years: ${targetYears.join(", ")}.
Also write a 2 sentence plain-English insight about the trend.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_forecast",
                description: "Return forecast values and an insight",
                parameters: {
                  type: "object",
                  properties: {
                    forecast: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          year: { type: "number" },
                          value: { type: "number" },
                        },
                        required: ["year", "value"],
                      },
                    },
                    insight: { type: "string" },
                  },
                  required: ["forecast", "insight"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_forecast" },
          },
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Try again shortly." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in Lovable workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict-trend error", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
