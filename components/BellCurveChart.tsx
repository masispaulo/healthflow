import React, { useState } from 'react';

interface BellCurveChartProps {
  mean: number;
  stdDev: number;
  targetTime: number;
  elapsedTime?: number;
  zerado?: boolean; // Curva zerada pelo médico
}

const BellCurveChart: React.FC<BellCurveChartProps> = ({ mean, stdDev, targetTime, elapsedTime = 0, zerado }) => {
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Proteção contra dados zerados ou inválidos
  const safeMean = (!mean || isNaN(mean)) ? 0 : mean;
  const visualStdDev = (!stdDev || stdDev <= 0 || isNaN(stdDev)) ? (safeMean > 0 ? safeMean * 0.2 : 10) : stdDev;

  if (safeMean === 0 || zerado) {
     return (
      <div className="flex flex-col items-center justify-center h-full rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/30 border border-slate-700/50 p-8 backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-indigo-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <span className="text-slate-400 font-medium">{zerado ? 'Curva zerada' : 'Aguardando dados do plantão...'}</span>
        <span className="text-slate-600 text-xs mt-1">Adicione procedimentos para visualizar</span>
      </div>
     );
  }

  const range = visualStdDev * 4;
  const startX = safeMean - range;
  const endX = safeMean + range;
  const span = endX - startX;

  const points = [];
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const x = startX + (i * span) / steps;
    const exponent = -0.5 * Math.pow((x - safeMean) / visualStdDev, 2);
    const y = (1 / (visualStdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    points.push({ x, y });
  }

  const maxY = Math.max(...points.map(p => p.y)) || 1;

  const getSvgX = (val: number) => ((val - startX) / span) * 100;
  const getSvgY = (val: number) => 95 - (val / maxY) * 85;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getSvgX(p.x).toFixed(2)} ${getSvgY(p.y).toFixed(2)}`).join(' ');
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  const meanPos = getSvgX(safeMean);
  const targetPos = Math.max(0, Math.min(100, getSvgX(targetTime)));

  // Manipulação do Mouse
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setHoverX(Math.max(0, Math.min(100, x)));
  };

  // Calcula o valor em minutos para mostrar no texto
  const getHoverValue = () => {
    if (hoverX === null) return 0;
    return startX + (hoverX / 100) * (endX - startX);
  };

  return (
    <div className="w-full h-full relative select-none font-sans group rounded-2xl bg-gradient-to-b from-slate-800/40 to-transparent p-4 border border-slate-700/30">
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid meet" 
        className="w-full h-full"
        onMouseMove={handleMouseMove} 
        onMouseLeave={() => setHoverX(null)}
      >
        <defs>
          <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.05" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Eixo Base */}
        <line x1="0" y1="95" x2="100" y2="95" stroke="#334155" strokeWidth="0.4" />
        
        {/* Curva */}
        <path d={areaD} fill="url(#curveGradient)" stroke="none" />
        <path d={pathD} fill="none" stroke="#818cf8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" vectorEffect="non-scaling-stroke" />
        
        {/* Linha Média */}
        <line x1={meanPos} y1="95" x2={meanPos} y2="15" stroke="#34d399" strokeWidth="0.9" strokeDasharray="4 2" />
        <text x={meanPos} y={98} fill="#10b981" fontSize="4.5" textAnchor="middle" fontWeight="600">Média</text>

        {/* Linha Meta */}
        <line x1={targetPos} y1="95" x2={targetPos} y2="10" stroke="#f87171" strokeWidth="1" strokeDasharray="3 2" />
        <text x={targetPos} y={8} fill="#f87171" fontSize="4.5" fontWeight="bold" textAnchor="middle">META</text>

        {/* INTERAÇÃO DO MOUSE (TOOLTIP) */}
        {hoverX !== null && (
          <g>
            {/* Linha Vertical pontilhada */}
            <line x1={hoverX} y1="95" x2={hoverX} y2="15" stroke="#94a3b8" strokeWidth="0.7" strokeDasharray="2" strokeOpacity="0.9" />
            
            {/* Caixa de Texto */}
            <g transform={`translate(${Math.min(Math.max(hoverX - 22, 0), 56)}, 5)`}>
              <rect x="0" y="0" width="44" height="22" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="0.4" fillOpacity="0.96" />
              <text x="22" y="7" fill="#64748b" fontSize="3.2" textAnchor="middle" fontWeight="600">ESTIMATIVA</text>
              <text x="22" y="16" fill="#f8fafc" fontSize="4.8" textAnchor="middle" fontWeight="bold">
                {getHoverValue().toFixed(0)} min
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

export default BellCurveChart;
