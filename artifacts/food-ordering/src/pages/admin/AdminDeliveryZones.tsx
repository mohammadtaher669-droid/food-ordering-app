import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Save, Trash2, Navigation, Circle, PenLine, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { restaurantStore, branchStore } from "@/lib/store";
import type { Branch } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { useToast } from "@/hooks/use-toast";
import { haversineDistance } from "@/lib/deliveryZones";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, TileLayer, Circle as LeafletCircle, Polygon, Marker, useMapEvents, useMap } from "react-leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753];
const DEFAULT_ZOOM = 11;

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

interface ZoneState {
  is_delivery_enabled: boolean;
  delivery_type: "radius" | "polygon";
  center_lat: number | null;
  center_lng: number | null;
  delivery_radius_km: number;
  polygon_coordinates: { lat: number; lng: number }[];
}

function defaultZone(branch: Branch): ZoneState {
  return {
    is_delivery_enabled: branch.is_delivery_enabled ?? false,
    delivery_type: branch.delivery_type ?? "radius",
    center_lat: branch.center_lat ?? null,
    center_lng: branch.center_lng ?? null,
    delivery_radius_km: branch.delivery_radius_km ?? 5,
    polygon_coordinates: branch.polygon_coordinates ?? [],
  };
}

export default function AdminDeliveryZones() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const restaurants = useStore(useCallback(() => restaurantStore.getAll(), []));
  const branches = useStore(useCallback(() => branchStore.getAll(), []));

  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [zone, setZone] = useState<ZoneState>({
    is_delivery_enabled: false,
    delivery_type: "radius",
    center_lat: null,
    center_lng: null,
    delivery_radius_km: 5,
    polygon_coordinates: [],
  });

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  useEffect(() => {
    if (selectedBranch) setZone(defaultZone(selectedBranch));
  }, [selectedBranchId]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!zone.is_delivery_enabled) return;
    if (zone.delivery_type === "radius") {
      setZone((z) => ({ ...z, center_lat: lat, center_lng: lng }));
    } else {
      setZone((z) => ({ ...z, polygon_coordinates: [...z.polygon_coordinates, { lat, lng }] }));
    }
  };

  const handleSave = () => {
    if (!selectedBranch) return;
    const updated: Branch = {
      ...selectedBranch,
      is_delivery_enabled: zone.is_delivery_enabled,
      delivery_type: zone.delivery_type,
      center_lat: zone.center_lat ?? undefined,
      center_lng: zone.center_lng ?? undefined,
      delivery_radius_km: zone.delivery_radius_km,
      polygon_coordinates: zone.polygon_coordinates,
    };
    branchStore.save(updated);
    toast({ title: t("Delivery zone saved!", "تم حفظ منطقة التوصيل!") });
  };

  const mapCenter: [number, number] =
    zone.center_lat != null && zone.center_lng != null
      ? [zone.center_lat, zone.center_lng]
      : selectedBranch?.center_lat != null
      ? [selectedBranch.center_lat, selectedBranch.center_lng!]
      : DEFAULT_CENTER;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-foreground mb-1">{t("📍 Delivery Zones", "📍 مناطق التوصيل")}</h1>
        <p className="text-sm text-muted-foreground">{t("Define delivery areas per branch using radius or polygon.", "حدد مناطق التوصيل لكل فرع باستخدام دائرة أو مضلع.")}</p>
      </motion.div>

      <div className="bg-card border border-white/5 rounded-2xl p-4 space-y-3">
        <label className="text-xs text-muted-foreground block mb-1">{t("Select Branch", "اختر الفرع")}</label>
        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="w-full bg-background border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none"
          data-testid="select-branch-zone"
        >
          <option value="">{t("-- Choose a branch --", "-- اختر فرعاً --")}</option>
          {restaurants.map((r) => (
            <optgroup key={r.id} label={t(r.name_en, r.name_ar)}>
              {branches.filter((b) => b.restaurant_id === r.id).map((b) => (
                <option key={b.id} value={b.id}>{t(b.name_en, b.name_ar)}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {selectedBranch && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card border border-white/5 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{t("Enable Delivery Zone", "تفعيل منطقة التوصيل")}</span>
              <button
                onClick={() => setZone((z) => ({ ...z, is_delivery_enabled: !z.is_delivery_enabled }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${zone.is_delivery_enabled ? "bg-primary" : "bg-white/10"}`}
                data-testid="toggle-delivery-enabled"
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${zone.is_delivery_enabled ? "right-0.5" : "left-0.5"}`} />
              </button>
            </div>

            {zone.is_delivery_enabled && (
              <>
                <div className="flex gap-2">
                  {(["radius", "polygon"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setZone((z) => ({ ...z, delivery_type: type }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition ${zone.delivery_type === type ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground"}`}
                      data-testid={`btn-mode-${type}`}
                    >
                      {type === "radius" ? <Circle size={14} /> : <PenLine size={14} />}
                      {type === "radius" ? t("Radius", "دائرة") : t("Polygon", "مضلع")}
                    </button>
                  ))}
                </div>

                {zone.delivery_type === "radius" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t("Delivery radius", "نطاق التوصيل")}</span>
                      <span className="font-mono text-primary font-bold">{zone.delivery_radius_km} km</span>
                    </div>
                    <input
                      type="range" min={1} max={30} step={0.5}
                      value={zone.delivery_radius_km}
                      onChange={(e) => setZone((z) => ({ ...z, delivery_radius_km: Number(e.target.value) }))}
                      className="w-full accent-primary"
                      data-testid="input-radius-km"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Navigation size={11} />
                      {zone.center_lat != null
                        ? t("Center set — click map to change it", "تم تحديد المركز — انقر على الخريطة لتغييره")
                        : t("Click on the map to set the center", "انقر على الخريطة لتحديد المركز")}
                    </div>
                  </div>
                )}

                {zone.delivery_type === "polygon" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Info size={11} />
                        {t(`${zone.polygon_coordinates.length} point(s) — click map to add`, `${zone.polygon_coordinates.length} نقطة — انقر الخريطة للإضافة`)}
                      </div>
                      {zone.polygon_coordinates.length > 0 && (
                        <button
                          onClick={() => setZone((z) => ({ ...z, polygon_coordinates: [] }))}
                          className="text-xs text-destructive/70 hover:text-destructive flex items-center gap-1"
                          data-testid="btn-clear-polygon"
                        >
                          <Trash2 size={11} /> {t("Clear", "مسح")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 380 }}>
            <MapContainer
              center={mapCenter}
              zoom={DEFAULT_ZOOM}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={handleMapClick} />
              <RecenterMap center={mapCenter} zoom={DEFAULT_ZOOM} />

              {zone.is_delivery_enabled && zone.delivery_type === "radius" && zone.center_lat != null && zone.center_lng != null && (
                <>
                  <Marker position={[zone.center_lat, zone.center_lng]} />
                  <LeafletCircle
                    center={[zone.center_lat, zone.center_lng]}
                    radius={zone.delivery_radius_km * 1000}
                    pathOptions={{ color: "#FF7A00", fillColor: "#FF7A00", fillOpacity: 0.12, weight: 2 }}
                  />
                </>
              )}

              {zone.is_delivery_enabled && zone.delivery_type === "polygon" && zone.polygon_coordinates.length > 0 && (
                <>
                  {zone.polygon_coordinates.map((pt, i) => (
                    <Marker key={i} position={[pt.lat, pt.lng]} />
                  ))}
                  {zone.polygon_coordinates.length >= 3 && (
                    <Polygon
                      positions={zone.polygon_coordinates.map((p) => [p.lat, p.lng])}
                      pathOptions={{ color: "#FF7A00", fillColor: "#FF7A00", fillOpacity: 0.12, weight: 2 }}
                    />
                  )}
                </>
              )}
            </MapContainer>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition flex items-center justify-center gap-2"
            data-testid="btn-save-zone"
          >
            <Save size={15} />
            {t("Save Delivery Zone", "حفظ منطقة التوصيل")}
          </button>
        </motion.div>
      )}

      {branches.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("No branches yet. Add a branch first.", "لا توجد فروع بعد. أضف فرعاً أولاً.")}</p>
        </div>
      )}
    </div>
  );
}
