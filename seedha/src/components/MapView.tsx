import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/map.css";

export default function MapView({
  data,
  activeMode,
  onMapClick,
}: any) {
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map").setView([31.5204, 74.3587], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    map.on("click", (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (!data || !layerRef.current) return;

    layerRef.current.clearLayers();

    const route =
      activeMode === "fuel"
        ? data.fuel_optimized.route
        : data.shortest.route;

    const poly = L.polyline(
      route.map((p: any) => [p.lat, p.lng]),
      {
        color: activeMode === "fuel" ? "#a8ff3e" : "#5ba8ff",
        weight: 6,
        className: "route-line",
      }
    ).addTo(layerRef.current);

    setTimeout(() => animatePolyline(poly), 50);
  }, [data, activeMode]);

  return <div id="map" style={{ width: "100%", height: "100vh" }} />;
}

function animatePolyline(line: L.Polyline) {
  const el = (line as any)._path;
  if (!el) return;

  const length = el.getTotalLength();
  el.style.strokeDasharray = length;
  el.style.strokeDashoffset = length;

  requestAnimationFrame(() => {
    el.style.transition = "stroke-dashoffset 1.2s ease";
    el.style.strokeDashoffset = "0";
  });
}