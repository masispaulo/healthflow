// @google/genai guidelines:
// 1. Import GoogleGenAI
import { GoogleGenAI } from "@google/genai";
import { AnalysisResults } from '../types';

// Function to generate insights using Gemini AI
export const getGeminiInsights = async (analysis: AnalysisResults): Promise<string> => {
  // 2. Initialize with apiKey in a parameter object
  const ai = new GoogleGenAI({ apiKey: process.env.VITE_API_KEY! });

  const prompt = `
      Análise Estatística de Procedimentos Cirúrgicos:
      - Média de Duração (μ): ${analysis.mean.toFixed(1)} minutos.
      - Desvio Padrão (σ): ${analysis.stdDev.toFixed(1)} minutos.
      - Percentil 95: ${analysis.percentile95.toFixed(0)} minutos (95% dos procedimentos terminam antes deste tempo).
      - Total de Procedimentos Analisados: ${analysis.dataPoints.length}.

      Com base nesses dados, atue como um consultor especialista em gestão de saúde e gere uma análise concisa em português do Brasil.
      A análise deve ser apresentada em formato HTML simples.
      
      Siga esta estrutura:
      1.  <h3>Diagnóstico Geral</h3><p>Um parágrafo resumindo o que os números significam em termos de eficiência e previsibilidade.</p>
      2.  <h3>Pontos de Atenção</h3><ul><li>Dois ou três pontos chave que a gestão deve observar. Por exemplo, se o desvio padrão é alto, mencione a variabilidade e seus riscos. Se a média é alta, comente sobre possíveis gargalos.</li></ul>
      3.  <h3>Recomendação Estratégica</h3><p>Uma breve recomendação sobre como usar esses dados para otimizar o agendamento de recursos (salas, equipes, etc.).</p>

      Formate os números importantes com <strong>. Não inclua <html>, <body>, ou <head> tags, apenas o conteúdo para ser inserido em uma div.
  `;
  
  // 3. Use ai.models.generateContent with the correct model
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
  });

  // 4. Extract text using the .text property
  const insightsText = response.text;

  return insightsText;
};

// New function to get an explanation for a specific metric
export const getGeminiMetricExplanation = async (metricName: string, metricValue: string | number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

  const prompt = `
    Atue como um especialista em gestão de operações de saúde. Um usuário está analisando uma métrica de uma escala de trabalho otimizada.
    
    A métrica é: **${metricName}**
    O valor calculado é: **${metricValue}**

    Forneça uma explicação clara e concisa em português do Brasil, usando formato HTML simples (parágrafos <p> e listas <ul><li>). Siga esta estrutura:

    <h4>O que é ${metricName}?</h4>
    <p>Explique o conceito da métrica de forma simples.</p>
    
    <h4>Por que é Importante?</h4>
    <p>Descreva o impacto desta métrica na eficiência operacional, no bem-estar da equipe e na segurança do paciente.</p>
    
    <h4>Interpretando o Valor (${metricValue})</h4>
    <p>Analise o valor específico fornecido. Indique se é um resultado positivo, negativo ou neutro, e o que ele sugere sobre a escala gerada.</p>
  `;

  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
  });

  return response.text;
}


// Utility function to export data to a CSV file
export const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  if (rows.length === 0) {
    return;
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};