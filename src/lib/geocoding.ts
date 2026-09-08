// Geocodificação best-effort via Nominatim (OpenStreetMap) — serviço público,
// gratuito, sem chave de API. Não tem SLA nem garantias de disponibilidade;
// serve para o MVP. Se isto for para produção a sério com volume, considerar
// um serviço pago com SLA (ex: Google Geocoding, Mapbox) — decisão a tomar
// mais tarde, não assumida aqui.
//
// Nota: a política de uso do Nominatim exige um User-Agent identificável e
// no máximo ~1 pedido/segundo. Não chamar isto em loop nem por keystroke.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ReparaJa/0.1 (contacto: suporte@reparaja.pt)";

export type GeocodeResult = { latitude: number; longitude: number; displayName: string };

export async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", `${trimmed}, Portugal`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const results = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const first = results[0];
    if (!first) return null;
    return {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      displayName: first.display_name,
    };
  } catch {
    // Falha de rede/timeout não pode impedir o resto do fluxo (ex: registo).
    return null;
  }
}
