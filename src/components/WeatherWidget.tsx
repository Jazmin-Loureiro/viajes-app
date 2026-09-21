"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CloudSun, Loader2 } from "lucide-react";

export interface WeatherDay {
  date: string; // "YYYY-MM-DD"
  code: number;
  maxTemp: number;
  minTemp: number;
  emoji: string;
  label: string;
}

export function getWeatherInfo(code: number): { emoji: string; label: string } {
  if (code === 0 || code === 1) {
    return { emoji: "☀️", label: "Soleado" };
  }
  if (code === 2 || code === 3) {
    return { emoji: "⛅", label: "Nublado" };
  }
  if (code === 45 || code === 48) {
    return { emoji: "🌫️", label: "Neblina" };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { emoji: "🌧️", label: "Lluvia" };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return { emoji: "❄️", label: "Nieve / Frío" };
  }
  if (code >= 95 && code <= 99) {
    return { emoji: "⛈️", label: "Tormenta" };
  }
  return { emoji: "🌤️", label: "Variable" };
}

export function formatWeatherDayName(dateStr: string): string {
  try {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    if (dateStr === todayStr) return "Hoy";
    if (dateStr === tomorrowStr) return "Mañ";

    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayName = date
      .toLocaleDateString("es-AR", { weekday: "short" })
      .replace(".", "");
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${d}`;
  } catch {
    return dateStr;
  }
}

// In-memory cache to prevent unnecessary repeat fetches across component re-renders
let cachedForecast: WeatherDay[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function useWeatherForecast() {
  const [forecast, setForecast] = useState<WeatherDay[]>(
    () => cachedForecast || [],
  );
  const [loading, setLoading] = useState<boolean>(!cachedForecast);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    if (cachedForecast && now - lastFetchTime < CACHE_DURATION_MS) {
      setForecast(cachedForecast);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchWeather() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America%2FArgentina%2FBuenos_Aires",
        );
        if (!res.ok) throw new Error("No se pudo obtener el clima");
        const data = await res.json();

        if (data?.daily?.time && Array.isArray(data.daily.time)) {
          const days: WeatherDay[] = data.daily.time.map(
            (timeStr: string, i: number) => {
              const code = data.daily.weather_code[i] ?? 0;
              const { emoji, label } = getWeatherInfo(code);
              return {
                date: timeStr,
                code,
                maxTemp: data.daily.temperature_2m_max[i] ?? 0,
                minTemp: data.daily.temperature_2m_min[i] ?? 0,
                emoji,
                label,
              };
            },
          );

          cachedForecast = days;
          lastFetchTime = Date.now();

          if (isMounted) {
            setForecast(days);
          }
        }
      } catch (err: unknown) {
        console.error("Error al cargar pronóstico de Open-Meteo:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Error al consultar clima",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  const getWeatherForDate = useCallback(
    (dateStr: string): WeatherDay | undefined => {
      return forecast.find((d) => d.date === dateStr);
    },
    [forecast],
  );

  return { forecast, loading, error, getWeatherForDate };
}

export interface WeatherStripProps {
  forecast: WeatherDay[];
  loading?: boolean;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

export function WeatherStrip({
  forecast,
  loading,
  selectedDate,
  onSelectDate,
}: WeatherStripProps) {
  if (loading && forecast.length === 0) {
    return (
      <div className="px-4 py-2 flex items-center gap-2 text-xs text-slate-400 bg-slate-50/60 border-b border-slate-100 animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
        <span>Consultando pronóstico en CABA...</span>
      </div>
    );
  }

  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="bg-slate-50/90 border-b border-slate-100/90 py-2 px-4 transition-all">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          <CloudSun className="w-3.5 h-3.5 text-indigo-500" />
          <span>Pronóstico CABA</span>
        </div>
        <span className="text-[10px] text-slate-400">Próximos 7 días</span>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
        {forecast.map((day) => {
          const isSelected = day.date === selectedDate;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate?.(day.date)}
              className={`shrink-0 flex flex-col items-center justify-center min-w-[68px] py-1.5 px-2 rounded-xl border text-xs transition-all ${
                isSelected
                  ? "bg-white border-indigo-300 text-indigo-950 shadow-xs ring-2 ring-indigo-500/20"
                  : "bg-white/80 hover:bg-white border-slate-200/70 text-slate-700 hover:border-slate-300"
              }`}
              title={`${formatWeatherDayName(day.date)}: ${day.label}, Mín ${Math.round(day.minTemp)}° / Máx ${Math.round(day.maxTemp)}°`}
            >
              <span className="text-[10px] font-semibold text-slate-500 capitalize">
                {formatWeatherDayName(day.date)}
              </span>
              <span className="text-base my-0.5 select-none">{day.emoji}</span>
              <div className="flex items-center gap-0.5 text-[10px] font-medium text-slate-600">
                <span className="font-bold text-slate-800">
                  {Math.round(day.maxTemp)}°
                </span>
                <span className="text-slate-400 text-[9px]">/</span>
                <span className="text-slate-500 font-normal">
                  {Math.round(day.minTemp)}°
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface WeatherPillProps {
  weather?: WeatherDay | null;
  className?: string;
}

export function WeatherPill({ weather, className = "" }: WeatherPillProps) {
  if (!weather) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/70 shadow-2xs transition-all ${className}`}
      title={`${weather.label} en CABA · Mín ${Math.round(weather.minTemp)}°C / Máx ${Math.round(weather.maxTemp)}°C`}
    >
      <span className="text-sm leading-none">{weather.emoji}</span>
      <span>
        {Math.round(weather.maxTemp)}° / {Math.round(weather.minTemp)}°
      </span>
      <span className="text-[10px] font-normal text-sky-600/80 hidden sm:inline">
        ({weather.label})
      </span>
    </span>
  );
}
