"use client";

import React from "react";
import { PlanViaje, CategoriaPlan } from "@/lib/supabase";
import PlanCard from "./PlanCard";
import { Lightbulb, Plus, Sparkles } from "lucide-react";

export interface IdeasViewProps {
  planes: PlanViaje[];
  selectedCategory: CategoriaPlan | "todos";
  onToggleCompletado: (id: string, completado: boolean) => void;
  onEliminar: (id: string) => void;
  onAsignarItinerario: (plan: PlanViaje) => void;
  onOpenAddModal: () => void;
  onEditar?: (plan: PlanViaje) => void;
  onOpenGeminiModal?: () => void;
}

export default function IdeasView({
  planes,
  selectedCategory,
  onToggleCompletado,
  onEliminar,
  onAsignarItinerario,
  onOpenAddModal,
  onEditar,
  onOpenGeminiModal,
}: IdeasViewProps) {
  const ideasFiltradas = planes.filter((plan) => {
    if (selectedCategory === "todos") return true;
    return plan.categoria === selectedCategory;
  });

  if (ideasFiltradas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center pb-28">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
          <Lightbulb className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          No hay ideas todavía
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mb-5">
          Guarda lugares para comer, pasear o visitar durante el viaje.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs justify-center">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar idea</span>
          </button>
          {onOpenGeminiModal && (
            <button
              type="button"
              onClick={onOpenGeminiModal}
              className="h-11 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Ideas con IA ✨</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 pb-28 pt-2 px-4 max-w-2xl mx-auto w-full">
      {/* Banner llamativo para sugerencias con IA */}
      {onOpenGeminiModal && (
        <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0 mr-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold leading-tight truncate">
                ¿Buscando inspiración?
              </h4>
              <p className="text-[11px] text-purple-100 font-normal truncate">
                Pedile recomendaciones a Gemini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenGeminiModal}
            className="bg-white hover:bg-white/90 text-violet-900 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Ideas con IA ✨</span>
          </button>
        </div>
      )}

      {ideasFiltradas.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onToggleCompletado={onToggleCompletado}
          onEliminar={onEliminar}
          onAsignarItinerario={onAsignarItinerario}
          onEditar={onEditar}
        />
      ))}
    </div>
  );
}
