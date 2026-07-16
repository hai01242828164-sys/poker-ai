import React from 'react';

export default function HistoryViewer({ sessions, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-600">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>📜</span> Lịch sử Bàn chơi (Tối đa 5 bàn gần nhất)
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white font-bold text-2xl leading-none">&times;</button>
                </div>
                
                <div className="p-4 overflow-y-auto space-y-4">
                    {sessions.length === 0 ? (
                        <div className="text-center text-gray-500 py-10 font-bold">Chưa có dữ liệu bàn chơi nào được lưu.</div>
                    ) : (
                        sessions.map((session, index) => {
                            const date = new Date(session.timestamp);
                            return (
                                <div key={index} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
                                        <div className="font-bold text-blue-400">
                                            Bàn chơi #{sessions.length - index}
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">
                                            {date.toLocaleDateString()} {date.toLocaleTimeString()} | Tổng số ván: {session.handCount}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.entries(session.globalProfiles).map(([id, profile]) => {
                                            const isActive = session.config.players.find(p => p.id === id);
                                            const isHero = profile.isHero || (isActive && isActive.isHero);
                                            const seatNum = profile.lastKnownSeat || (isActive && isActive.seat) || '?';
                                            
                                            const tag = profile.tag || 'Unknown';
                                            let tagColor = 'text-gray-400';
                                            if (tag === 'Nit') tagColor = 'text-green-400';
                                            if (tag === 'TAG') tagColor = 'text-blue-400';
                                            if (tag === 'LAG') tagColor = 'text-yellow-400';
                                            if (tag === 'Station') tagColor = 'text-cyan-400';
                                            if (tag === 'Maniac') tagColor = 'text-red-500';
                                            
                                            const netChips = profile.netChips || 0;
                                            const chipColor = netChips > 0 ? 'text-green-400' : (netChips < 0 ? 'text-red-400' : 'text-gray-400');
                                            
                                            const winrate = profile.hands > 0 ? ((profile.wonHands || 0) / profile.hands) * 100 : 0;
                                            
                                            return (
                                                <div key={id} className={`bg-gray-800 p-3 rounded border ${!isActive ? 'border-gray-700 opacity-60' : 'border-gray-600'} flex flex-col gap-1`}>
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-white text-sm">Ghế {seatNum} {isHero ? '(Hero)' : ''} {!isActive ? <span className="text-xs font-normal text-gray-400 ml-1">(Đã rời)</span> : ''}</span>
                                                        <span className={`text-xs font-black ${tagColor}`}>[{tag}]</span>
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex justify-between">
                                                        <span>Winrate:</span>
                                                        <span className="text-white">{winrate.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex justify-between">
                                                        <span>Net Chip:</span>
                                                        <span className={`font-bold ${chipColor}`}>{netChips > 0 ? '+' : ''}{netChips}$</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
