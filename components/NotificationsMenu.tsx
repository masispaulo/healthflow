import React, { useState } from 'react';
import { useShiftExchange } from '../services/useShiftExchange';
import { User } from 'firebase/auth';

interface NotificationsMenuProps {
  user: User | null;
}

const NotificationsMenu: React.FC<NotificationsMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    incomingRequests = [],
    acceptRequest,
    rejectRequest,
    loading,
  } = useShiftExchange(user);

  const pendingCount = incomingRequests?.length || 0;

  return (
    <div className="relative">
      {/* Botão Sininho */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
        title="Notificações"
      >
        <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {pendingCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow-sm">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up origin-top-right">
            <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Notificações</h3>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                {pendingCount} novas
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {incomingRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                  <span className="text-2xl opacity-20">📭</span>
                  Nenhuma notificação nova.
                </div>
              ) : (
                incomingRequests.map((req) => (
                  <div key={req.id} className="p-4 border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border border-indigo-500/30">
                        Nova Troca
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {req.createdAt?.toDate?.() instanceof Date
                          ? req.createdAt.toDate().toLocaleDateString()
                          : 'Hoje'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 mb-2">
                      <strong className="text-white font-semibold">{req.fromUserEmail}</strong> quer transferir:
                    </p>

                    <div className="bg-slate-900 p-3 rounded-lg mb-3 border border-slate-600 border-l-4 border-l-indigo-500">
                      <p className="font-bold text-indigo-400 text-sm">
                        {req.shiftData?.title || 'Plantão sem título'}
                      </p>
                      {req.shiftData?.startTime ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span>📅</span>
                          {new Date(req.shiftData.startTime).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 mt-1">Data indefinida</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(req)}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-lg active:scale-95"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => rejectRequest(req.id)}
                        disabled={loading}
                        className="flex-1 bg-slate-700 hover:bg-red-500/80 hover:text-white text-slate-300 text-xs font-bold py-2.5 rounded-lg transition-all border border-slate-600 active:scale-95"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsMenu;