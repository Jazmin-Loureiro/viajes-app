import { createClient } from "@supabase/supabase-js";

export type CategoriaPlan =
  | "comida"
  | "paseo"
  | "cine_show"
  | "compras"
  | "alojamiento"
  | "transporte"
  | (string & {});
export type BloqueHorario =
  | "todo_el_dia"
  | "mañana"
  | "mediodia"
  | "tarde"
  | "cena"
  | "noche";

export interface PlanViaje {
  id: string;
  created_at: string;
  titulo: string;
  categoria: CategoriaPlan;
  ubicacion: string | null;
  link_maps: string | null;
  descripcion: string | null;
  fecha: string | null;
  bloque: BloqueHorario | null;
  horario: string | null;
  completado: boolean;
}

export type Database = {
  public: {
    Tables: {
      planes_viaje: {
        Row: {
          id: string;
          created_at: string;
          titulo: string;
          categoria: CategoriaPlan;
          ubicacion: string | null;
          link_maps: string | null;
          descripcion: string | null;
          fecha: string | null;
          bloque: BloqueHorario | null;
          horario: string | null;
          completado: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          titulo: string;
          categoria: CategoriaPlan;
          ubicacion?: string | null;
          link_maps?: string | null;
          descripcion?: string | null;
          fecha?: string | null;
          bloque?: BloqueHorario | null;
          horario?: string | null;
          completado?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          titulo?: string;
          categoria?: CategoriaPlan;
          ubicacion?: string | null;
          link_maps?: string | null;
          descripcion?: string | null;
          fecha?: string | null;
          bloque?: BloqueHorario | null;
          horario?: string | null;
          completado?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      categoria_plan: CategoriaPlan;
      bloque_horario: BloqueHorario;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
