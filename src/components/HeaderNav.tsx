"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { CategoriaPlan } from "@/lib/supabase";
import {
  Lightbulb,
  CalendarDays,
  Sun,
  Moon,
  Sparkles,
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
  { key: "todos", label: "Todos" },
  { key: "comida", label: "Comida" },
  { key: "paseo", label: "Paseos" },
  { key: "cine_show", label: "Cine/Show" },
  { key: "compras", label: "Compras" },
];

const CUSTOM_NAV_ICONS: Record<
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

function getCategoryIcon(key: string, label: string) {
  const iconProps = { className: "w-3.5 h-3.5 shrink-0", strokeWidth: 1.75 };
  switch (key) {
    case "todos":
      return <Sparkles {...iconProps} />;
    case "comida":
      return <UtensilsCrossed {...iconProps} />;
    case "paseo":
      return <Compass {...iconProps} />;
    case "cine_show":
      return <Film {...iconProps} />;
    case "compras":
      return <ShoppingBag {...iconProps} />;
    case "alojamiento":
      return <Hotel {...iconProps} />;
    case "transporte":
      return <Bus {...iconProps} />;
    default: {
      const iconMatch = (key || label).match(
        /^(Coffee|Beer|Camera|Music|Plane|Train|Heart|Tag)[:\s]+/i,
      );
      if (iconMatch) {
        const IconComp = CUSTOM_NAV_ICONS[iconMatch[1].toLowerCase()] || Tag;
        return <IconComp {...iconProps} />;
      }

      const emojiMatch = (key || label).match(
        /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u,
      );
      if (emojiMatch) {
        const isFood =
          /[\u{1F354}-\u{1F37F}\u{1F950}-\u{1F96B}\u{2615}]/u.test(
            emojiMatch[1],
          ) ||
          /comida|pizza|cafe|café|bar|resto|restaurante/i.test(key || label);
        return isFood ? <Utensils {...iconProps} /> : <Tag {...iconProps} />;
      }

      return <Tag {...iconProps} />;
    }
  }
}

function cleanCategoryLabel(label: string) {
  return label
    .replace(/^(Coffee|Beer|Camera|Music|Plane|Train|Heart|Tag)[:\s]+/i, "")
    .replace(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*/u, "")
    .trim();
}

export default function HeaderNav({
  activeTab,
  onTabChange,
  selectedCategory,
  onCategoryChange,
  ideasCount,
  itineraryCount,
  categories,
}: HeaderNavProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  const displayCategories =
    categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur-md border-b border-borderSubtle pt-3 pb-2 px-4 shadow-xs">
      {/* Título y subtítulo superior con pastilla de estado y selector de tema */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            width={36}
            height={36}
            alt="Nuestro Viaje"
            priority
            className="w-9 h-9 rounded-xl shadow-xs shrink-0 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-content-main tracking-tight leading-none">
              Nuestro Viaje
            </h1>
            <p className="text-xs text-content-muted font-normal mt-0.5">
              Itinerario y planes en pareja
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pastilla de estado */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden xs:inline sm:inline">En sincronía</span>
          </div>

          {/* Toggle Modo Oscuro / Claro */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={
              isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
            }
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-borderSubtle bg-app text-content-muted hover:text-content-main hover:bg-surface transition-all cursor-pointer shadow-2xs shrink-0"
          >
            {mounted ? (
              isDark ? (
                <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
              ) : (
                <Moon
                  className="w-4 h-4 text-slate-600 dark:text-slate-300"
                  strokeWidth={1.75}
                />
              )
            ) : (
              <span className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Selector de Solapas (Tabs) con iconos Lucide */}
      <div className="bg-app border border-borderSubtle/70 p-1 rounded-xl flex gap-1 mt-2.5">
        <button
          type="button"
          onClick={() => onTabChange("ideas")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm min-h-[38px] transition-all ${
            activeTab === "ideas"
              ? "bg-surface text-content-main shadow-xs font-semibold"
              : "text-content-muted font-medium hover:text-content-main"
          }`}
        >
          <Lightbulb className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>Bolsa de Ideas</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold transition-colors ${
              activeTab === "ideas"
                ? "bg-app text-content-main"
                : "bg-borderSubtle/60 text-content-muted"
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
              ? "bg-surface text-content-main shadow-xs font-semibold"
              : "text-content-muted font-medium hover:text-content-main"
          }`}
        >
          <CalendarDays className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>Itinerario</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold transition-colors ${
              activeTab === "itinerario"
                ? "bg-app text-content-main"
                : "bg-borderSubtle/60 text-content-muted"
            }`}
          >
            {itineraryCount}
          </span>
        </button>
      </div>

      {/* Filtros horizontales por categoría con iconos Lucide */}
      <div className="flex gap-2 overflow-x-auto py-2 mt-1 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {displayCategories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onCategoryChange(cat.key)}
              className={`h-9 min-h-[36px] shrink-0 rounded-full px-3.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                isActive
                  ? "bg-brand text-white shadow-xs"
                  : "bg-surface border border-borderSubtle text-content-muted hover:text-content-main hover:bg-app"
              }`}
            >
              {getCategoryIcon(cat.key, cat.label)}
              <span>{cleanCategoryLabel(cat.label)}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
