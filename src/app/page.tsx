"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Plus, Sparkles, Loader2 } from "lucide-react";

export default function Home() {
  // Estados principales
  const [planes, setPlanes] = useState<PlanViaje[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"ideas" | "itinerario">("ideas");
  const [selectedCategory, setSelectedCategory] = useState<
    CategoriaPlan | "todos"
  >("todos");
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedPlanToMove, setSelectedPlanToMove] =
    useState<PlanViaje | null>(null);

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

  // Handler: Crear nuevo plan en la bolsa de ideas
  const handleCrearPlan = async (nuevoPlan: {
    titulo: string;
    categoria: CategoriaPlan;
    ubicacion: string;
    descripcion: string;
    link_maps: string;
  }) => {
    try {
      const { error } = await supabase.from("planes_viaje").insert({
        titulo: nuevoPlan.titulo,
        categoria: nuevoPlan.categoria,
        ubicacion: nuevoPlan.ubicacion || null,
        link_maps: nuevoPlan.link_maps || null,
        descripcion: nuevoPlan.descripcion || null,
        fecha: null,
        bloque: null,
        horario: null,
        completado: false,
      });

      if (error) {
        console.error("Error al crear plan:", error);
        alert("No se pudo guardar el plan. Por favor intenta de nuevo.");
      } else {
        await fetchPlanes();
      }
    } catch (err) {
      console.error("Error al crear plan:", err);
    }
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
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          ) : (
            <ItineraryView
              planes={itinerarioPlanes}
              onToggleCompletado={handleToggleCompletado}
              onEliminar={handleEliminar}
              onDescartarAideas={handleDescartarAideas}
            />
          )}
        </main>
      )}

      {/* Botones de acción flotantes (Bottom Floating Actions) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
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
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCrearPlan}
      />

      <MoveToDayModal
        isOpen={Boolean(selectedPlanToMove)}
        plan={selectedPlanToMove}
        onClose={() => setSelectedPlanToMove(null)}
        onConfirm={handleConfirmMover}
      />
    </div>
  );
}
