"use client";

import React, { useState, useEffect } from "react";
import { CategoriaPlan, BloqueHorario, PlanViaje } from "@/lib/supabase";
import {
  X,
  Plus,
  Check,
  Loader2,
  Calendar,
  Clock,
  UtensilsCrossed,
  Compass,
  Film,
  ShoppingBag,
  Hotel,
  Bus,
  Tag,
  Sunrise,
  Sun,
  Sunset,
  Wine,
  Moon,
  SunMedium,
  Pencil,
  Lightbulb,
  Coffee,
  Beer,
  Camera,
  Music,
  Plane,
  Train,
  Heart,
  Utensils,
} from "lucide-react";

export interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planAEditar?: PlanViaje | null;
  categoriasDisponibles?: string[];
  onCrear?: (nuevoPlan: {
    titulo: string;
    categoria: CategoriaPlan;
    ubicacion: string;
    descripcion: string;
    link_maps: string;
    fecha?: string | null;
    bloque?: BloqueHorario | null;
    horario?: string | null;
  }) => Promise<void> | void;
  onActualizar?: (
    id: string,
    datos: {
      titulo: string;
      categoria: CategoriaPlan;
      ubicacion: string | null;
      descripcion: string | null;
      link_maps: string | null;
      fecha: string | null;
      bloque: BloqueHorario | null;
      horario: string | null;
    },
  ) => Promise<void> | void;
  onSave?: (nuevoPlan: {
    titulo: string;
    categoria: CategoriaPlan;
    ubicacion: string;
    descripcion: string;
    link_maps: string;
    fecha?: string | null;
    bloque?: BloqueHorario | null;
    horario?: string | null;
  }) => Promise<void> | void;
}

export const ICONOS_SELECCIONABLES: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "Coffee", label: "Café", icon: Coffee },
  { id: "Beer", label: "Bar", icon: Beer },
  { id: "Camera", label: "Cámara", icon: Camera },
  { id: "Music", label: "Música", icon: Music },
  { id: "Plane", label: "Vuelo", icon: Plane },
  { id: "Train", label: "Transporte", icon: Train },
  { id: "Heart", label: "Favorito", icon: Heart },
  { id: "Tag", label: "Etiqueta", icon: Tag },
];

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

interface CategoriaItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const parseCategoriaItem = (cat: string): CategoriaItem => {
  const lower = (cat || "").toLowerCase();
  const KNOWN: Record<
    string,
    {
      label: string;
      icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    }
  > = {
    comida: { label: "Comida", icon: UtensilsCrossed },
    paseo: { label: "Paseo", icon: Compass },
    cine_show: { label: "Cine/Show", icon: Film },
    compras: { label: "Compras", icon: ShoppingBag },
    alojamiento: { label: "Alojamiento", icon: Hotel },
    transporte: { label: "Transporte", icon: Bus },
  };

  if (KNOWN[lower]) {
    return {
      id: cat,
      label: KNOWN[lower].label,
      icon: KNOWN[lower].icon,
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
      id: cat,
      label: cleanLabel,
      icon: IconComp,
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
      id: cat,
      label: cleanLabel,
      icon: isFood ? Utensils : Tag,
    };
  }

  return {
    id: cat,
    label: cat,
    icon: Tag,
  };
};

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

const HORAS_RANGO: { value: string; label: string }[] = (() => {
  const options: { value: string; label: string }[] = [
    { value: "", label: "Sin definir" },
  ];
  for (let hour = 7; hour <= 23; hour++) {
    for (const min of [0, 30]) {
      const hStr = String(hour).padStart(2, "0");
      const mStr = String(min).padStart(2, "0");
      const timeStr = `${hStr}:${mStr}`;
      options.push({ value: timeStr, label: `${timeStr} hs` });
    }
  }
  return options;
})();

