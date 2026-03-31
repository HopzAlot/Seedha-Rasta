import { useState } from "react";
import MapView from "./components/MapView";
import HeroCanvas from "./components/HeroCanvas";
import { useRouteAPI } from "./hooks/useRouteAPI";

type Point = {
  lat: number;
  lng: number;
};

export default function App() {
  const [source, setSource] = useState<Point | null>(null);
  const [dest, setDest] = useState<Point | null>(null);
  const [selectMode, setSelectMode] = useState<"source" | "dest" | null>(null);
  const [data, setData] = useState<any>(null);
  const [mode, setMode] = useState<"fuel" | "short">("fuel");

  const { fetchRoutes, loading } = useRouteAPI();

  /* ---------------- MAP CLICK HANDLER ---------------- */
  const handleClick = (lat: number, lng: number) => {
    if (selectMode === "source") {
      setSource({ lat, lng });
      setSelectMode(null);
    } else if (selectMode === "dest") {
      setDest({ lat, lng });
      setSelectMode(null);
    }
  };

  /* ---------------- API CALL ---------------- */
  const compute = async () => {
    if (!source || !dest) return;

    const res = await fetchRoutes(source, dest, {
      id: "car",
      name: "car",
      mileage: 12,
      idle: 0.6,
    });

    setData(res);
    setMode("fuel"); // default highlight
  };

  return (
    <div className="flex h-screen w-screen bg-[#0b0f1a] text-white">

      {/* LEFT PANEL */}
      <div className="w-[320px] bg-[#0f172a] border-r border-gray-800 flex flex-col">

        {/* HERO */}
        <div className="h-28 border-b border-gray-800">
          <HeroCanvas />
        </div>

        {/* CONTROLS */}
        <div className="p-4 flex flex-col gap-3 text-sm">

          {/* Source */}
          <button
            onClick={() => setSelectMode("source")}
            className={`px-3 py-2 rounded transition ${
              selectMode === "source"
                ? "bg-green-500 text-black"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            Set Source
          </button>

          {/* Destination */}
          <button
            onClick={() => setSelectMode("dest")}
            className={`px-3 py-2 rounded transition ${
              selectMode === "dest"
                ? "bg-green-500 text-black"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            Set Destination
          </button>

          {/* Compute */}
          <button
            onClick={compute}
            disabled={!source || !dest || loading}
            className="px-3 py-2 bg-blue-500 rounded hover:bg-blue-400 disabled:opacity-40"
          >
            {loading ? "Computing..." : "Compute"}
          </button>

          {/* DEBUG */}
          <div className="text-xs text-gray-400 mt-2">
            Source:{" "}
            {source
              ? `${source.lat.toFixed(3)}, ${source.lng.toFixed(3)}`
              : "Not set"}
          </div>

          <div className="text-xs text-gray-400">
            Dest:{" "}
            {dest
              ? `${dest.lat.toFixed(3)}, ${dest.lng.toFixed(3)}`
              : "Not set"}
          </div>

          {/* MODE SWITCH (now actually used) */}
          {data && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setMode("fuel")}
                className={`flex-1 py-2 rounded ${
                  mode === "fuel"
                    ? "bg-green-500 text-black"
                    : "bg-gray-700"
                }`}
              >
                Fuel
              </button>

              <button
                onClick={() => setMode("short")}
                className={`flex-1 py-2 rounded ${
                  mode === "short"
                    ? "bg-blue-500"
                    : "bg-gray-700"
                }`}
              >
                Shortest
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1">
        <MapView
          source={source}
          dest={dest}
          fuelRoute={data?.fuel_optimized?.route}
          shortRoute={data?.shortest?.route}
          activeMode={mode}
          onMapClick={handleClick}
        />
      </div>
    </div>
  );
}