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
  UtensilsCrossed,
  Compass,
  Film,
  ShoppingBag,
  Hotel,
  Bus,
  Tag,
  Coffee,
  Beer,
  Camera,
  Music,
  Plane,
  Train,
  Heart,
  Utensils,
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
  {
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badgeClass: string;
  }
> = {
  comida: {
    label: "Comida",
    icon: UtensilsCrossed,
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  paseo: {
    label: "Paseo",
    icon: Compass,
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  cine_show: {
    label: "Cine / Show",
    icon: Film,
    badgeClass:
      "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30",
  },
  compras: {
    label: "Compras",
    icon: ShoppingBag,
    badgeClass:
      "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  alojamiento: {
    label: "Alojamiento",
    icon: Hotel,
    badgeClass:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  },
  transporte: {
    label: "Transporte",
    icon: Bus,
    badgeClass:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  },
};

const CUSTOM_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  coffee: Coffee,
  beer: Beer,
  camera: Camera,
  music: Music,
  plane: Plane,
  train: Train,
  heart: Heart,
  tag: Tag,
  utensils: Utensils,
};

const resolveCategoria = (cat: string) => {
  const lower = (cat || "").toLowerCase();
  if (CATEGORIA_CONFIG[lower]) {
    return {
      ...CATEGORIA_CONFIG[lower],
    };
  }

  // 1. Icono personalizado por prefijo (ej: "Coffee Cafeterías", "Beer Bares")
  const iconMatch = cat.match(
    /^(Coffee|Beer|Camera|Music|Plane|Train|Heart|Tag)[:\s]+(.*)$/i,
  );
  if (iconMatch) {
    const iconKey = iconMatch[1].toLowerCase();
    const IconComp = CUSTOM_ICON_MAP[iconKey] || Tag;
    const cleanLabel = iconMatch[2].trim() || iconMatch[1];
    return {
      label: cleanLabel,
      icon: IconComp,
      badgeClass:
        "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    };
  }

  // 2. Si tiene emoji guardado (como 🍕 en "Comida exótica"), sanitizar a vector puro
  const emojiMatch = cat.match(
    /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*(.*)$/u,
  );
  if (emojiMatch) {
    const rawEmoji = emojiMatch[1];
    const cleanLabel =
      (
        emojiMatch[2] ||
        cat.replace(
          /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*/u,
          "",
        )
      ).trim() || "Otra";
    const isFood =
      /[\u{1F354}-\u{1F37F}\u{1F950}-\u{1F96B}\u{2615}]/u.test(rawEmoji) ||
      /comida|pizza|cafe|café|bar|resto|restaurante|postre|helado|cena|almuerzo/i.test(
        cat,
      );
    return {
      label: cleanLabel,
      icon: isFood ? Utensils : Tag,
      badgeClass: isFood
        ? CATEGORIA_CONFIG.comida.badgeClass
        : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    };
  }

  return {
    label: cat,
    icon: Tag,
    badgeClass:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
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
  const CategoryIcon = categoriaInfo.icon;
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
          ? "opacity-60 bg-app/80 border-borderSubtle"
          : "bg-surface border-borderSubtle"
      }`}
    >
      {/* Cabecera: Categoría, Horario y Check de completado */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoriaInfo.badgeClass}`}
          >
            <CategoryIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
            <span>{categoriaInfo.label}</span>
          </span>

          {plan.horario && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-app text-content-muted border border-borderSubtle">
              <Clock className="w-3.5 h-3.5 text-content-muted" />
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
                : "border-2 border-borderSubtle hover:border-emerald-500 text-transparent hover:text-emerald-500"
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Título */}
      <h3
        className={`font-semibold text-base leading-tight transition-colors ${
          plan.completado
            ? "line-through text-content-muted"
            : "text-content-main"
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-app text-content-muted hover:bg-brand-light hover:text-brand hover:border-brand/30 border border-borderSubtle transition-all group cursor-pointer max-w-full"
            title="Abrir en Google Maps"
          >
            <MapPin className="w-3.5 h-3.5 shrink-0 text-brand group-hover:text-brand-hover transition-colors" />
            <span className="truncate">
              {hasUbicacion ? plan.ubicacion : "Buscar en Maps"}
            </span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-60 group-hover:opacity-100 text-content-muted group-hover:text-brand transition-all" />
          </a>
        </div>
      )}

      {/* Descripción / Tips */}
      {plan.descripcion && (
        <p className="text-sm text-content-main bg-app p-2.5 rounded-xl leading-relaxed whitespace-pre-wrap border border-borderSubtle/50">
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
              className="h-10 min-h-[40px] px-3.5 bg-brand hover:bg-brand-hover active:bg-brand-hover text-white text-xs sm:text-sm font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors flex-1 shadow-sm"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Asignar al Itinerario</span>
            </button>
          )}

          {onDescartarAideas && plan.fecha && (
            <button
              type="button"
              onClick={() => onDescartarAideas(plan.id)}
              className="h-10 min-h-[40px] px-3.5 bg-app hover:bg-borderSubtle/60 active:bg-borderSubtle text-content-main border border-borderSubtle text-xs sm:text-sm font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors flex-1"
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
              className="h-10 w-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-content-muted hover:text-content-main hover:bg-app active:bg-borderSubtle/50 transition-colors shrink-0"
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
              className="h-10 w-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-content-muted hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
