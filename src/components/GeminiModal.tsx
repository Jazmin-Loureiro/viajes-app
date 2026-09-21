"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Search,
  Loader2,
  Plus,
  Check,
  MapPin,
  Tag,
  Calendar,
  RefreshCw,
} from "lucide-react";

export interface IdeaSugerida {
  titulo: string;
  categoria: string;
  notas: string;
  ubicacion?: string;
}

export interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  destino?: string;
  onAgregarIdea: (idea: {
    titulo: string;
    categoria: string;
    notas: string;
    ubicacion?: string;
  }) => Promise<void> | void;
  onAsignarItinerario?: (idea: {
    titulo: string;
    categoria: string;
    notas: string;
    ubicacion?: string;
  }) => void;
}

const SUGERENCIAS_RAPIDAS = [
  "☕ Cafeterías de especialidad",
  "🍝 Dónde cenar rico",
  "🏛️ Paseos al aire libre",
  "🌧️ Qué hacer si llueve",
  "🌆 Atardeceres con linda vista",
  "🛍️ Ferias y compras",
];

export default function GeminiModal({
  isOpen,
  onClose,
  destino = "Ciudad Autónoma de Buenos Aires (CABA), Argentina", // Valor por defecto si no se pasa destino  y luego tendria que ser una varaible con el valor del detino que se ingresa al crear un nuevo viaje
  onAgregarIdea,
  onAsignarItinerario,
}: GeminiModalProps) {
  const [consulta, setConsulta] = useState("");
  const [ultimaConsulta, setUltimaConsulta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [ideas, setIdeas] = useState<IdeaSugerida[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [agregadas, setAgregadas] = useState<Set<number>>(new Set());
  const [agregandoIndex, setAgregandoIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleBuscar = async (textoABuscar?: string) => {
    const texto = (textoABuscar ?? ultimaConsulta ?? consulta).trim();
    if (!texto) return;

    setConsulta(texto);
    setUltimaConsulta(texto);

    setCargando(true);
    setError(null);
    setAgregadas(new Set());

    try {
      const res = await fetch("/api/sugerencias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ consulta: texto, destino }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error al obtener sugerencias.");
      }

      if (Array.isArray(data?.ideas)) {
        setIdeas(data.ideas);
      } else {
        setIdeas([]);
      }
    } catch (err: unknown) {
      console.error("Error buscando sugerencias:", err);
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos obtener ideas en este momento. Intenta de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  };

  const handleAgregar = async (idea: IdeaSugerida, index: number) => {
    if (agregadas.has(index)) return;

    setAgregandoIndex(index);
    try {
      await onAgregarIdea({
        titulo: idea.titulo,
        categoria: idea.categoria,
        notas: idea.notas,
        ubicacion: idea.ubicacion,
      });
      setAgregadas((prev) => new Set(prev).add(index));
    } catch (err) {
      console.error("Error agregando idea:", err);
    } finally {
      setAgregandoIndex(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleBuscar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Contenedor del Modal / Bottom sheet */}
      <div className="bg-surface rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-borderSubtle/60 animate-in slide-in-from-bottom duration-300">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-borderSubtle flex items-center justify-between bg-brand-light">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-main leading-tight flex items-center gap-1.5">
                <span>Ideas con Gemini</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand/15 text-brand px-2 py-0.5 rounded-full">
                  IA
                </span>
              </h2>
              <p className="text-xs text-content-muted font-normal">
                Sugerencias personalizadas para disfrutar en pareja
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface/90 hover:bg-surface text-content-muted hover:text-content-main flex items-center justify-center transition-colors border border-borderSubtle"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
          {/* Formulario de búsqueda */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                placeholder="Ej: Lugares para merendar en Palermo o paseos de tarde..."
                disabled={cargando}
                className="w-full pl-3.5 pr-24 py-3 bg-app border border-borderSubtle rounded-xl text-xs sm:text-sm text-content-main placeholder:text-content-muted focus:bg-surface focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
              />
              <button
                type="submit"
                disabled={cargando || !consulta.trim()}
                className="absolute right-1.5 px-3.5 py-2 rounded-lg bg-brand hover:bg-brand-hover disabled:bg-borderSubtle text-white disabled:text-content-muted text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Buscar</span>
                  </>
                )}
              </button>
            </div>

            {/* Chips de sugerencias rápidas */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-content-muted uppercase tracking-wider block">
                Ideas rápidas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGERENCIAS_RAPIDAS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={cargando}
                    onClick={() => handleBuscar(item)}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-app hover:bg-brand-light hover:text-brand hover:border-brand/30 text-content-main border border-borderSubtle transition-all active:scale-95 disabled:opacity-50"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Mensaje de error si hubo fallo */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between gap-2">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => handleBuscar()}
                className="text-xs font-bold underline shrink-0 hover:text-rose-900"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Estado de Carga */}
          {cargando && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-light text-brand flex items-center justify-center animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-content-main">
                Gemini está diseñando sugerencias para ustedes...
              </p>
              <p className="text-xs text-content-muted">
                Buscando los mejores lugares y actividades
              </p>
            </div>
          )}

          {/* Lista de Ideas generadas */}
          {!cargando && ideas.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-2 pb-1">
                <div>
                  <span className="text-xs font-bold text-content-main block">
                    Sugerencias ({ideas.length})
                  </span>
                  <span className="text-[11px] text-content-muted">
                    Toca para sumar al viaje
                  </span>
                </div>
                <button
                  type="button"
                  disabled={cargando}
                  onClick={() => handleBuscar()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-light hover:bg-brand/15 text-brand text-xs font-semibold border border-borderSubtle transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  title="Generar otras opciones con la misma búsqueda"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${cargando ? "animate-spin" : ""}`}
                  />
                  <span>Probar otras opciones</span>
                </button>
              </div>

              {ideas.map((idea, index) => {
                const yaAgregada = agregadas.has(index);
                const guardando = agregandoIndex === index;

                return (
                  <div
                    key={`${idea.titulo}-${index}`}
                    className="p-4 bg-surface hover:bg-app/40 border border-borderSubtle rounded-2xl space-y-2.5 transition-all shadow-xs"
                  >
                    {/* Cabecera: Categoría a la izquierda, Ubicación a la derecha */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-light text-brand shrink-0">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{idea.categoria}</span>
                      </span>
                      {idea.ubicacion && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-content-muted font-medium truncate ml-auto">
                          <MapPin className="w-3 h-3 shrink-0 text-content-muted" />
                          <span className="truncate">{idea.ubicacion}</span>
                        </span>
                      )}
                    </div>

                    {/* Cuerpo: Título y notas */}
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-content-main leading-snug">
                        {idea.titulo}
                      </h4>
                      {idea.notas && (
                        <p className="text-xs text-content-main leading-relaxed font-normal bg-app p-3 rounded-xl border border-borderSubtle/50">
                          {idea.notas}
                        </p>
                      )}
                    </div>

                    {/* Pie de la tarjeta: Botones de acción en fila */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-borderSubtle">
                      {/* Botón 1: [ + Guardar Idea ] */}
                      <button
                        type="button"
                        disabled={yaAgregada || guardando}
                        onClick={() => handleAgregar(idea, index)}
                        className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                          yaAgregada
                            ? "bg-emerald-100 text-emerald-800 cursor-default"
                            : "bg-app hover:bg-borderSubtle/60 text-content-main active:bg-borderSubtle border border-borderSubtle"
                        }`}
                        title="Guardar en la Bolsa de Ideas"
                      >
                        {guardando ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : yaAgregada ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>¡Agregada! ✓</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Guardar Idea</span>
                          </>
                        )}
                      </button>

                      {/* Botón 2: [ 📅 Al Itinerario ] */}
                      {onAsignarItinerario ? (
                        <button
                          type="button"
                          onClick={() => onAsignarItinerario(idea)}
                          className="h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-hover text-white shadow-xs transition-all active:scale-95"
                          title="Asignar directamente a un día y bloque en el Itinerario"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Al Itinerario</span>
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Botón inferior para generar más ideas */}
              <div className="pt-2 pb-1 flex justify-center">
                <button
                  type="button"
                  disabled={cargando}
                  onClick={() => handleBuscar()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-light hover:bg-brand/15 text-brand text-xs font-semibold border border-borderSubtle transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${cargando ? "animate-spin" : ""}`}
                  />
                  <span>🔄 Generar más ideas</span>
                </button>
              </div>
            </div>
          )}

          {/* Estado inicial sin búsqueda */}
          {!cargando && ideas.length === 0 && !error && (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-brand-light text-brand mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-content-main">
                Escribe lo que tienen ganas de hacer o elige una idea rápida
                arriba.
              </p>
              <p className="text-xs text-content-muted max-w-xs mx-auto">
                Gemini recomendará planes específicos para sumar directamente a
                la bolsa de ideas.
              </p>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-3 bg-app border-t border-borderSubtle flex items-center justify-between text-[11px] text-content-muted px-4 sm:px-5">
          <span>Potenciado por Google Gemini</span>
          <button
            type="button"
            onClick={onClose}
            className="text-content-main hover:text-brand font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
