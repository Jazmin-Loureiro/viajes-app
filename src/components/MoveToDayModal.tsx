"use client";

import React, { useState, useEffect } from "react";
import { BloqueHorario, PlanViaje } from "@/lib/supabase";
import { X, Calendar, Clock, Loader2 } from "lucide-react";

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

const BLOQUES: { id: BloqueHorario; label: string; icon: string }[] = [
  { id: "mañana", label: "Mañana", icon: "☀️" },
  { id: "mediodia", label: "Mediodía", icon: "🍽️" },
  { id: "tarde", label: "Tarde", icon: "🌤️" },
  { id: "cena", label: "Cena", icon: "🍷" },
  { id: "noche", label: "Noche", icon: "🌙" },
];

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
      setHorario(plan.horario || "");
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-md bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="pr-2">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Asignar al Itinerario</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[280px] mt-0.5">
              {plan.titulo}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
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
              className="text-xs font-semibold text-slate-700 flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Fecha del Plan</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="plan-fecha"
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-all"
            />
          </div>

          {/* Selector de Bloque Horario */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <span>Momento del Día</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BLOQUES.map((b) => {
                const isSelected = bloque === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBloque(b.id)}
                    className={`h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                  >
                    <span>{b.icon}</span>
                    <span>{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hora específica opcional */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="plan-horario"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Hora específica (opcional, ej. 20:30)</span>
            </label>
            <input
              id="plan-horario"
              type="text"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              placeholder="Ej. 20:30 o 14:00"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-all"
            />
          </div>

          {/* Botón de Confirmación */}
          <button
            type="submit"
            disabled={!fecha || isSubmitting}
            className="h-12 w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm"
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
