"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Layer } from "leaflet";
import "leaflet/dist/leaflet.css";

type NearbyProfessional = {
  userId: string;
  name: string;
  location: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  categories: string[];
  completedJobs: number;
};

const PORTUGAL_CENTER: [number, number] = [39.5, -8.0];

export function ProfessionalsMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const meMarkerRef = useRef<Layer | null>(null);

  const [center, setCenter] = useState<[number, number] | null>(null);
  const [professionals, setProfessionals] = useState<NearbyProfessional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Inicializa o mapa uma única vez.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      // Os ícones por omissão do Leaflet resolvem caminhos relativos que
      // partem com bundlers como o Turbopack/Webpack — aponta-os
      // explicitamente para o CDN, na mesma versão instalada.
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current).setView(PORTUGAL_CENTER, 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  async function loadNearby(lat: number, lng: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/professionals/nearby?lat=${lat}&lng=${lng}&radiusKm=50`);
      const data = await res.json();
      if (!res.ok) {
        setError("Não foi possível carregar profissionais perto de ti.");
        return;
      }
      setProfessionals(data.professionals);
    } finally {
      setLoading(false);
    }
  }

  function recenter(lat: number, lng: number) {
    setCenter([lat, lng]);
    mapRef.current?.setView([lat, lng], 11);
    loadNearby(lat, lng);

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      if (meMarkerRef.current) meMarkerRef.current.remove();
      meMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 8,
        color: "#FF6B1A",
        fillColor: "#FF6B1A",
        fillOpacity: 0.9,
      })
        .addTo(mapRef.current)
        .bindPopup("A tua localização");
    });
  }

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("O teu navegador não suporta geolocalização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => recenter(pos.coords.latitude, pos.coords.longitude),
      () => setError("Não conseguimos aceder à tua localização. Tenta pesquisar uma zona abaixo.")
    );
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok) {
        setError("Não encontrámos essa localização.");
        return;
      }
      recenter(data.result.latitude, data.result.longitude);
    } finally {
      setLoading(false);
    }
  }

  // Atualiza os marcadores dos profissionais sempre que a lista muda.
  useEffect(() => {
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = professionals.map((p) => {
        const marker = L.marker([p.latitude, p.longitude]).addTo(mapRef.current!);
        const cats = p.categories.length ? p.categories.join(", ") : "Sem histórico ainda";
        marker.bindPopup(
          `<strong>${escapeHtml(p.name)}</strong><br>${escapeHtml(cats)}<br>${p.distanceKm} km · ${p.completedJobs} trabalho${p.completedJobs === 1 ? "" : "s"} concluído${p.completedJobs === 1 ? "" : "s"}`
        );
        return marker;
      });
    });
  }, [professionals]);

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-3 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar zona (ex: Lamego)"
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-orange"
        />
        <button
          type="submit"
          className="rounded-lg bg-orange px-4 py-2 text-sm font-semibold text-white"
        >
          Procurar
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          className="whitespace-nowrap rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold"
        >
          A minha localização
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-red">{error}</p>}

      <div
        ref={mapContainerRef}
        className="h-80 w-full rounded-xl border border-border sm:h-96"
      />

      <div className="mt-4 space-y-2">
        {!center && (
          <p className="rounded-xl bg-surface p-4 text-center text-sm text-text-2 shadow-sm">
            Usa &quot;A minha localização&quot; ou pesquisa uma zona para ver profissionais perto
            de ti.
          </p>
        )}
        {loading && <p className="text-center text-sm text-text-2">A procurar...</p>}
        {center && !loading && professionals.length === 0 && (
          <p className="rounded-xl bg-surface p-4 text-center text-sm text-text-2 shadow-sm">
            Não há profissionais registados perto dessa zona.
          </p>
        )}
        {professionals.map((p) => (
          <div key={p.userId} className="rounded-xl bg-surface p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-text-2">
                  {p.location ?? "Localização não indicada"} · {p.distanceKm} km
                </div>
              </div>
              <span className="whitespace-nowrap text-xs text-text-2">
                {p.completedJobs} trabalho{p.completedJobs === 1 ? "" : "s"}
              </span>
            </div>
            {p.categories.length > 0 && (
              <div className="mt-1 text-xs text-orange">{p.categories.join(" · ")}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
