"use client";

import React from "react";
import { PlanViaje, CategoriaPlan } from "@/lib/supabase";
import {
  MapPin,
  ExternalLink,
  Check,
  Calendar,
  Trash2,
  Clock,
  Pencil,
} from "lucide-react";

export interface PlanCardProps {
  plan: PlanViaje;
  onToggleCompletado?: (id: string, completado: boolean) => void;
  onEliminar?: (id: string) => void;
  onAsignarItinerario?: (plan: PlanViaje) => void;
  onDescartarAideas?: (id: string) => void;
  onEditar?: (plan: PlanViaje) => void;
}

const CATEGORIA_CONFIG: Record<
  string,
  { label: string; emoji: string; badgeClass: string }
> = {
  comida: {
    label: "Comida",
    emoji: "🍽️",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/70",
  },
  paseo: {
    label: "Paseo",
    emoji: "🌳",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
  },
  cine_show: {
    label: "Cine / Show",
    emoji: "🎬",
    badgeClass: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200/70",
  },
  compras: {
    label: "Compras",
    emoji: "🛍️",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200/70",
  },
  alojamiento: {
    label: "Alojamiento",
    emoji: "🏨",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200/70",
  },
  transporte: {
    label: "Transporte",
    emoji: "🚇",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200/70",
  },
};

const resolveCategoria = (cat: string) => {
  if (CATEGORIA_CONFIG[cat]) {
    return CATEGORIA_CONFIG[cat];
  }
  const match = cat.match(
    /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*(.*)$/u,
  );
  if (match) {
    return {
      label: match[2] || match[1],
      emoji: match[1],
      badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200/70",
    };
  }
  return {
    label: cat,
    emoji: "🏷️",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200/70",
  };
};

const getMapsUrl = (plan: PlanViaje): string => {
  if (
    plan.link_maps &&
    (plan.link_maps.startsWith("http://") ||
      plan.link_maps.startsWith("https://"))
  ) {
    return plan.link_maps;
  }

  const ubi = (plan.ubicacion || "").trim();
  if (ubi.startsWith("http://") || ubi.startsWith("https://")) {
    return ubi;
  }

  if (ubi) {
    const terminoBusqueda = `${plan.titulo || ""} ${ubi}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      terminoBusqueda,
    )}`;
  }

  const tituloTermino = (plan.titulo || "").trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    tituloTermino,
  )}`;
};

export default function PlanCard({
  plan,
  onToggleCompletado,
  onEliminar,
  onAsignarItinerario,
  onDescartarAideas,
  onEditar,
}: PlanCardProps) {
  const categoriaInfo = resolveCategoria(plan.categoria);
  const hasUbicacion = Boolean(plan.ubicacion && plan.ubicacion.trim());
  const hasLinkMaps = Boolean(plan.link_maps && plan.link_maps.trim());
  const mapsUrl = getMapsUrl(plan);

  const hasBottomActions =
    (onAsignarItinerario && !plan.fecha) ||
    (onDescartarAideas && Boolean(plan.fecha)) ||
    Boolean(onEditar) ||
    Boolean(onEliminar);

  return (
    <div
      className={`rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border flex flex-col gap-2.5 ${
        plan.completado
          ? "opacity-60 bg-slate-50/80 border-slate-200"
          : "bg-white border-slate-100"
      }`}
    >
      {/* Cabecera: Categoría, Horario y Check de completado */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoriaInfo.badgeClass}`}
          >
            <span>{categoriaInfo.emoji}</span>
            <span>{categoriaInfo.label}</span>
          </span>

          {plan.horario && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100/90 text-slate-600 border border-slate-200/60">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{plan.horario}</span>
            </span>
          )}
        </div>

        {onToggleCompletado && (
          <button
            type="button"
            onClick={() => onToggleCompletado(plan.id, !plan.completado)}
            aria-label={
              plan.completado
                ? "Marcar como pendiente"
                : "Marcar como completado"
            }
            title={
              plan.completado
                ? "Marcar como pendiente"
                : "Marcar como completado"
            }
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
              plan.completado
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "border-2 border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-500"
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Título */}
      <h3
        className={`font-semibold text-base leading-tight transition-colors ${
          plan.completado ? "line-through text-slate-400" : "text-slate-800"
        }`}
      >
        {plan.titulo}
      </h3>

      {/* Ubicación y acceso inteligente a Google Maps (siempre disponible si hay título o ubicación) */}
      {Boolean(plan.titulo || hasUbicacion || hasLinkMaps) && (
        <div className="flex items-center">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100/80 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200/60 transition-all group cursor-pointer max-w-full"
            title="Abrir en Google Maps"
          >
            <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
            <span className="truncate">
              {hasUbicacion ? plan.ubicacion : "Buscar en Maps"}
            </span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-60 group-hover:opacity-100 text-slate-400 group-hover:text-indigo-500 transition-all" />
          </a>
        </div>
      )}

      {/* Descripción / Tips */}
      {plan.descripcion && (
        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-xl leading-relaxed whitespace-pre-wrap">
          {plan.descripcion}
        </p>
      )}

      {/* Barra inferior de acciones */}
      {hasBottomActions && (
        <div className="flex items-center gap-2 pt-1 mt-auto">
          {onAsignarItinerario && !plan.fecha && (
            <button
              type="button"
              onClick={() => onAsignarItinerario(plan)}
              className="h-10 min-h-[40px] px-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors flex-1 shadow-sm"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Asignar al Itinerario</span>
            </button>
          )}

          {onDescartarAideas && plan.fecha && (
            <button
              type="button"
              onClick={() => onDescartarAideas(plan.id)}
              className="h-10 min-h-[40px] px-3.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs sm:text-sm font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors flex-1"
            >
              <span>Volver a ideas</span>
            </button>
          )}

          {onEditar && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditar(plan);
              }}
              aria-label="Editar plan"
              title="Editar plan"
              className="h-10 w-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          {onEliminar && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `¿Seguro que deseas eliminar "${plan.titulo}"?`,
                  )
                ) {
                  onEliminar(plan.id);
                }
              }}
              aria-label="Eliminar plan"
              title="Eliminar plan"
              className="h-10 w-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
