// src/components/FatigueChart.tsx
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Activity, Moon, Battery, AlertTriangle } from 'lucide-react';
import { calculateFatigueScore, FatigueResult } from '../services/fatigueService';

interface FatigueChartProps {
  shiftStart: Date;
  initialSleepHours: number; // A resposta do modal "Quanto dormiu?"
  currentEvents: any[];      // Histórico do plantão até agora
  currentActivity?: 'WORK' | 'STANDBY' | 'SLEEP'; // O que está fazendo AGORA
}

const FatigueChart: React.FC<FatigueChartProps> = ({ shiftStart, initialSleepHours, currentEvents, currentActivity = 'WORK' }) => {
  const [metrics, setMetrics] = useState<FatigueResult | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  // Atualiza o gráfico a cada minuto
  useEffect(() => {
    const updateStats = () => {
        const now = new Date();
        
        // 1. Calcula o Score Atual (Momento exato)
        // Adiciona um evento "fake" do último registro até AGORA para simular o tempo real
        const realTimeEvents = [...currentEvents];
        
        // Se tiver events, pega o fim do último. Se não, pega o início do plantão.
        const lastTime = realTimeEvents.length > 0 ? realTimeEvents[realTimeEvents.length-1].endTime : shiftStart;
        
        // Adiciona o "agora"
        if (now > lastTime) {
            realTimeEvents.push({
                startTime: lastTime,
                endTime: now,
                type: currentActivity
            });
        }

        const result = calculateFatigueScore(realTimeEvents);
        
        // Ajuste Inicial baseado no sono (opcional, se quiser começar com "dívida")
        // Se dormiu menos de 6h, já começa com fadiga? Por enquanto segue sua lógica de zerar.
        // result.score += (8 - initialSleepHours) * 0.5; // Exemplo de penalidade inicial
        
        setMetrics(result);

        // 2. Gera dados para o Gráfico (Histórico + Projeção)
        const data = [];
        const totalMinutes = (now.getTime() - shiftStart.getTime()) / 60000;
        const steps = 20; // Pontos no gráfico
        const stepSize = Math.max(1, Math.floor(totalMinutes / steps)); // Minutos por passo

        for (let i = 0; i <= steps; i++) {
            const timePoint = new Date(shiftStart.getTime() + (i * stepSize * 60000));
            if (timePoint > now) break;

            // Filtra eventos até esse ponto no tempo
            const pastEvents = realTimeEvents.filter(e => e.startTime < timePoint).map(e => ({
                ...e,
                endTime: e.endTime > timePoint ? timePoint : e.endTime // Corta o evento no ponto
            }));
            
            const pointScore = calculateFatigueScore(pastEvents);
            data.push({
                time: timePoint.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
                score: pointScore.score.toFixed(1),
                limit: 20
            });
        }
        setChartData(data);
    };

    updateStats();
    const interval = setInterval(updateStats, 60000); // Roda a cada 1 min
    return () => clearInterval(interval);
  }, [shiftStart, currentEvents, currentActivity, initialSleepHours]);

  if (!metrics) return <div className="p-4 text-slate-500">Calculando fadiga...</div>;

  return (
    <div className="h-full flex flex-col">
        
        {/* CABEÇALHO: SCORE GRANDE */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <h4 className="text-slate-400 text-sm uppercase font-bold mb-2">Nível de Fadiga (SAFTE-FAST)</h4>
                <div className="flex items-baseline gap-3">
                    <span className={`text-6xl font-black ${metrics.color}`}>{!isNaN(metrics.score) ? metrics.score.toFixed(1) : '0.0'}</span>
                    <span className="text-lg text-slate-500 font-bold">/ 20.0</span>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded mt-2 inline-block border ${
                    metrics.status === 'CRITICAL' ? 'bg-red-900/30 border-red-500 text-red-400' :
                    metrics.status === 'WARNING' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-400' :
                    'bg-emerald-900/30 border-emerald-500 text-emerald-400'
                }`}>
                    {metrics.label}
                </div>
            </div>

            {/* STATUS LATERAL */}
            <div className="flex flex-col gap-2 text-right">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-500 uppercase font-bold flex items-center justify-end gap-1"><Activity size={14}/> Atividade</div>
                    <div className="text-white font-mono font-bold text-base">{((metrics.dayMinutes || 0) / 60).toFixed(1)}h Dia / {((metrics.nightMinutes || 0) / 60).toFixed(1)}h Noite</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-xs text-emerald-500 uppercase font-bold flex items-center justify-end gap-1"><Battery size={14}/> Recuperação</div>
                    <div className="text-white font-mono font-bold text-base">{((metrics.recoveryMinutes || 0) / 60).toFixed(1)}h</div>
                </div>
            </div>
        </div>

        {/* GRÁFICO DE ÁREA */}
        <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={metrics.color} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={metrics.color} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#475569" tick={{fontSize: 13}} />
                    <YAxis domain={[0, 22]} stroke="#475569" tick={{fontSize: 13}} />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}}
                        itemStyle={{color: metrics.color}}
                    />
                    
                    {/* LINHAS DE LIMITE (SAFTE) */}
                    <ReferenceLine y={16.9} stroke="#facc15" strokeDasharray="3 3" label={{ value: 'Alerta (16.9)', fill: '#facc15', fontSize: 13 }} />
                    <ReferenceLine y={20.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Crítico (20.0)', fill: '#ef4444', fontSize: 13 }} />

                    <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke={metrics.color} 
                        fillOpacity={1} 
                        fill="url(#colorScore)" 
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        {metrics.status === 'CRITICAL' && (
            <div className="mt-4 bg-red-900/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                <AlertTriangle className="text-red-500" />
                <div>
                    <h5 className="font-bold text-red-400 text-sm">LIMITE DE SEGURANÇA EXCEDIDO</h5>
                    <p className="text-xs text-red-200">Recomendado pausa imediata para recuperação.</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default FatigueChart;