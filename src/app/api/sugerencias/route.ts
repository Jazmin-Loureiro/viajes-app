import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface SugerenciaRequest {
  consulta: string;
  destino?: string;
}

export interface IdeaSugerida {
  titulo: string;
  categoria: string;
  notas: string;
  ubicacion?: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "La variable de entorno GEMINI_API_KEY no está configurada en el servidor.",
        },
        { status: 500 },
      );
    }

    let body: SugerenciaRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Cuerpo de solicitud inválido. Debe enviar JSON." },
        { status: 400 },
      );
    }

    const { consulta, destino } = body;

    if (!consulta || typeof consulta !== "string" || !consulta.trim()) {
      return NextResponse.json(
        { error: "El campo 'consulta' es obligatorio." },
        { status: 400 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Actúa como un guía de viajes experto y conciso, recomendando planes interesantes para parejas.
Sugiere entre 3 y 6 planes atractivos, románticos, entretenidos o especiales acordes a la consulta.
Usa categorías conocidas como 'comida', 'paseo', 'compras', 'cine_show', 'alojamiento' o títulos descriptivos con emoji (ej: '☕ Cafetería', '🍷 Bares / Tapas', '🌳 Naturaleza').
Cada idea debe tener:
- titulo: nombre atractivo y específico del plan o lugar
- categoria: categoría corta adecuada
- notas: breve resumen de por qué vale la pena y qué hacer allí (1 o 2 oraciones)
- ubicacion: barrio, zona o referencia geográfica si se conoce`;

    const promptText =
      destino && destino.trim()
        ? `Destino del viaje: ${destino.trim()}\nConsulta o preferencia: ${consulta.trim()}`
        : `Consulta o preferencia para el viaje: ${consulta.trim()}`;

    // Lista de modelos a intentar (con fallback por si algún modelo experimenta alta demanda temporal o deprecación)
    const modelsToTry = [
      "gemini-flash-latest",
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
    ];

    let lastError: unknown = null;
    let jsonResult: { ideas: IdeaSugerida[] } | null = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: Type.OBJECT,
              properties: {
                ideas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      titulo: {
                        type: Type.STRING,
                        description:
                          "Nombre o título atractivo del plan o lugar recomendado.",
                      },
                      categoria: {
                        type: Type.STRING,
                        description:
                          "Categoría del plan (ej: comida, paseo, compras, etc.).",
                      },
                      notas: {
                        type: Type.STRING,
                        description:
                          "Recomendación breve o tip especial para disfrutar en pareja.",
                      },
                      ubicacion: {
                        type: Type.STRING,
                        description:
                          "Barrio, calle o referencia geográfica si aplica.",
                      },
                    },
                    required: ["titulo", "categoria", "notas"],
                  },
                },
              },
              required: ["ideas"],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed && Array.isArray(parsed.ideas)) {
            jsonResult = parsed;
            break;
          }
        }
      } catch (err) {
        lastError = err;
        console.warn(
          `[Gemini API] Fallo con modelo ${model}:`,
          (err as Error)?.message || err,
        );
      }
    }

    if (!jsonResult) {
      throw (
        lastError ||
        new Error("No se obtuvo una respuesta estructurada válida del modelo.")
      );
    }

    return NextResponse.json(jsonResult);
  } catch (error) {
    console.error("[Route /api/sugerencias] Error:", error);
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error interno al comunicarse con el asistente de sugerencias.";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
