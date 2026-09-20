"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  supabase,
  PlanViaje,
  CategoriaPlan,
  BloqueHorario,
} from "@/lib/supabase";
import HeaderNav from "@/components/HeaderNav";
import IdeasView from "@/components/IdeasView";
import ItineraryView from "@/components/ItineraryView";
import PlanModal from "@/components/PlanModal";
import MoveToDayModal from "@/components/MoveToDayModal";
import GeminiModal from "@/components/GeminiModal";
import { Plus, Sparkles, Loader2 } from "lucide-react";

const DEFAULT_CATEGORIES: { key: CategoriaPlan | "todos"; label: string }[] = [
  { key: "todos", label: "✨ Todos" },
  { key: "comida", label: "🍔 Comida" },
  { key: "paseo", label: "🏛️ Paseos" },
  { key: "cine_show", label: "🎟️ Cine/Show" },
  { key: "compras", label: "🛍️ Compras" },
];

export default function Home() {
  // Estados principales
  const [planes, setPlanes] = useState<PlanViaje[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"ideas" | "itinerario">("ideas");
  const [selectedCategory, setSelectedCategory] = useState<
    CategoriaPlan | "todos"
  >("todos");
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState<boolean>(false);
  const [planAEditar, setPlanAEditar] = useState<PlanViaje | null>(null);
  const [selectedPlanToMove, setSelectedPlanToMove] =
    useState<PlanViaje | null>(null);

  // Categorías por defecto
  const categoriasDefault = ["comida", "paseo", "cine_show", "compras"];

  // Lista consolidada de categorías disponibles combinando las default con todas las categorías de Supabase (sin localStorage)
  const categoriasDisponibles = useMemo(() => {
    return Array.from(
      new Set([
        ...categoriasDefault,
        ...planes.map((p) => p.categoria).filter(Boolean),
      ]),
    );
  }, [planes]);

  // Categorías para HeaderNav (formateadas con emojis)
  const availableCategories = useMemo(() => {
    const defaultKeys = new Set(DEFAULT_CATEGORIES.map((c) => c.key));
    const customList: { key: CategoriaPlan | "todos"; label: string }[] = [];
    const planesCats = Array.from(
      new Set(planes.map((p) => p.categoria).filter(Boolean)),
    );

    const KNOWN_EXTRA: Record<string, string> = {
      alojamiento: "🏨 Alojamiento",
      transporte: "🚇 Transporte",
    };

    for (const cat of planesCats) {
      if (!defaultKeys.has(cat)) {
        if (KNOWN_EXTRA[cat]) {
          customList.push({ key: cat, label: KNOWN_EXTRA[cat] });
        } else {
          const hasEmoji =
            /^\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(cat);
          const label = hasEmoji ? cat : `🏷️ ${cat}`;
          customList.push({ key: cat, label });
        }
      }
    }
    return [...DEFAULT_CATEGORIES, ...customList];
  }, [planes]);

  // Si la categoría seleccionada deja de existir (por ejemplo al eliminar o editar un plan), volver a "todos"
  useEffect(() => {
    if (
      selectedCategory !== "todos" &&
      !availableCategories.some((c) => c.key === selectedCategory)
    ) {
      setSelectedCategory("todos");
    }
  }, [availableCategories, selectedCategory]);

  // Cargar todos los planes ordenados por created_at ascendente
  const fetchPlanes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("planes_viaje")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error al cargar planes:", error);
      } else if (data) {
        setPlanes(data);
      }
    } catch (error) {
      console.error("Error en fetchPlanes:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga inicial y suscripción Realtime
  useEffect(() => {
    fetchPlanes();

    const channel = supabase
      .channel("public:planes_viaje")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "planes_viaje" },
        () => {
          fetchPlanes();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPlanes]);

  // Handler: Crear nuevo plan (en ideas o asignado directamente)
  const handleCrearPlan = async (nuevoPlan: {
    titulo: string;
    categoria: CategoriaPlan;
    ubicacion: string;
    descripcion: string;
    link_maps: string;
    fecha?: string | null;
    bloque?: BloqueHorario | null;
    horario?: string | null;
  }) => {
    try {
      const { error } = await supabase.from("planes_viaje").insert({
        titulo: nuevoPlan.titulo,
        categoria: nuevoPlan.categoria,
        ubicacion: nuevoPlan.ubicacion || null,
        link_maps: nuevoPlan.link_maps || null,
        descripcion: nuevoPlan.descripcion || null,
        fecha: nuevoPlan.fecha || null,
        bloque: nuevoPlan.bloque || null,
        horario: nuevoPlan.horario || null,
        completado: false,
      });

      if (error) {
        console.error("Error al crear plan:", error);
        alert("No se pudo guardar el plan. Por favor intenta de nuevo.");
      } else {
        setIsAddModalOpen(false);
        await fetchPlanes();
      }
    } catch (err) {
      console.error("Error al crear plan:", err);
    }
  };

  // Handler: Editar plan existente
  const handleEditarPlan = async (id: string, datos: Partial<PlanViaje>) => {
    // Actualización optimista
    setPlanes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...datos } : p)),
    );

    try {
      const { error } = await supabase
        .from("planes_viaje")
        .update(datos)
        .eq("id", id);

      if (error) {
        console.error("Error al actualizar plan:", error);
        alert("No se pudieron guardar los cambios.");
        await fetchPlanes();
      } else {
        setIsAddModalOpen(false);
        setPlanAEditar(null);
        await fetchPlanes();
      }
    } catch (err) {
      console.error("Error al actualizar plan:", err);
      await fetchPlanes();
    }
  };

  // Abrir modal de edición
  const handleEditarClick = (plan: PlanViaje) => {
    setPlanAEditar(plan);
    setIsAddModalOpen(true);
  };

  // Handler: Alternar estado completado
  const handleToggleCompletado = async (id: string, completado: boolean) => {
    // Actualización optimista en interfaz
    setPlanes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, completado } : p)),
    );

    try {
      const { error } = await supabase
        .from("planes_viaje")
        .update({ completado })
        .eq("id", id);

      if (error) {
        console.error("Error al alternar completado:", error);
        await fetchPlanes();
      }
    } catch (err) {
      console.error("Error al alternar completado:", err);
      await fetchPlanes();
    }
  };

  // Handler: Eliminar plan
  const handleEliminar = async (id: string) => {
    // Actualización optimista
    setPlanes((prev) => prev.filter((p) => p.id !== id));

    try {
      const { error } = await supabase
        .from("planes_viaje")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error al eliminar plan:", error);
        await fetchPlanes();
      }
    } catch (err) {
      console.error("Error al eliminar plan:", err);
      await fetchPlanes();
    }
  };

  // Handler: Abrir modal para asignar itinerario
  const handleAsignarItinerario = (plan: PlanViaje) => {
    setSelectedPlanToMove(plan);
  };

  // Handler: Confirmar movimiento de plan a un día y bloque
  const handleConfirmMover = async (
    id: string,
    fecha: string,
    bloque: BloqueHorario,
    horario?: string,
  ) => {
    try {
      const { error } = await supabase
        .from("planes_viaje")
        .update({
          fecha,
          bloque,
          horario: horario || null,
        })
        .eq("id", id);

      if (error) {
        console.error("Error al asignar al itinerario:", error);
        alert("No se pudo mover el plan al itinerario.");
      } else {
        setSelectedPlanToMove(null);
        await fetchPlanes();
      }
    } catch (err) {
      console.error("Error al asignar al itinerario:", err);
    }
  };

  // Handler: Descartar y devolver al banco de ideas
  const handleDescartarAideas = async (id: string) => {
    try {
      const { error } = await supabase
        .from("planes_viaje")
        .update({
          fecha: null,
          bloque: null,
          horario: null,
        })
        .eq("id", id);

      if (error) {
        console.error("Error al devolver plan a ideas:", error);
        alert("No se pudo devolver el plan a la bolsa de ideas.");
      } else {
        await fetchPlanes();
      }
    } catch (err) {
      console.error("Error al devolver plan a ideas:", err);
    }
  };

  // Handler: Agregar sugerencia generada por Gemini directamente a la bolsa de ideas
  const handleAgregarIdeaGemini = async (idea: {
    titulo: string;
    categoria: string;
    notas: string;
    ubicacion?: string;
  }) => {
    try {
      const { error } = await supabase.from("planes_viaje").insert({
        titulo: idea.titulo,
        categoria: idea.categoria,
        ubicacion: idea.ubicacion || null,
        link_maps: null,
        descripcion: idea.notas || null,
        fecha: null,
        bloque: null,
        horario: null,
        completado: false,
      });

      if (error) {
        console.error("Error al guardar idea de Gemini:", error);
        alert("No se pudo guardar la sugerencia.");
      } else {
        await fetchPlanes();
      }
    } catch (err) {
      console.error("Error al guardar idea de Gemini:", err);
    }
  };

  // Handler: Asignar al itinerario desde Gemini -> Abre PlanModal precargado con switch activo
  const handleAsignarItinerarioDesdeGemini = (idea: {
    titulo: string;
    categoria: string;
    notas: string;
    ubicacion?: string;
  }) => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    setIsGeminiModalOpen(false);
    setPlanAEditar({
      id: "", // Marca como nueva creación y no edición de ID existente
      created_at: new Date().toISOString(),
      titulo: idea.titulo,
      categoria: idea.categoria,
      descripcion: idea.notas || "",
      ubicacion: idea.ubicacion || "",
      link_maps: null,
      fecha: todayStr,
      bloque: "mañana",
      horario: null,
      completado: false,
    });
    setIsAddModalOpen(true);
  };

  // Separación de listas de planes
  const ideasPlanes = planes.filter((p) => p.fecha === null);
  const itinerarioPlanes = planes.filter((p) => p.fecha !== null);

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 relative shadow-sm">
      {/* Navegación y cabecera fija */}
      <HeaderNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        ideasCount={ideasPlanes.length}
        itineraryCount={itinerarioPlanes.length}
        categories={availableCategories}
      />

      {/* Contenido principal o indicador de carga */}
      {cargando ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3 my-auto">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Cargando planes de viaje...</span>
          </p>
        </div>
      ) : (
        <main className="flex-1 flex flex-col">
          {activeTab === "ideas" ? (
            <IdeasView
              planes={ideasPlanes}
              selectedCategory={selectedCategory}
              onToggleCompletado={handleToggleCompletado}
              onEliminar={handleEliminar}
              onAsignarItinerario={handleAsignarItinerario}
              onOpenAddModal={() => {
                setPlanAEditar(null);
                setIsAddModalOpen(true);
              }}
              onEditar={handleEditarClick}
              onOpenGeminiModal={() => setIsGeminiModalOpen(true)}
            />
          ) : (
            <ItineraryView
              planes={itinerarioPlanes}
              selectedCategory={selectedCategory}
              onToggleCompletado={handleToggleCompletado}
              onEliminar={handleEliminar}
              onDescartarAideas={handleDescartarAideas}
              onEditar={handleEditarClick}
            />
          )}
        </main>
      )}

      {/* Botones de acción flotantes (Bottom Floating Actions) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-center">
        <button
          type="button"
          onClick={() => setIsGeminiModalOpen(true)}
          aria-label="Ideas con IA (Gemini)"
          title="Pedir ideas con IA (Gemini)"
          className="h-11 w-11 bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center border border-white/20 active:scale-95 transition-all"
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
        </button>

        <button
          type="button"
          onClick={() => {
            setPlanAEditar(null);
            setIsAddModalOpen(true);
          }}
          aria-label="Agregar nuevo plan"
          title="Agregar nuevo plan"
          className="h-14 w-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Modales */}
      <PlanModal
        isOpen={isAddModalOpen}
        planAEditar={planAEditar}
        categoriasDisponibles={categoriasDisponibles}
        onClose={() => {
          setIsAddModalOpen(false);
          setPlanAEditar(null);
        }}
        onCrear={handleCrearPlan}
        onActualizar={handleEditarPlan}
      />

      <MoveToDayModal
        isOpen={Boolean(selectedPlanToMove)}
        plan={selectedPlanToMove}
        onClose={() => setSelectedPlanToMove(null)}
        onConfirm={handleConfirmMover}
      />

      <GeminiModal
        isOpen={isGeminiModalOpen}
        destino="Ciudad Autónoma de Buenos Aires (CABA), Argentina"
        onClose={() => setIsGeminiModalOpen(false)}
        onAgregarIdea={handleAgregarIdeaGemini}
        onAsignarItinerario={handleAsignarItinerarioDesdeGemini}
      />
    </div>
  );
}
