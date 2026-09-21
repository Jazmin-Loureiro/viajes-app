"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PlanViaje, BloqueHorario, CategoriaPlan } from "@/lib/supabase";
import PlanCard from "./PlanCard";
import { useWeatherForecast, WeatherStrip, WeatherPill } from "./WeatherWidget";
import { Calendar, Sun, Utensils, Sunset, Wine, Moon } from "lucide-react";

export interface ItineraryViewProps {
  planes: PlanViaje[];
  selectedCategory: CategoriaPlan | "todos";
  onToggleCompletado: (id: string, completado: boolean) => void;
  onEliminar: (id: string) => void;
  onDescartarAideas: (id: string) => void;
  onEditar?: (plan: PlanViaje) => void;
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

const formatFullDateLabel = (dateStr: string) => {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleDateString("es-ES", { weekday: "short" });
    const dayNum = date.getDate();
    const monthStr = date
      .toLocaleDateString("es-ES", { month: "short" })
      .replace(".", "");
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${dayNum} ${monthStr}`;
  } catch {
    return dateStr;
  }
};

const parseTimeToMinutes = (timeStr: string): number => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  return 9999;
};

const compareHorarios = (planA: PlanViaje, planB: PlanViaje): number => {
  const horaA = (planA.horario || (planA as any).hora || "").trim();
  const horaB = (planB.horario || (planB as any).hora || "").trim();

  const hasA = Boolean(horaA);
  const hasB = Boolean(horaB);

  if (!hasA && !hasB) return 0;
  if (!hasA) return 1; // Planes sin hora quedan al final del bloque
  if (!hasB) return -1;

  const minA = parseTimeToMinutes(horaA);
  const minB = parseTimeToMinutes(horaB);

  if (minA !== minB) {
    return minA - minB;
  }

  return horaA.localeCompare(horaB);
};

export default function ItineraryView({
  planes,
  selectedCategory,
  onToggleCompletado,
  onEliminar,
  onDescartarAideas,
  onEditar,
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

  // Clima en CABA con Open-Meteo
  const {
    forecast,
    loading: weatherLoading,
    getWeatherForDate,
  } = useWeatherForecast();
  const selectedDayWeather = getWeatherForDate(selectedDate);

  useEffect(() => {
    if (uniqueDates.length > 0 && !uniqueDates.includes(selectedDate)) {
      setSelectedDate(uniqueDates[0]);
    }
  }, [uniqueDates, selectedDate]);

  // Filtrar planes para el día seleccionado y categoría activa
  const dayPlans = useMemo(() => {
    return planes.filter((p) => {
      if (p.fecha !== selectedDate) return false;
      if (selectedCategory !== "todos" && p.categoria !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [planes, selectedDate, selectedCategory]);

  // Planes de jornada completa / todo el día para la fecha y categoría seleccionada
  const planesTodoElDia = useMemo(() => {
    return dayPlans
      .filter((p) => p.bloque === "todo_el_dia")
      .sort(compareHorarios);
  }, [dayPlans]);

  // Planes que tengan la fecha seleccionada pero sin bloque asignado o desconocido
  const planesSinBloque = useMemo(() => {
    return dayPlans
      .filter(
        (p) =>
          !p.bloque ||
          (!BLOQUES.some((b) => b.id === p.bloque) &&
            p.bloque !== "todo_el_dia"),
      )
      .sort(compareHorarios);
  }, [dayPlans]);

  const displayedDates = uniqueDates.length > 0 ? uniqueDates : [selectedDate];

  return (
    <div className="flex flex-col min-h-full">
      {/* Selector superior horizontal de fechas/días con scroll suave */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2.5 bg-white/70 backdrop-blur-sm border-b border-slate-100 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {displayedDates.map((dateStr, index) => {
          const isSelected = dateStr === selectedDate;
          const dayWeather = getWeatherForDate(dateStr);
          const countForDate = planes.filter((p) => {
            if (p.fecha !== dateStr) return false;
            if (
              selectedCategory !== "todos" &&
              p.categoria !== selectedCategory
            ) {
              return false;
            }
            return true;
          }).length;

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
                {dayWeather && (
                  <span
                    className="text-[11px] select-none"
                    title={`${dayWeather.label} (${Math.round(dayWeather.maxTemp)}° / ${Math.round(dayWeather.minTemp)}°)`}
                  >
                    {dayWeather.emoji}
                  </span>
                )}
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

      {/* Barra horizontal sutil con el pronóstico extendido en CABA */}
      <WeatherStrip
        forecast={forecast}
        loading={weatherLoading}
        selectedDate={selectedDate}
        onSelectDate={(d) => {
          if (uniqueDates.includes(d)) {
            setSelectedDate(d);
          }
        }}
      />

      {/* Contenido según si hay planes para la fecha y categoría seleccionada */}
      {dayPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center pb-28">
          {/* Cabecera del día con pastilla de clima */}
          <div className="flex items-center gap-2 mb-4 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-800 capitalize">
              {formatFullDateLabel(selectedDate)}
            </span>
            {selectedDayWeather && <WeatherPill weather={selectedDayWeather} />}
          </div>

          {selectedCategory !== "todos" ? (
            <>
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Calendar className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                No hay planes en esta categoría para este día
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Prueba seleccionando otra categoría o &quot;Todos&quot; para ver
                las actividades programadas.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                <Calendar className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                No hay planes para este día
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Ve a la <strong>Bolsa de Ideas</strong> y presiona &quot;Asignar
                al Itinerario&quot; para organizar tus actividades.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6 pb-28 pt-3 px-4 max-w-2xl mx-auto w-full">
          {/* Encabezado del día seleccionado con pastilla de clima */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 capitalize">
                {formatFullDateLabel(selectedDate)}
              </h2>
              {selectedDayWeather && (
                <WeatherPill weather={selectedDayWeather} />
              )}
            </div>
            <span className="text-xs font-medium text-slate-400 shrink-0">
              {dayPlans.length} {dayPlans.length === 1 ? "plan" : "planes"}
            </span>
          </div>

          {/* Sección destacada para actividades de jornada completa / todo el día */}
          {planesTodoElDia.length > 0 && (
            <section className="space-y-2.5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">☀️</span>
                  <h3 className="text-sm font-bold text-amber-950">
                    Planes de todo el día / Jornada larga
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                  {planesTodoElDia.length}
                </span>
              </div>
              <div className="space-y-3 pt-1">
                {planesTodoElDia.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onToggleCompletado={onToggleCompletado}
                    onEliminar={onEliminar}
                    onDescartarAideas={onDescartarAideas}
                    onEditar={onEditar}
                  />
                ))}
              </div>
            </section>
          )}

          {BLOQUES.map((b) => {
            const planesDelBloque = dayPlans
              .filter((p) => p.bloque === b.id)
              .sort(compareHorarios);
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

                {/* Tarjetas del bloque ordenadas por horario */}
                <div className="space-y-3">
                  {planesDelBloque.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      onToggleCompletado={onToggleCompletado}
                      onEliminar={onEliminar}
                      onDescartarAideas={onDescartarAideas}
                      onEditar={onEditar}
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
                    onEditar={onEditar}
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
