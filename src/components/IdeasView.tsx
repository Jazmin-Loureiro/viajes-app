"use client";

import React from "react";
import { PlanViaje, CategoriaPlan } from "@/lib/supabase";
import PlanCard from "./PlanCard";
import { Lightbulb, Plus } from "lucide-react";

export interface IdeasViewProps {
  planes: PlanViaje[];
  selectedCategory: CategoriaPlan | "todos";
  onToggleCompletado: (id: string, completado: boolean) => void;
  onEliminar: (id: string) => void;
  onAsignarItinerario: (plan: PlanViaje) => void;
  onOpenAddModal: () => void;
  onEditar?: (plan: PlanViaje) => void;
}

export default function IdeasView({
  planes,
  selectedCategory,
  onToggleCompletado,
  onEliminar,
  onAsignarItinerario,
  onOpenAddModal,
  onEditar,
}: IdeasViewProps) {
  const ideasFiltradas = planes.filter((plan) => {
    if (selectedCategory === "todos") return true;
    return plan.categoria === selectedCategory;
  });

  if (ideasFiltradas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center pb-28">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
          <Lightbulb className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          No hay ideas todavía
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mb-5">
          Guarda lugares para comer, pasear o visitar durante el viaje.
        </p>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar la primera idea</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 pb-28 pt-2 px-4 max-w-2xl mx-auto w-full">
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
