// @google/genai guidelines:
// 1. Import GoogleGenAI and Type
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResults, ScheduleEntry, FatigueRiskAnalysis } from "../types";

export const generateRosterSchedule = async (
    analysis: AnalysisResults,
    numDoctors: number,
    shiftHours: number
): Promise<{ schedule: ScheduleEntry[], fatigueAnalysis: FatigueRiskAnalysis }> => {
    // 2. Initialize with apiKey in a parameter object
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const shiftDurationMinutes = shiftHours * 60;

    const prompt = `
        **Contexto:** Você é um especialista em otimização de escalas para equipes médicas de emergência. Seu objetivo é criar uma escala de ${shiftHours} horas para ${numDoctors} médicos, minimizando o risco de fadiga e garantindo cobertura contínua.

        **Dados de Entrada (Análise de Procedimentos):**
        - Duração Média (μ): ${analysis.mean.toFixed(1)} minutos por procedimento.
        - Desvio Padrão (σ): ${analysis.stdDev.toFixed(1)} minutos. Isso indica a variabilidade no tempo dos procedimentos. Um valor alto significa imprevisibilidade.
        - Percentil 95: ${analysis.percentile95.toFixed(0)} minutos. 95% dos procedimentos levam menos que esse tempo. Use isso como uma estimativa de "pior caso" para a duração.

        **Regras para a Geração da Escala:**
        1.  **Duração do Turno:** ${shiftDurationMinutes} minutos.
        2.  **Equipe:** ${numDoctors} médicos.
        3.  **Modelo de Fadiga (Simplificado):**
            - Um médico começa com 0 pontos de fadiga.
            - Cada minuto 'Em Atendimento' adiciona 0.5 pontos de fadiga.
            - Cada minuto 'Em Standby' (disponível, mas não em procedimento) adiciona 0.1 pontos de fadiga.
            - Cada minuto 'Em Repouso' (pausa designada) subtrai 1 ponto de fadiga.
        4.  **Objetivos de Otimização:**
            - **Minimizar a fadiga máxima:** Nenhum médico deve exceder 200 pontos de fadiga.
            - **Garantir Cobertura:** Pelo menos 1 médico deve estar 'Em Atendimento' ou 'Em Standby' em todos os momentos.
            - **Distribuir Carga:** Tente equilibrar o tempo 'Em Atendimento' entre os médicos.
            - **Inserir Pausas:** Crie blocos de 'Em Repouso' de forma inteligente.

        **Sua Tarefa:**
        Gere uma escala detalhada e uma análise de risco de fadiga. A escala deve ser uma lista de eventos para cada médico. O horário de início do turno é 08:00.

        Responda APENAS com o objeto JSON especificado no schema.
    `;

    const scheduleEntrySchema = {
        type: Type.OBJECT,
        properties: {
            doctorName: { type: Type.STRING, description: "Nome do médico (ex: Médico 1, Médico 2)" },
            startTime: { type: Type.STRING, description: "Horário de início da atividade (formato HH:mm)" },
            endTime: { type: Type.STRING, description: "Horário de fim da atividade (formato HH:mm)" },
            duration: { type: Type.INTEGER, description: "Duração da atividade em minutos" },
            status: { type: Type.STRING, description: "Status do médico: 'Em Atendimento', 'Em Standby', ou 'Em Repouso'" }
        },
        required: ["doctorName", "startTime", "endTime", "duration", "status"]
    };

    const fatigueAnalysisSchema = {
        type: Type.OBJECT,
        properties: {
            peakFatigueTime: { type: Type.STRING, description: "Horário em que a média de fadiga da equipe atinge o pico (formato HH:mm)" },
            averageFatigueScore: { type: Type.NUMBER, description: "A pontuação média de fadiga de todos os médicos ao final do turno." },
            recommendedRestBlockMinutes: { type: Type.INTEGER, description: "Duração total, em minutos, de blocos de repouso recomendados por médico, em média." },
            totalAttendances: { type: Type.INTEGER, description: "Número total de blocos 'Em Atendimento' na escala gerada." },
            totalRestBlocks: { type: Type.INTEGER, description: "Número total de blocos 'Em Repouso' na escala gerada." },
            scheduleEfficiency: { type: Type.NUMBER, description: "Porcentagem do tempo total que os médicos passaram 'Em Atendimento' em relação ao tempo total do turno." }
        },
        required: ["peakFatigueTime", "averageFatigueScore", "recommendedRestBlockMinutes", "totalAttendances", "totalRestBlocks", "scheduleEfficiency"]
    };
    
    // 3. Use ai.models.generateContent with JSON response schema
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    schedule: {
                        type: Type.ARRAY,
                        items: scheduleEntrySchema
                    },
                    fatigueAnalysis: {
                        ...fatigueAnalysisSchema
                    }
                },
                required: ["schedule", "fatigueAnalysis"]
            }
        }
    });

    // 4. Extract text and parse JSON
    const jsonResponse = JSON.parse(response.text);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start at midnight for consistent date calculations

    const scheduleWithDates: ScheduleEntry[] = jsonResponse.schedule.map((entry: any) => {
        const [startHour, startMinute] = entry.startTime.split(':').map(Number);
        const [endHour, endMinute] = entry.endTime.split(':').map(Number);
        
        const startDate = new Date(today);
        startDate.setHours(startHour, startMinute, 0, 0);

        const endDate = new Date(today);
        endDate.setHours(endHour, endMinute, 0, 0);

        if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
        }

        return {
            ...entry,
            startTime: startDate,
            endTime: endDate,
        };
    });

    return {
        schedule: scheduleWithDates,
        fatigueAnalysis: jsonResponse.fatigueAnalysis as FatigueRiskAnalysis
    };
}
