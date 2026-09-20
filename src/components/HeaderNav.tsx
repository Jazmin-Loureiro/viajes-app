"use client";

import React from "react";
import { CategoriaPlan } from "@/lib/supabase";

export interface HeaderNavProps {
  activeTab: "ideas" | "itinerario";
  onTabChange: (tab: "ideas" | "itinerario") => void;
  selectedCategory: CategoriaPlan | "todos";
  onCategoryChange: (category: CategoriaPlan | "todos") => void;
  ideasCount: number;
  itineraryCount: number;
  categories?: { key: CategoriaPlan | "todos"; label: string }[];
}

interface CategoryOption {
  key: CategoriaPlan | "todos";
  label: string;
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { key: "todos", label: "✨ Todos" },
  { key: "comida", label: "🍔 Comida" },
  { key: "paseo", label: "🏛️ Paseos" },
  { key: "cine_show", label: "🎟️ Cine/Show" },
  { key: "compras", label: "🛍️ Compras" },
];

export default function HeaderNav({
  activeTab,
  onTabChange,
  selectedCategory,
  onCategoryChange,
  ideasCount,
  itineraryCount,
  categories,
}: HeaderNavProps) {
  const displayCategories =
    categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 pt-3 pb-2 px-4 shadow-sm">
      {/* Título y subtítulo superior */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>✈️</span>
            <span>Nuestro Viaje</span>
          </h1>
          <p className="text-xs text-slate-400 font-normal">
            Itinerario y planes en pareja
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>En sincronía</span>
        </div>
      </div>

      {/* Selector de Solapas (Tabs) */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mt-2.5">
        <button
          type="button"
          onClick={() => onTabChange("ideas")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm min-h-[38px] transition-all ${
            activeTab === "ideas"
              ? "bg-white text-slate-900 shadow-sm font-semibold"
              : "text-slate-500 font-medium hover:text-slate-700"
          }`}
        >
          <span>💡 Bolsa de Ideas</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold transition-colors ${
              activeTab === "ideas"
                ? "bg-slate-100 text-slate-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {ideasCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("itinerario")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm min-h-[38px] transition-all ${
            activeTab === "itinerario"
              ? "bg-white text-slate-900 shadow-sm font-semibold"
              : "text-slate-500 font-medium hover:text-slate-700"
          }`}
        >
          <span>📅 Itinerario</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold transition-colors ${
              activeTab === "itinerario"
                ? "bg-slate-100 text-slate-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {itineraryCount}
          </span>
        </button>
      </div>

      {/* Filtros horizontales por categoría */}
      <div className="flex gap-2 overflow-x-auto py-2 mt-1 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {displayCategories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onCategoryChange(cat.key)}
              className={`h-9 min-h-[36px] shrink-0 rounded-full px-3.5 text-xs font-medium transition-colors flex items-center justify-center ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
