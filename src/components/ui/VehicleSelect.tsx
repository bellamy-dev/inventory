import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Car, Package, ChevronDown } from "lucide-react";
import { Vehicle } from "../../types";

interface VehicleSelectProps {
  vehicles: Vehicle[];
  value: string;
  onChange: (vehicleId: string) => void;
  showStock?: boolean;
  stockLabel?: string;
  placeholder?: string;
}

export function VehicleSelect({
  vehicles,
  value,
  onChange,
  showStock = false,
  stockLabel = "Inventaire principal",
  placeholder,
}: VehicleSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const isStock = value === "__stock__";
  const selected = isStock ? null : vehicles.find((v) => v.id === value);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const scrollHandler = () => {
      if (open) updatePosition();
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", scrollHandler, true);
    window.addEventListener("resize", scrollHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", scrollHandler, true);
      window.removeEventListener("resize", scrollHandler);
    };
  }, [open]);

  return (
    <>
      <div className="relative">
        <label className="text-sm font-medium text-gta-text-dim mb-1.5 block">
          Véhicule destination
        </label>
        <button
          ref={triggerRef}
          type="button"
          className="gta-input flex items-center gap-3 w-full text-left cursor-pointer hover:border-gta-accent/50 transition-colors"
          onClick={() => setOpen(!open)}
        >
          {isStock ? (
            <>
              <div className="h-7 w-7 rounded-lg bg-gta-success/10 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-gta-success" />
              </div>
              <span className="truncate font-medium">{stockLabel}</span>
            </>
          ) : selected ? (
            <>
              {selected.imageUrl ? (
                <img src={selected.imageUrl} alt={selected.name} className="h-7 w-7 object-contain shrink-0 rounded-lg" />
              ) : (
                <div className="h-7 w-7 rounded-lg bg-gta-bg flex items-center justify-center shrink-0">
                  <Car className="h-4 w-4 text-gta-text-dim" />
                </div>
              )}
              <span className="truncate font-medium">{selected.name}</span>
              <span className="ml-auto text-xs text-gta-text-dim shrink-0">
                {selected.items.reduce((s, i) => s + i.quantity * i.itemType.weight, 0).toFixed(1)}/{selected.maxWeight}kg
              </span>
            </>
          ) : (
            <span className="text-gta-text-dim">{placeholder || "Sélectionner un véhicule"}</span>
          )}
          <ChevronDown className={`h-4 w-4 text-gta-text-dim shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] rounded-xl border border-gta-border/50 bg-gta-surface/95 backdrop-blur-xl shadow-2xl shadow-black/40 py-1.5 max-h-[280px] overflow-auto animate-in"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
          }}
        >
          {showStock && (
            <button
              type="button"
              className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-all duration-150 mx-1 rounded-lg ${
                isStock
                  ? "bg-gta-accent/15 text-gta-accent"
                  : "hover:bg-gta-surface-hover text-gta-text"
              }`}
              style={{ width: `calc(100% - 8px)` }}
              onClick={() => {
                onChange("__stock__");
                setOpen(false);
              }}
            >
              <div className="h-9 w-9 rounded-xl bg-gta-success/10 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-gta-success" />
              </div>
              <span className="font-medium">{stockLabel}</span>
              {isStock && (
                <div className="ml-auto h-2.5 w-2.5 rounded-full bg-gta-accent shrink-0" />
              )}
            </button>
          )}

          {showStock && vehicles.length > 0 && (
            <div className="mx-3 my-1 border-t border-gta-border/30" />
          )}

          {vehicles.map((v) => {
            const vWeight = v.items.reduce((s, i) => s + i.quantity * i.itemType.weight, 0);
            const fillPercent = v.maxWeight > 0 ? Math.min((vWeight / v.maxWeight) * 100, 100) : 0;
            const barColor = fillPercent < 50 ? "#22c55e" : fillPercent < 80 ? "#f59e0b" : "#ef4444";
            const itemCount = v.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <button
                key={v.id}
                type="button"
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-all duration-150 mx-1 rounded-lg ${
                  v.id === value
                    ? "bg-gta-accent/15 text-gta-accent"
                    : "hover:bg-gta-surface-hover text-gta-text"
                }`}
                style={{ width: `calc(100% - 8px)` }}
                onClick={() => {
                  onChange(v.id);
                  setOpen(false);
                }}
              >
                {v.imageUrl ? (
                  <img src={v.imageUrl} alt={v.name} className="h-9 w-9 object-contain shrink-0 rounded-xl" />
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-gta-bg flex items-center justify-center shrink-0">
                    <Car className="h-5 w-5 text-gta-text-dim" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{v.name}</span>
                    <span className="text-[11px] text-gta-text-dim bg-gta-bg/50 px-1.5 py-0.5 rounded-md">
                      {itemCount} obj
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-gta-border/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${fillPercent}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <span className="text-[10px] text-gta-text-dim shrink-0 tabular-nums">
                      {vWeight.toFixed(1)}/{v.maxWeight}kg
                    </span>
                  </div>
                </div>
                {v.id === value && (
                  <div className="h-2.5 w-2.5 rounded-full bg-gta-accent shrink-0" />
                )}
              </button>
            );
          })}

          {vehicles.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gta-text-dim">
              Aucun véhicule disponible
            </div>
          )}
        </div>,
        document.body
      )}

      <style>{`
        @keyframes animate-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-in {
          animation: animate-in 0.15s ease-out;
        }
      `}</style>
    </>
  );
}
