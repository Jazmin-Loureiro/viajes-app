"use client";

import React, { useState, useEffect } from "react";
import { BloqueHorario, PlanViaje } from "@/lib/supabase";
import {
  X,
  Calendar,
  Clock,
  Loader2,
  Sunrise,
  Sun,
  Sunset,
  Wine,
  Moon,
  SunMedium,
} from "lucide-react";

export interface MoveToDayModalProps {
  isOpen: boolean;
  plan: PlanViaje | null;
  onClose: () => void;
  onConfirm: (
    id: string,
    fecha: string,
    bloque: BloqueHorario,
    horario?: string,
  ) => Promise<void> | void;
}

interface BloqueModalConfig {
  id: BloqueHorario;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const BLOQUES: BloqueModalConfig[] = [
  { id: "todo_el_dia", label: "Todo el día", icon: SunMedium },
  { id: "mañana", label: "Mañana", icon: Sunrise },
  { id: "mediodia", label: "Mediodía", icon: Sun },
  { id: "tarde", label: "Tarde", icon: Sunset },
  { id: "cena", label: "Cena", icon: Wine },
  { id: "noche", label: "Noche", icon: Moon },
];

const HORAS_DISPONIBLES: { value: string; label: string }[] = (() => {
  const options: { value: string; label: string }[] = [
    { value: "", label: "Sin hora fija" },
  ];
  for (let hour = 8; hour <= 23; hour++) {
    for (const min of [0, 30]) {
      const hStr = String(hour).padStart(2, "0");
      const mStr = String(min).padStart(2, "0");
      const timeStr = `${hStr}:${mStr} hs`;
      options.push({ value: timeStr, label: timeStr });
    }
  }
  return options;
})();

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function MoveToDayModal({
  isOpen,
  plan,
  onClose,
  onConfirm,
}: MoveToDayModalProps) {
  const [fecha, setFecha] = useState("");
  const [bloque, setBloque] = useState<BloqueHorario>("mañana");
  const [horario, setHorario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (plan && isOpen) {
      setFecha(plan.fecha || getTodayString());
      setBloque(plan.bloque || "mañana");
      let initialHorario = plan.horario || "";
      if (initialHorario && !initialHorario.includes("hs")) {
        const withHs = `${initialHorario} hs`;
        if (HORAS_DISPONIBLES.some((h) => h.value === withHs)) {
          initialHorario = withHs;
        }
      }
      setHorario(initialHorario);
    }
  }, [plan, isOpen]);

  if (!isOpen || !plan) return null;

  const handleClose = () => {
    setIsSubmitting(false);
    onClose();
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !fecha || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onConfirm(plan.id, fecha, bloque, horario.trim() || undefined);
      handleClose();
    } catch (error) {
      console.error("Error al mover plan al itinerario:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasCustomHorario = Boolean(
    horario && !HORAS_DISPONIBLES.some((opt) => opt.value === horario),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-md bg-surface shadow-xl max-h-[90vh] overflow-y-auto border border-borderSubtle/60">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-3 border-b border-borderSubtle">
          <div className="pr-2">
            <h2 className="text-base font-bold text-content-main flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand" />
              <span>Asignar al Itinerario</span>
            </h2>
            <p className="text-xs text-content-muted font-medium truncate max-w-[280px] mt-0.5">
              {plan.titulo}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-content-muted hover:text-content-main hover:bg-app transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleConfirm} className="flex flex-col gap-4 pt-4">
          {/* Selector de Fecha */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="plan-fecha"
              className="text-xs font-semibold text-content-main flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-content-muted" />
              <span>Fecha del Plan</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="plan-fecha"
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full p-3 rounded-xl border border-borderSubtle bg-app text-content-main text-sm font-medium focus:bg-surface focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
            />
          </div>

          {/* Selector de Bloque Horario */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-content-main flex items-center gap-1">
              <span>Momento del Día</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BLOQUES.map((b) => {
                const isSelected = bloque === b.id;
                const BloqueIcon = b.icon;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBloque(b.id)}
                    className={`h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? "bg-brand border-brand text-white shadow-xs"
                        : "bg-app border-borderSubtle text-content-main hover:bg-borderSubtle/60 active:bg-borderSubtle"
                    }`}
                  >
                    <BloqueIcon
                      className="w-4 h-4 shrink-0"
                      strokeWidth={1.75}
                    />
                    <span>{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Horario (Select nativo estilizado) */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="plan-horario"
              className="text-xs font-semibold text-content-main flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5 text-content-muted" />
              <span>Horario específico</span>
            </label>
            <div className="relative">
              <select
                id="plan-horario"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="w-full p-3 pr-10 rounded-xl border border-borderSubtle bg-app text-content-main text-sm font-medium focus:bg-surface focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all cursor-pointer appearance-none"
              >
                {HORAS_DISPONIBLES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                {hasCustomHorario && <option value={horario}>{horario}</option>}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-content-muted">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Botón de Confirmación */}
          <button
            type="submit"
            disabled={!fecha || isSubmitting}
            className="h-12 w-full mt-2 bg-brand hover:bg-brand-hover active:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Moviendo...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>Mover al Itinerario</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
