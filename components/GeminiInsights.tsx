
import React from 'react';
import { SparklesIcon } from './icons';

interface GeminiInsightsProps {
  insights: string;
  isLoading: boolean;
  onGenerate: () => void;
  hasAnalysis: boolean;
}

const GeminiInsights: React.FC<GeminiInsightsProps> = ({ insights, isLoading, onGenerate, hasAnalysis }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
            <SparklesIcon className="text-yellow-500 w-6 h-6" />
            <h2 className="text-2xl font-bold text-slate-700">Análise com Gemini AI</h2>
        </div>
        <button
          onClick={onGenerate}
          disabled={isLoading || !hasAnalysis}
          className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-300 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Gerando...' : 'Gerar Análise'}
        </button>
      </div>
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">Analisando dados... Por favor, aguarde.</p>
        </div>
      ) : insights ? (
        <div 
          className="prose prose-slate max-w-none prose-p:my-2 prose-headings:my-3" 
          dangerouslySetInnerHTML={{ __html: insights }}
        />
      ) : (
        <div className="text-center py-10 px-6 bg-slate-50 rounded-lg">
          <p className="text-slate-500">Clique em "Gerar Análise" para obter insights sobre seus dados.</p>
          <p className="text-sm text-slate-400 mt-2">A IA irá traduzir os dados estatísticos em linguagem gerencial e clínica.</p>
        </div>
      )}
    </div>
  );
};

export default GeminiInsights;