const parseHorarioRango = (
  horarioStr?: string | null,
): { inicio: string; fin: string } => {
  if (!horarioStr) return { inicio: "", fin: "" };
  const raw = horarioStr.trim();

  // "10:00 a 19:00 hs" o "10:00 - 19:00"
  const matchRango = raw.match(/(\d{1,2}:\d{2})\s*(?:a|-)\s*(\d{1,2}:\d{2})/i);
  if (matchRango) {
    const pad = (s: string) => (s.length === 4 ? `0${s}` : s);
    return { inicio: pad(matchRango[1]), fin: pad(matchRango[2]) };
  }

  // "Desde las 10:00 hs"
  const matchDesde = raw.match(/desde\s*(?:las)?\s*(\d{1,2}:\d{2})/i);
  if (matchDesde) {
    const pad = (s: string) => (s.length === 4 ? `0${s}` : s);
    return { inicio: pad(matchDesde[1]), fin: "" };
  }

  // "Hasta las 19:00 hs"
  const matchHasta = raw.match(/hasta\s*(?:las)?\s*(\d{1,2}:\d{2})/i);
  if (matchHasta) {
    const pad = (s: string) => (s.length === 4 ? `0${s}` : s);
    return { inicio: "", fin: pad(matchHasta[1]) };
  }

  // Fallback simple "10:00" o "10:00 hs"
  const matchSimple = raw.match(/(\d{1,2}:\d{2})/);
  if (matchSimple) {
    const pad = (s: string) => (s.length === 4 ? `0${s}` : s);
    return { inicio: pad(matchSimple[1]), fin: "" };
  }

  return { inicio: "", fin: "" };
};

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function PlanModal({
  isOpen,
  onClose,
  planAEditar,
  categoriasDisponibles,
  onCrear,
  onActualizar,
  onSave,
}: PlanModalProps) {
  const listaCategorias: CategoriaItem[] = React.useMemo(() => {
    const defaultIds = ["comida", "paseo", "cine_show", "compras"];
    const merged =
      categoriasDisponibles && categoriasDisponibles.length > 0
        ? Array.from(new Set([...defaultIds, ...categoriasDisponibles]))
        : defaultIds;

    return merged.map(parseCategoriaItem);
  }, [categoriasDisponibles]);

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<CategoriaPlan>("comida");
  const [isCustomCategoria, setIsCustomCategoria] = useState(false);
  const [selectedCustomIcon, setSelectedCustomIcon] = useState("Tag");
  const [customNombre, setCustomNombre] = useState("");

  const [ubicacion, setUbicacion] = useState("");
  const [linkMaps, setLinkMaps] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [asignarDirecto, setAsignarDirecto] = useState(false);
  const [fecha, setFecha] = useState(getTodayString());
  const [bloque, setBloque] = useState<BloqueHorario>("mañana");
  const [horario, setHorario] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (planAEditar) {
        setTitulo(planAEditar.titulo || "");
        setUbicacion(planAEditar.ubicacion || "");
        setLinkMaps(planAEditar.link_maps || "");
        setDescripcion(planAEditar.descripcion || "");

        const matchingCat = listaCategorias.find(
          (c) =>
            c.id.toLowerCase() === (planAEditar.categoria || "").toLowerCase(),
        );

        if (matchingCat) {
          setIsCustomCategoria(false);
          setCategoria(matchingCat.id);
          setSelectedCustomIcon("Tag");
          setCustomNombre("");
        } else if (planAEditar.categoria) {
          setIsCustomCategoria(true);
          const iconPrefixMatch = planAEditar.categoria.match(
            /^(Coffee|Beer|Camera|Music|Plane|Train|Heart|Tag)[:\s]+(.*)$/i,
          );
          if (iconPrefixMatch) {
            const found = ICONOS_SELECCIONABLES.find(
              (i) => i.id.toLowerCase() === iconPrefixMatch[1].toLowerCase(),
            );
            setSelectedCustomIcon(found ? found.id : "Tag");
            setCustomNombre(iconPrefixMatch[2].trim());
          } else {
            const emojiMatch = planAEditar.categoria.match(
              /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*(.*)$/u,
            );
            if (emojiMatch) {
              const isFood =
                /[\u{1F354}-\u{1F37F}\u{1F950}-\u{1F96B}\u{2615}]/u.test(
                  emojiMatch[1],
                ) ||
                /comida|pizza|cafe|café|bar|resto|restaurante/i.test(
                  planAEditar.categoria,
                );
              setSelectedCustomIcon(isFood ? "Coffee" : "Tag");
              setCustomNombre(emojiMatch[2].trim());
            } else {
              setSelectedCustomIcon("Tag");
              setCustomNombre(planAEditar.categoria);
            }
          }
          setCategoria(planAEditar.categoria);
        } else {
          setIsCustomCategoria(false);
          setCategoria("comida");
          setSelectedCustomIcon("Tag");
          setCustomNombre("");
        }

        const tieneFecha = Boolean(planAEditar.fecha);
        setAsignarDirecto(tieneFecha);
        setFecha(planAEditar.fecha || getTodayString());
        setBloque(planAEditar.bloque || "mañana");
        let initialHorario = planAEditar.horario || "";
        if (initialHorario && !initialHorario.includes("hs")) {
          const withHs = `${initialHorario} hs`;
          if (HORAS_DISPONIBLES.some((h) => h.value === withHs)) {
            initialHorario = withHs;
          }
        }
        setHorario(initialHorario);

        const { inicio, fin } = parseHorarioRango(planAEditar.horario);
        setHoraInicio(inicio);
        setHoraFin(fin);
      } else {
        setTitulo("");
        setCategoria("comida");
        setIsCustomCategoria(false);
        setSelectedCustomIcon("Tag");
        setCustomNombre("");
        setUbicacion("");
        setLinkMaps("");
        setDescripcion("");
        setAsignarDirecto(false);
        setFecha(getTodayString());
        setBloque("mañana");
        setHorario("");
        setHoraInicio("");
        setHoraFin("");
      }
      setIsSubmitting(false);
    }
  }, [isOpen, planAEditar]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitulo("");
    setCategoria("comida");
    setIsCustomCategoria(false);
    setSelectedCustomIcon("Tag");
    setCustomNombre("");
    setUbicacion("");
    setLinkMaps("");
    setDescripcion("");
    setAsignarDirecto(false);
    setFecha(getTodayString());
    setBloque("mañana");
    setHorario("");
    setHoraInicio("");
    setHoraFin("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      let finalCategoria: CategoriaPlan = categoria;
      if (isCustomCategoria) {
        const nombreTrimmed = customNombre.trim();
        if (nombreTrimmed) {
          const iconName = selectedCustomIcon || "Tag";
          finalCategoria = `${iconName} ${nombreTrimmed}`;
        } else {
          finalCategoria = "comida";
        }
      }

      let finalHorario: string | null = null;
      if (asignarDirecto) {
        if (bloque === "todo_el_dia") {
          const ini = horaInicio.trim();
          const fin = horaFin.trim();
          if (ini && fin) {
            finalHorario = `${ini} a ${fin} hs`;
          } else if (ini) {
            finalHorario = `Desde las ${ini} hs`;
          } else if (fin) {
            finalHorario = `Hasta las ${fin} hs`;
          } else {
            finalHorario = null;
          }
        } else {
          finalHorario = horario.trim() || null;
        }
      }

      const datosBase = {
        titulo: titulo.trim(),
        categoria: finalCategoria,
        ubicacion: ubicacion.trim() || null,
        descripcion: descripcion.trim() || null,
        link_maps: linkMaps.trim() || null,
        fecha: asignarDirecto ? fecha : null,
        bloque: asignarDirecto ? bloque : null,
        horario: finalHorario,
      };

      if (isEditing && planAEditar?.id) {
        if (onActualizar) {
          await onActualizar(planAEditar.id, datosBase);
        }
      } else {
        const createFn = onCrear || onSave;
        if (createFn) {
          await createFn({
            ...datosBase,
            ubicacion: datosBase.ubicacion || "",
            descripcion: datosBase.descripcion || "",
            link_maps: datosBase.link_maps || "",
          });
        }
      }
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error al procesar plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(planAEditar && planAEditar.id);
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
          <div>
            <h2 className="text-base font-bold text-content-main flex items-center gap-1.5">
              {isEditing ? (
                <>
                  <Pencil className="w-4 h-4 text-brand" strokeWidth={1.75} />
                  <span>Editar Plan</span>
                </>
              ) : (
                <>
                  <Lightbulb
                    className="w-4 h-4 text-brand"
                    strokeWidth={1.75}
                  />
                  <span>Nueva Idea / Plan</span>
                </>
              )}
            </h2>
            <p className="text-xs text-content-muted">
              {isEditing
                ? "Modifica los detalles del plan"
                : "Agrégalo a la bolsa o asígnalo directo"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-content-muted hover:text-content-main hover:bg-app transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 pt-3.5">
          {/* Título */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="plan-titulo"
              className="text-xs font-semibold text-content-main"
            >
              Título <span className="text-rose-500">*</span>
            </label>
            <input
              id="plan-titulo"
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Café Tortoni o Museo"
              className="h-11 px-3.5 rounded-xl border border-borderSubtle bg-app text-content-main text-sm placeholder:text-content-muted focus:bg-surface focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
            />
          </div>

          {/* Selector de categoría (por defecto + opción personalizada) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-content-main">
              Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {listaCategorias.map((cat) => {
                const isSelected = !isCustomCategoria && categoria === cat.id;
                const CatIcon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setIsCustomCategoria(false);
                      setCategoria(cat.id);
                    }}
                    className={`h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all truncate ${
                      isSelected
                        ? "bg-brand border-brand text-white shadow-xs"
                        : "bg-app border-borderSubtle text-content-main hover:bg-borderSubtle/60 active:bg-borderSubtle"
                    }`}
                  >
                    <CatIcon
                      className="w-3.5 h-3.5 shrink-0"
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
              {/* Botón + Otra / Nueva */}
              <button
                type="button"
                onClick={() => setIsCustomCategoria(true)}
                className={`h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all col-span-2 sm:col-span-1 ${
                  isCustomCategoria
                    ? "bg-brand border-brand text-white shadow-xs"
                    : "bg-app border-dashed border-borderSubtle text-content-main hover:bg-borderSubtle/60 active:bg-borderSubtle"
                }`}
              >
                <Plus className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span>Otra / Nueva</span>
              </button>
            </div>

            {/* Inputs para categoría personalizada con selector de icono Lucide */}
            {isCustomCategoria && (
              <div className="mt-1 p-3 rounded-2xl border border-borderSubtle bg-app/80 flex flex-col gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="custom-categoria-nombre"
                    className="text-[11px] font-semibold text-content-muted"
                  >
                    Nombre de la nueva categoría:
                  </label>
                  <input
                    id="custom-categoria-nombre"
                    type="text"
                    required={isCustomCategoria}
                    value={customNombre}
                    onChange={(e) => setCustomNombre(e.target.value)}
                    placeholder="Ej: Cafeterías, Bares, Fotografía..."
                    className="w-full h-11 px-3.5 rounded-xl border border-borderSubtle bg-surface text-content-main text-sm placeholder:text-content-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
                  />
                </div>

                {/* Hilera de botones compactos con iconos de Lucide seleccionables */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-content-muted">
                    Ícono:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {ICONOS_SELECCIONABLES.map(
                      ({ id, label: iconLabel, icon: IconComp }) => {
                        const isIconSelected =
                          (selectedCustomIcon || "Tag") === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSelectedCustomIcon(id)}
                            title={iconLabel}
                            aria-label={iconLabel}
                            className={`h-9 w-9 shrink-0 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                              isIconSelected
                                ? "bg-brand border-brand text-white shadow-xs"
                                : "bg-surface border-borderSubtle text-content-muted hover:text-content-main hover:bg-app"
                            }`}
                          >
                            <IconComp
                              className="w-4 h-4 shrink-0"
                              strokeWidth={1.75}
                            />
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="plan-ubicacion"
              className="text-xs font-semibold text-content-main"
            >
              Ubicación
            </label>
            <input
              id="plan-ubicacion"
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Barrio o referencia, ej. Palermo"
              className="h-11 px-3.5 rounded-xl border border-borderSubtle bg-app text-content-main text-sm placeholder:text-content-muted focus:bg-surface focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
            />
          </div>

          {/* Link de Google Maps */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="plan-link-maps"
              className="text-xs font-semibold text-content-main"
            >
              Link de Maps (opcional)
            </label>
            <input
              id="plan-link-maps"
              type="url"
              value={linkMaps}
              onChange={(e) => setLinkMaps(e.target.value)}
              placeholder="Link de Google Maps"
              className="h-11 px-3.5 rounded-xl border border-borderSubtle bg-app text-content-main text-sm placeholder:text-content-muted focus:bg-surface focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
            />
          </div>

          {/* Descripción / Tips */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="plan-descripcion"
              className="text-xs font-semibold text-content-main"
            >
              Descripción / Tips
            </label>
            <textarea
              id="plan-descripcion"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="¿Por qué ir o qué pedir?"
              className="p-3 rounded-xl border border-borderSubtle bg-app text-content-main text-sm placeholder:text-content-muted focus:bg-surface focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all resize-none"
            />
          </div>

          {/* Sección / Toggle opcional: Asignar directamente al Itinerario */}
          <div className="pt-1 flex flex-col gap-3">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-borderSubtle bg-app cursor-pointer hover:bg-borderSubtle/50 transition-colors">
              <input
                type="checkbox"
                checked={asignarDirecto}
                onChange={(e) => setAsignarDirecto(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand border-borderSubtle"
              />
              <div className="flex items-center gap-1.5 text-xs font-semibold text-content-main select-none">
                <Calendar className="w-3.5 h-3.5 text-brand" />
                <span>Asignar directamente al Itinerario</span>
              </div>
            </label>

            {/* Campos condicionales al activar itinerario */}
            {asignarDirecto && (
              <div className="p-3.5 rounded-2xl border border-brand/20 bg-brand-light/50 flex flex-col gap-3 transition-all animate-fadeIn">
                {/* Fecha */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="itinerario-fecha"
                    className="text-xs font-semibold text-content-main flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-content-muted" />
                    <span>Fecha del Plan</span>
                  </label>
                  <input
                    id="itinerario-fecha"
                    type="date"
                    required={asignarDirecto}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-borderSubtle bg-surface text-content-main text-sm font-medium focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
                  />
                </div>

                {/* Bloque horario */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-content-main">
                    Momento del Día
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {BLOQUES.map((b) => {
                      const isSelected = bloque === b.id;
                      const BloqueIcon = b.icon;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBloque(b.id)}
                          className={`h-9 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                            isSelected
                              ? "bg-brand border-brand text-white shadow-xs"
                              : "bg-surface border-borderSubtle text-content-main hover:bg-app"
                          }`}
                        >
                          <BloqueIcon
                            className="w-3.5 h-3.5 shrink-0"
                            strokeWidth={1.75}
                          />
                          <span>{b.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selector de Horario */}
                {bloque === "todo_el_dia" ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-content-main flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-content-muted" />
                      <span>Rango de horario (opcional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Hora Inicio */}
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="itinerario-hora-inicio"
                          className="text-[11px] font-medium text-content-muted"
                        >
                          Hora inicio (opcional)
                        </label>
                        <div className="relative">
                          <select
                            id="itinerario-hora-inicio"
                            value={horaInicio}
                            onChange={(e) => setHoraInicio(e.target.value)}
                            className="w-full p-2.5 pr-8 rounded-xl border border-borderSubtle bg-surface text-content-main text-xs font-medium focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all cursor-pointer appearance-none"
                          >
                            {HORAS_RANGO.map((opt) => (
                              <option
                                key={`ini-${opt.value}`}
                                value={opt.value}
                              >
                                {opt.label}
                              </option>
                            ))}
                            {horaInicio &&
                              !HORAS_RANGO.some(
                                (opt) => opt.value === horaInicio,
                              ) && (
                                <option value={horaInicio}>
                                  {horaInicio} hs
                                </option>
                              )}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-content-muted">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* Hora Fin */}
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="itinerario-hora-fin"
                          className="text-[11px] font-medium text-content-muted"
                        >
                          Hora fin (opcional)
                        </label>
                        <div className="relative">
                          <select
                            id="itinerario-hora-fin"
                            value={horaFin}
                            onChange={(e) => setHoraFin(e.target.value)}
                            className="w-full p-2.5 pr-8 rounded-xl border border-borderSubtle bg-surface text-content-main text-xs font-medium focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all cursor-pointer appearance-none"
                          >
                            {HORAS_RANGO.map((opt) => (
                              <option
                                key={`fin-${opt.value}`}
                                value={opt.value}
                              >
                                {opt.label}
                              </option>
                            ))}
                            {horaFin &&
                              !HORAS_RANGO.some(
                                (opt) => opt.value === horaFin,
                              ) && (
                                <option value={horaFin}>{horaFin} hs</option>
                              )}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-content-muted">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="itinerario-horario"
                      className="text-xs font-semibold text-content-main flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5 text-content-muted" />
                      <span>Horario específico</span>
                    </label>
                    <div className="relative">
                      <select
                        id="itinerario-horario"
                        value={horario}
                        onChange={(e) => setHorario(e.target.value)}
                        className="w-full p-2.5 pr-9 rounded-xl border border-borderSubtle bg-surface text-content-main text-sm font-medium focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all cursor-pointer appearance-none"
                      >
                        {HORAS_DISPONIBLES.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                        {hasCustomHorario && (
                          <option value={horario}>{horario}</option>
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-content-muted">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón Guardar / Guardar Cambios */}
          <button
            type="submit"
            disabled={!titulo.trim() || isSubmitting}
            className="h-12 w-full mt-2 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : isEditing ? (
              <>
                <Check className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Guardar Plan</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
