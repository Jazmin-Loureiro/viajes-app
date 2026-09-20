"use client";

import React, { useState, useEffect } from "react";
import { CategoriaPlan, BloqueHorario, PlanViaje } from "@/lib/supabase";
import { X, Plus, Check, Loader2, Calendar, Clock } from "lucide-react";

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
    datosActualizados: {
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

interface CategoriaItem {
  id: string;
  label: string;
  emoji: string;
}

const parseCategoriaItem = (cat: string): CategoriaItem => {
  const KNOWN: Record<string, { label: string; emoji: string }> = {
    comida: { label: "Comida", emoji: "🍔" },
    paseo: { label: "Paseo", emoji: "🌳" },
    cine_show: { label: "Cine/Show", emoji: "🎟️" },
    compras: { label: "Compras", emoji: "🛍️" },
    alojamiento: { label: "Alojamiento", emoji: "🏨" },
    transporte: { label: "Transporte", emoji: "🚇" },
  };

  if (KNOWN[cat]) {
    return { id: cat, label: KNOWN[cat].label, emoji: KNOWN[cat].emoji };
  }

  const match = cat.match(
    /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*(.*)$/u,
  );
  if (match) {
    return {
      id: cat,
      emoji: match[1],
      label: match[2] || cat,
    };
  }

  return {
    id: cat,
    emoji: "🏷️",
    label: cat,
  };
};

const BLOQUES: { id: BloqueHorario; label: string; icon: string }[] = [
  { id: "todo_el_dia", label: "Todo el día", icon: "☀️" },
  { id: "mañana", label: "Mañana", icon: "☀️" },
  { id: "mediodia", label: "Mediodía", icon: "🍽️" },
  { id: "tarde", label: "Tarde", icon: "🌤️" },
  { id: "cena", label: "Cena", icon: "🍷" },
  { id: "noche", label: "Noche", icon: "🌙" },
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
  const [customEmoji, setCustomEmoji] = useState("🏷️");
  const [customNombre, setCustomNombre] = useState("");

  const [ubicacion, setUbicacion] = useState("");
  const [linkMaps, setLinkMaps] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [asignarDirecto, setAsignarDirecto] = useState(false);
  const [fecha, setFecha] = useState(getTodayString());
  const [bloque, setBloque] = useState<BloqueHorario>("mañana");
  const [horario, setHorario] = useState("");
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
          setCustomEmoji("🏷️");
          setCustomNombre("");
        } else if (planAEditar.categoria) {
          setIsCustomCategoria(true);
          const match = planAEditar.categoria.match(
            /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*(.*)$/u,
          );
          if (match) {
            setCustomEmoji(match[1]);
            setCustomNombre(match[2] || "");
          } else {
            setCustomEmoji("🏷️");
            setCustomNombre(planAEditar.categoria);
          }
          setCategoria(planAEditar.categoria);
        } else {
          setIsCustomCategoria(false);
          setCategoria("comida");
          setCustomEmoji("🏷️");
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
      } else {
        setTitulo("");
        setCategoria("comida");
        setIsCustomCategoria(false);
        setCustomEmoji("🏷️");
        setCustomNombre("");
        setUbicacion("");
        setLinkMaps("");
        setDescripcion("");
        setAsignarDirecto(false);
        setFecha(getTodayString());
        setBloque("mañana");
        setHorario("");
      }
      setIsSubmitting(false);
    }
  }, [isOpen, planAEditar]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitulo("");
    setCategoria("comida");
    setIsCustomCategoria(false);
    setCustomEmoji("🏷️");
    setCustomNombre("");
    setUbicacion("");
    setLinkMaps("");
    setDescripcion("");
    setAsignarDirecto(false);
    setFecha(getTodayString());
    setBloque("mañana");
    setHorario("");
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
          finalCategoria = customEmoji.trim()
            ? `${customEmoji.trim()} ${nombreTrimmed}`
            : nombreTrimmed;
        } else {
          finalCategoria = "comida";
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
        horario: asignarDirecto ? horario.trim() || null : null,
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
      <div className="rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-md bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {isEditing ? "✏️ Editar Plan" : "💡 Nueva Idea / Plan"}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing
                ? "Modifica los detalles del plan"
                : "Agrégalo a la bolsa o asígnalo directo"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
              className="text-xs font-semibold text-slate-700"
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
              className="h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-all"
            />
          </div>

          {/* Selector de categoría (por defecto + opción personalizada) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {listaCategorias.map((cat) => {
                const isSelected = !isCustomCategoria && categoria === cat.id;
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
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                  >
                    <span>{cat.emoji}</span>
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
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "bg-slate-50 border-dashed border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                }`}
              >
                <span>➕</span>
                <span>Otra / Nueva</span>
              </button>
            </div>

            {/* Inputs para categoría personalizada con emoji */}
            {isCustomCategoria && (
              <div className="mt-1 p-3 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-slate-600">
                  Elige emoji y nombre de la categoría:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    placeholder="🏷️"
                    title="Emoji de la categoría"
                    className="w-12 h-11 text-center text-lg rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-all"
                  />
                  <input
                    type="text"
                    required={isCustomCategoria}
                    value={customNombre}
                    onChange={(e) => setCustomNombre(e.target.value)}
                    placeholder="Ej: Cafés, Alojamiento, Bar..."
                    className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-all"
                  />
                </div>
                {/* Sugerencias de emojis rápidos */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-base">
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    Sugerencias:
                  </span>
                  {[
                    "☕",
                    "🏨",
                    "🚇",
                    "🏖️",
                    "🍺",
                    "🎨",
                    "🛍️",
                    "✈️",
                    "🎵",
                    "📸",
                    "🎭",
                    "🍕",
                  ].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setCustomEmoji(em)}
                      className="h-7 w-7 shrink-0 rounded-lg hover:bg-white hover:shadow-xs active:scale-95 transition-all flex items-center justify-center text-sm"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="plan-ubicacion"
              className="text-xs font-semibold text-slate-700"
            >
              Ubicación
            </label>
            <input
              id="plan-ubicacion"
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Barrio o referencia, ej. Palermo"
              className="h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-all"
            />
          </div>

          {/* Link de Google Maps */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="plan-link-maps"
              className="text-xs font-semibold text-slate-700"
            >
              Link de Maps (opcional)
            </label>
            <input
              id="plan-link-maps"
              type="url"
              value={linkMaps}
              onChange={(e) => setLinkMaps(e.target.value)}
              placeholder="Link de Google Maps"
              className="h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-all"
            />
          </div>

          {/* Descripción / Tips */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="plan-descripcion"
              className="text-xs font-semibold text-slate-700"
            >
              Descripción / Tips
            </label>
            <textarea
              id="plan-descripcion"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="¿Por qué ir o qué pedir?"
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-all resize-none"
            />
          </div>

          {/* Sección / Toggle opcional: Asignar directamente al Itinerario */}
          <div className="pt-1 flex flex-col gap-3">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/80 transition-colors">
              <input
                type="checkbox"
                checked={asignarDirecto}
                onChange={(e) => setAsignarDirecto(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
              />
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 select-none">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Asignar directamente al Itinerario</span>
              </div>
            </label>

            {/* Campos condicionales al activar itinerario */}
            {asignarDirecto && (
              <div className="p-3.5 rounded-2xl border border-blue-100 bg-blue-50/40 flex flex-col gap-3 transition-all animate-fadeIn">
                {/* Fecha */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="itinerario-fecha"
                    className="text-xs font-semibold text-slate-700 flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fecha del Plan</span>
                  </label>
                  <input
                    id="itinerario-fecha"
                    type="date"
                    required={asignarDirecto}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-all"
                  />
                </div>

                {/* Bloque horario */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Momento del Día
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {BLOQUES.map((b) => {
                      const isSelected = bloque === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBloque(b.id)}
                          className={`h-9 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                            isSelected
                              ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{b.icon}</span>
                          <span>{b.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selector de Horario */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="itinerario-horario"
                    className="text-xs font-semibold text-slate-700 flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Horario específico</span>
                  </label>
                  <div className="relative">
                    <select
                      id="itinerario-horario"
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                      className="w-full p-2.5 pr-9 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-all cursor-pointer appearance-none"
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
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón Guardar / Guardar Cambios */}
          <button
            type="submit"
            disabled={!titulo.trim() || isSubmitting}
            className="h-12 w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm"
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
