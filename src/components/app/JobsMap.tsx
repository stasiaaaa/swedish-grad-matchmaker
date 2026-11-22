import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import { CITY_VIEWS, SWEDEN_VIEW, roleColor, type Bounds, type MapCompany, type MapJob } from "@/lib/map-data";

type Props = {
  jobs: MapJob[];
  companies: MapCompany[];
  showWatched: boolean;
  focusCity: string | null;
  onMove: (b: Bounds) => void;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export default function JobsMap({ jobs, companies, showWatched, focusCity, onMove }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const jobLayer = useRef<L.MarkerClusterGroup | null>(null);
  const watchLayer = useRef<L.LayerGroup | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { scrollWheelZoom: true, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 120, wheelDebounceTime: 20, inertia: true, inertiaDeceleration: 2500, zoomAnimation: true, fadeAnimation: true, markerZoomAnimation: true }).setView(SWEDEN_VIEW.center, SWEDEN_VIEW.zoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
      keepBuffer: 4,
      updateWhenZooming: false,
      detectRetina: true,
    }).addTo(m);
    const emit = () => {
      const b = m.getBounds();
      onMoveRef.current({ n: b.getNorth(), s: b.getSouth(), e: b.getEast(), w: b.getWest() });
    };
    m.on("moveend", emit);
    jobLayer.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      chunkedLoading: true,
      animate: true,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
      iconCreateFunction: (c) => L.divIcon({ html: `<div class="lp-cluster">${c.getChildCount()}</div>`, className: "", iconSize: [38, 38] }),
    }).addTo(m);
    watchLayer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  const jobKey = useRef("");
  useEffect(() => {
    const layer = jobLayer.current;
    if (!layer) return;
    // Only rebuild pins when the set of jobs actually changes (avoids flicker while panning).
    const key = jobs.map((j) => j.id).join(",");
    if (key === jobKey.current) return;
    jobKey.current = key;
    layer.clearLayers();
    const markers: L.Marker[] = [];
    for (const j of jobs) {
      const icon = L.divIcon({ html: `<div class="lp-pin" style="background:${roleColor(j.role)}"></div>`, className: "", iconSize: [18, 18] });
      const m = L.marker([j.lat, j.lng], { icon })
        .bindPopup(`<div style="min-width:180px"><div style="font-size:11px;opacity:.7">${esc(j.role)}</div><strong>${esc(j.title)}</strong><div>${esc(j.company)} · ${esc(j.label)}</div><a href="/jobs/${j.id}" style="display:inline-block;margin-top:6px;font-weight:600">View details →</a></div>`);
      markers.push(m);
    }
    layer.addLayers(markers);
  }, [jobs]);

  useEffect(() => {
    const layer = watchLayer.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showWatched) return;
    for (const c of companies) {
      const color = roleColor(c.roles[0] ?? "");
      const icon = L.divIcon({ html: `<div class="lp-pin-hollow" style="border-color:${color}"></div>`, className: "", iconSize: [18, 18] });
      L.marker([c.lat, c.lng], { icon })
        .bindPopup(`<div><div style="font-size:11px;opacity:.7">Watched company · no open roles</div><strong>${esc(c.name)}</strong><div>${esc(c.industry)}</div><a href="/companies/${c.slug}" style="display:inline-block;margin-top:6px;font-weight:600">View company →</a></div>`)
        .addTo(layer);
    }
  }, [companies, showWatched]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const v = focusCity ? CITY_VIEWS[focusCity] : null;
    if (v) m.flyTo(v.center, v.zoom, { duration: 1.2, easeLinearity: 0.2 });
    else m.flyTo(SWEDEN_VIEW.center, SWEDEN_VIEW.zoom, { duration: 1.2, easeLinearity: 0.2 });
  }, [focusCity]);

  return <div ref={el} className="h-full w-full" />;
}
