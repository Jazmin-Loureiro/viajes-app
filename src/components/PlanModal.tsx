"use client";

import React, { useState } from "react";
import { CategoriaPlan } from "@/lib/supabase";
import { X, Plus, Loader2 } from "lucide-react";

export interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nuevoPlan: {
    titulo: string;
    categoria: CategoriaPlan;
    ubicacion: string;
    descripcion: string;
    link_maps: string;
  }) => Promise<void> | void;
}

const CATEGORIAS: { id: CategoriaPlan; label: string; emoji: string }[] = [
  { id: "comida", label: "Comida", emoji: "🍔" },
  { id: "paseo", label: "Paseo", emoji: "🌳" },
  { id: "cine_show", label: "Cine/Show", emoji: "🎟️" },
  { id: "compras", label: "Compras", emoji: "🛍️" },
];

export default function PlanModal({ isOpen, onClose, onSave }: PlanModalProps) {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<CategoriaPlan>("comida");
  const [ubicacion, setUbicacion] = useState("");
  const [linkMaps, setLinkMaps] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitulo("");
    setCategoria("comida");
    setUbicacion("");
    setLinkMaps("");
    setDescripcion("");
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
      await onSave({
        titulo: titulo.trim(),
        categoria,
        ubicacion: ubicacion.trim(),
        descripcion: descripcion.trim(),
        link_maps: linkMaps.trim(),
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error al guardar plan:", error);
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
          <div>
            <h2 className="text-base font-bold text-slate-800">
              💡 Nueva Idea / Plan
            </h2>
            <p className="text-xs text-slate-400">
              Agrégalo a la bolsa para organizarlo luego
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

          {/* Selector táctil de categoría */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Categoría
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((cat) => {
                const isSelected = categoria === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoria(cat.id)}
                    className={`h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
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

          {/* Botón Guardar */}
          <button
            type="submit"
            disabled={!titulo.trim() || isSubmitting}
            className="h-12 w-full mt-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
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
