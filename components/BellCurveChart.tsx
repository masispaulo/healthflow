import React, { useState } from 'react';

interface BellCurveChartProps {
  mean: number;
  stdDev: number;
  targetTime: number;
}

const BellCurveChart: React.FC<BellCurveChartProps> = ({ mean, stdDev, targetTime }) => {
  const [hoverX, setHoverX] = useState<number | null>(null);

  // 1. PROTEÇÃO CONTRA DADOS ZERADOS
  const safeMean = (!mean || isNaN(mean)) ? 0 : mean;
  const visualStdDev = (!stdDev || stdDev <= 0 || isNaN(stdDev)) ? (safeMean * 0.2 || 1) : stdDev;

  if (safeMean === 0 && (!mean || mean !== 0)) {
     return (
       <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/30 rounded border border-dashed border-slate-700 text-slate-500 text-xs gap-2">
          <span>Aguardando dados...</span>
       </div>
     );
  }

  // 2. MATEMÁTICA DA CURVA (Centralização Perfeita)
  // Abrimos 4 desvios para cada lado. A média fica EXATAMENTE no meio (50%).
  const range = visualStdDev * 4; 
  const startX = safeMean - range;
  const endX = safeMean + range;
  
  const points = [];
  const steps = 120; // Mais suave
  for (let i = 0; i <= steps; i++) {
    const x = startX + (i * (endX - startX)) / steps;
    const exponent = -0.5 * Math.pow((x - safeMean) / visualStdDev, 2);
    const y = (1 / (visualStdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    points.push({ x, y });
  }

  const maxY = Math.max(...points.map(p => p.y)) || 1;

  // Conversão para Coordenadas SVG (0 a 100)
  const getSvgX = (val: number) => ((val - startX) / (endX - startX)) * 100;
  // Ajustamos o topo para 5 (quase tocando a borda) e base 95
  const getSvgY = (val: number) => 95 - (val / maxY) * 90; 

  const pathD = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${getSvgX(p.x).toFixed(2)} ${getSvgY(p.y).toFixed(2)}`
  ).join(' ');

  const areaD = `${pathD} L 100 100 L 0 100 Z`; // Fecha a base

  const meanPos = getSvgX(safeMean);
  
  // 3. LÓGICA MAGNÉTICA DA LINHA VERMELHA 🧲
  // Se a meta passar do limite do gráfico, ela gruda na borda (com 2% de margem)
  let rawTargetPos = getSvgX(targetTime);
  let isClamped = false;

  if (rawTargetPos < 2) { rawTargetPos = 2; isClamped = true; }
  if (rawTargetPos > 98) { rawTargetPos = 98; isClamped = true; }
  
  const targetPos = rawTargetPos;

  // Tooltip Mouse
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX((x / rect.width) * 100);
  };

  const hoverValue = hoverX !== null 
    ? (startX + (hoverX / 100) * (endX - startX)).toFixed(1)
    : null;

  return (
    <div className="w-full h-full relative select-none font-sans group">
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none" 
        className="w-full h-full overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverX(null)}
      >
        <defs>
          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
            <stop offset="90%" stopColor="#818cf8" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Linha de Base */}
        <line x1="0" y1="95" x2="100" y2="95" stroke="#475569" strokeWidth="0.5" />

        {/* Área Colorida */}
        <path d={areaD} fill="url(#purpleGradient)" stroke="none" />
        
        {/* Linha da Curva */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {/* Linha da Média (Central) */}
        <line x1={meanPos} y1={95} x2={meanPos} y2={10} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3" opacity="0.5" />

        {/* --- LINHA VERMELHA (META) --- */}
        {!isNaN(targetPos) && (
           <g className="transition-all duration-300 ease-out">
             {/* A Linha */}
             <line 
                x1={targetPos} y1={95} x2={targetPos} y2={5} 
                stroke="#f87171" 
                strokeWidth={isClamped ? 3 : 2} 
                strokeDasharray={isClamped ? "" : "4 2"} 
                className={isClamped ? "opacity-50" : "opacity-100"}
             />
             {/* O Texto "META" no topo da linha */}
             <text x={targetPos} y={4} fill="#f87171" fontSize="4" fontWeight="bold" textAnchor="middle">META</text>
           </g>
        )}

        {/* Tooltip Linha Mouse */}
        {hoverX !== null && (
          <line x1={hoverX} y1={95} x2={hoverX} y2={10} stroke="#cbd5e1" strokeWidth="0.5" />
        )}
      </svg>

      {/* Label Média na base */}
      <div className="absolute bottom-0 text-[10px] text-slate-400 transform -translate-x-1/2 flex flex-col items-center pointer-events-none" style={{ left: `${meanPos}%` }}>
        <span className="bg-slate-900 px-1 rounded text-xs font-bold text-white">{safeMean.toFixed(0)}</span>
      </div>

      {/* Tooltip Flutuante */}
      {hoverX !== null && (
        <div className="absolute top-1/2 bg-slate-900/90 backdrop-blur border border-slate-600 p-2 rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-50 min-w-[80px]" style={{ left: `${hoverX}%` }}>
          <p className="text-[10px] text-slate-400 text-center uppercase">Tempo</p>
          <p className="text-lg font-bold text-white text-center">{hoverValue} <span className="text-xs font-normal">min</span></p>
        </div>
      )}
    </div>
  );
};

export default BellCurveChart;