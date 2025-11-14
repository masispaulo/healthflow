import React, { useState } from 'react';
import { AnalysisResults, ScheduleEntry, FatigueRiskAnalysis } from '../types';
import { generateRosterSchedule } from '../services/rosterService';
import { getGeminiMetricExplanation } from '../services/geminiService';
import ShiftScheduleTable from './ShiftScheduleTable';
import LiveMonitor from './LiveMonitor';
import { CalculatorIcon, LightBulbIcon, UsersIcon, TrendingDownIcon, TargetIcon, CalendarDaysIcon, HourglassIcon, CoffeeIcon, SparklesIcon, XMarkIcon } from './icons';

interface RosterPlannerProps {
  analysis: AnalysisResults | null;
}

const InfoCard: React.FC<{ title: string; value: string; icon: React.ReactNode; unit?: string, onExplain?: () => void }> = ({ title, value, icon, unit, onExplain }) => (
    <div className="bg-white p-4 rounded-xl shadow-lg flex items-start gap-4 relative">
      <div className="p-3 bg-indigo-100 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">
          {value}
          {unit && <span className="text-lg font-medium text-slate-500 ml-1">{unit}</span>}
        </p>
      </div>
      {onExplain && (
        <button onClick={onExplain} className="absolute top-2 right-2 text-yellow-500 hover:text-yellow-600 p-1 rounded-full hover:bg-yellow-100 transition-colors" title={`Explicar "${title}" com IA`}>
          <SparklesIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );

const RosterPlanner: React.FC<RosterPlannerProps> = ({ analysis }) => {
  const [numDoctors, setNumDoctors] = useState(5);
  const [shiftHours, setShiftHours] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [fatigueAnalysis, setFatigueAnalysis] = useState<FatigueRiskAnalysis | null>(null);

  // State for explanation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isModalLoading, setIsModalLoading] = useState(false);

  const handleGenerateSchedule = async () => {
    if (!analysis) return;
    setIsLoading(true);
    setSchedule([]);
    setFatigueAnalysis(null);
    try {
        const { schedule: newSchedule, fatigueAnalysis: newFatigueAnalysis } = await generateRosterSchedule(analysis, numDoctors, shiftHours);
        setSchedule(newSchedule);
        setFatigueAnalysis(newFatigueAnalysis);
    } catch (error) {
        console.error("Error generating roster schedule:", error);
        alert("Falha ao gerar a escala. Verifique o console para mais detalhes ou se a chave de API está configurada corretamente.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleExplainMetric = async (metricName: string, metricValue: string | number) => {
    setModalTitle(`Análise de: ${metricName}`);
    setModalContent('');
    setIsModalOpen(true);
    setIsModalLoading(true);
    try {
        const explanation = await getGeminiMetricExplanation(metricName, metricValue);
        setModalContent(explanation);
    } catch (error) {
        console.error("Error fetching metric explanation:", error);
        setModalContent("<p>Ocorreu um erro ao buscar a explicação. Por favor, tente novamente.</p>");
    } finally {
        setIsModalLoading(false);
    }
  };


  if (!analysis) {
    return null; // Don't render if there's no analysis data
  }

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="text-indigo-600 w-6 h-6" />
            <h2 className="text-2xl font-bold text-slate-700">Planejador de Escala e Análise de Fadiga</h2>
          </div>
          <button
              onClick={handleGenerateSchedule}
              disabled={isLoading || !analysis}
              className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
              <CalculatorIcon />
              {isLoading ? 'Calculando...' : 'Gerar Escala Otimizada'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div>
              <label htmlFor="num-doctors" className="block text-sm font-medium text-slate-700 mb-1">Número de Médicos</label>
              <input
                  id="num-doctors"
                  type="number"
                  value={numDoctors}
                  onChange={(e) => setNumDoctors(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
          </div>
          <div>
              <label htmlFor="shift-hours" className="block text-sm font-medium text-slate-700 mb-1">Duração do Turno (horas)</label>
              <input
                  id="shift-hours"
                  type="number"
                  value={shiftHours}
                  onChange={(e) => setShiftHours(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
          </div>
        </div>
        
        {isLoading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">Otimizando escala e analisando riscos de fadiga com IA... Isso pode levar um momento.</p>
          </div>
        )}

        {fatigueAnalysis && (
          <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><LightBulbIcon /> Resumo da Análise de Fadiga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InfoCard title="Pico de Fadiga (Horário)" value={fatigueAnalysis.peakFatigueTime} icon={<TrendingDownIcon />} onExplain={() => handleExplainMetric("Pico de Fadiga", fatigueAnalysis.peakFatigueTime)} />
                  <InfoCard title="Média de Fadiga" value={fatigueAnalysis.averageFatigueScore.toFixed(2)} icon={<HourglassIcon />} unit="/ 100" onExplain={() => handleExplainMetric("Média de Fadiga", fatigueAnalysis.averageFatigueScore.toFixed(2))} />
                  <InfoCard title="Eficiência da Escala" value={fatigueAnalysis.scheduleEfficiency.toFixed(1)} icon={<TargetIcon />} unit="%" onExplain={() => handleExplainMetric("Eficiência da Escala", `${fatigueAnalysis.scheduleEfficiency.toFixed(1)}%`)} />
                  <InfoCard title="Descansos Recomendados" value={fatigueAnalysis.recommendedRestBlockMinutes.toFixed(0)} icon={<CoffeeIcon />} unit="min" onExplain={() => handleExplainMetric("Descansos Recomendados", `${fatigueAnalysis.recommendedRestBlockMinutes.toFixed(0)} min`)} />
              </div>
          </div>
        )}

        {schedule.length > 0 && (
          <>
            <div className="pt-4">
                <h3 className="text-lg font-bold text-slate-700 my-4 flex items-center gap-2"><UsersIcon /> Escala Gerada</h3>
                <ShiftScheduleTable schedule={schedule} />
            </div>
            <div className="pt-4">
              <LiveMonitor schedule={schedule} analysis={analysis}/>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl transform transition-all">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                        <SparklesIcon className="text-yellow-500" />
                        {modalTitle}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800">
                          <XMarkIcon className="w-6 h-6" />
                      </button>
                  </div>
                  {isModalLoading ? (
                      <div className="text-center py-10">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                          <p className="mt-3 text-slate-500">Buscando insights...</p>
                      </div>
                  ) : (
                      <div className="prose prose-slate max-w-none prose-p:my-2 prose-h4:my-3 text-slate-600" dangerouslySetInnerHTML={{ __html: modalContent }} />
                  )}
              </div>
          </div>
      )}
    </>
  );
};

export default RosterPlanner;