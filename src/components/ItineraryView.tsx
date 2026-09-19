"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PlanViaje, BloqueHorario } from "@/lib/supabase";
import PlanCard from "./PlanCard";
import { Calendar, Sun, Utensils, Sunset, Wine, Moon } from "lucide-react";

export interface ItineraryViewProps {
  planes: PlanViaje[];
  onToggleCompletado: (id: string, completado: boolean) => void;
  onEliminar: (id: string) => void;
  onDescartarAideas: (id: string) => void;
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

const formatDateLabel = (dateStr: string) => {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const dayNum = date.getDate();
    const monthStr = date
      .toLocaleDateString("es-ES", { month: "short" })
      .replace(".", "");
    return `${dayNum} ${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)}`;
  } catch {
    return dateStr;
  }
};

export default function ItineraryView({
  planes,
  onToggleCompletado,
  onEliminar,
  onDescartarAideas,
}: ItineraryViewProps) {
  // Extraer fechas únicas ordenadas de forma ascendente
  const uniqueDates = useMemo(() => {
    const dates = Array.from(
      new Set(
        planes
          .map((p) => p.fecha)
          .filter((f): f is string => Boolean(f && f.trim())),
      ),
    ).sort((a, b) => a.localeCompare(b));
    return dates;
  }, [planes]);

  // Estado para la fecha seleccionada
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return uniqueDates[0] || getTodayString();
  });

  useEffect(() => {
    if (uniqueDates.length > 0 && !uniqueDates.includes(selectedDate)) {
      setSelectedDate(uniqueDates[0]);
    }
  }, [uniqueDates, selectedDate]);

  // Filtrar planes para el día seleccionado
  const dayPlans = useMemo(() => {
    return planes.filter((p) => p.fecha === selectedDate);
  }, [planes, selectedDate]);

  // Planes que tengan la fecha seleccionada pero sin bloque asignado o desconocido
  const planesSinBloque = useMemo(() => {
    return dayPlans.filter(
      (p) => !p.bloque || !BLOQUES.some((b) => b.id === p.bloque),
    );
  }, [dayPlans]);

  const displayedDates = uniqueDates.length > 0 ? uniqueDates : [selectedDate];

  return (
    <div className="flex flex-col min-h-full">
      {/* Selector superior horizontal de fechas/días con scroll suave */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2.5 bg-white/70 backdrop-blur-sm border-b border-slate-100 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {displayedDates.map((dateStr, index) => {
          const isSelected = dateStr === selectedDate;
          const countForDate = planes.filter((p) => p.fecha === dateStr).length;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`shrink-0 flex flex-col items-center justify-center min-w-[76px] py-1.5 px-3 rounded-xl border text-xs transition-all ${
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] uppercase font-semibold tracking-wider ${
                    isSelected ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  Día {index + 1}
                </span>
                {countForDate > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? "bg-emerald-400" : "bg-slate-300"
                    }`}
                  />
                )}
              </div>
              <span className="font-bold text-xs capitalize mt-0.5">
                {formatDateLabel(dateStr)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contenido según si hay planes para la fecha seleccionada */}
      {dayPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center pb-28">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
            <Calendar className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            No hay planes para este día
          </h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Ve a la <strong>Bolsa de Ideas</strong> y presiona &quot;Asignar al
            Itinerario&quot; para organizar tus actividades.
          </p>
        </div>
      ) : (
        <div className="space-y-6 pb-28 pt-3 px-4 max-w-2xl mx-auto w-full">
          {BLOQUES.map((b) => {
            const planesDelBloque = dayPlans.filter((p) => p.bloque === b.id);
            if (planesDelBloque.length === 0) return null;

            return (
              <section key={b.id} className="space-y-2.5">
                {/* Encabezado del bloque */}
                <div className="flex items-center gap-2">
                  <span className="text-base">{b.icon}</span>
                  <h3 className="text-sm font-bold text-slate-800 capitalize">
                    {b.label}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {planesDelBloque.length}
                  </span>
                </div>

                {/* Tarjetas del bloque */}
                <div className="space-y-3">
                  {planesDelBloque.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      onToggleCompletado={onToggleCompletado}
                      onEliminar={onEliminar}
                      onDescartarAideas={onDescartarAideas}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Bloque para planes sin bloque específico */}
          {planesSinBloque.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">📌</span>
                <h3 className="text-sm font-bold text-slate-800">
                  Otros momentos
                </h3>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {planesSinBloque.length}
                </span>
              </div>
              <div className="space-y-3">
                {planesSinBloque.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onToggleCompletado={onToggleCompletado}
                    onEliminar={onEliminar}
                    onDescartarAideas={onDescartarAideas}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
