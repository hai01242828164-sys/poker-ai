import React, { useMemo, useState } from 'react';

export default function AIAdvisor({ equity, pot, currentBet, heroContrib, actionHistory, currentStreet, playersConfig, globalProfiles, activePlayersCount }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const advice = useMemo(() => {
        const callAmount = currentBet - heroContrib;
        const totalPot = pot + callAmount;
        const potOdds = callAmount === 0 ? 0 : (callAmount / totalPot) * 100;
        
        let adjustedEquity = equity;
        let reasons = [];
        
        reasons.push(`Pot Odds là ${potOdds.toFixed(1)}%. Tỉ lệ thắng nguyên bản là ${equity.toFixed(1)}%.`);
        
        // Màng lọc 1: Tìm Aggressor (Người Raise/Bet gần nhất)
        const thisStreetLogs = actionHistory.filter(log => log.street === currentStreet);
        let aggressorId = null;
        for (let i = thisStreetLogs.length - 1; i >= 0; i--) {
            if (thisStreetLogs[i].action === 'Raise' || thisStreetLogs[i].action === 'Bet') {
                aggressorId = thisStreetLogs[i].player_id;
                break;
            }
        }

        // Màng lọc 2: Tâm lý Đối thủ (Tag)
        let aggressorTag = 'Unknown';
        if (aggressorId) {
            const profile = globalProfiles[aggressorId];
            if (profile && profile.hands >= 3) {
                const vpip = (profile.vpipHands / profile.hands) * 100;
                const pfr = (profile.pfrHands / profile.hands) * 100;
                if (vpip > 40 && pfr > 30) aggressorTag = 'Maniac';
                else if (vpip > 30 && pfr < 10) aggressorTag = 'Station';
                else if (vpip >= 25 && pfr >= 20) aggressorTag = 'LAG';
                else if (vpip >= 15 && pfr >= 12) aggressorTag = 'TAG';
                else if (vpip < 15 && pfr < 12) aggressorTag = 'Nit';
            }
            
            if (aggressorTag === 'Nit') {
                adjustedEquity *= 0.85; // Giảm 15%
                reasons.push(`Đối thủ Raise là [Nit] (Siêu chặt), range bài rất mạnh -> Ép giảm Equity kỳ vọng.`);
            } else if (aggressorTag === 'Maniac' || aggressorTag === 'LAG') {
                adjustedEquity *= 1.1; // Tăng 10%
                reasons.push(`Đối thủ Raise là [${aggressorTag}] (Hổ báo/Thích Bluff) -> Tăng Equity kỳ vọng (Dễ bắt Bluff).`);
            } else if (aggressorTag === 'Station') {
                reasons.push(`Đối thủ là [Station] (Không bao giờ bỏ bài) -> Tuyệt đối không Bluff họ, chỉ Bet khi bài thực sự lớn.`);
            }
            
            // Màng lọc 4: Mạch hành động (Street-by-Street Story)
            const prevStreetLogs = actionHistory.filter(log => log.player_id === aggressorId && (log.action === 'Bet' || log.action === 'Raise'));
            const streetsAggressed = new Set(prevStreetLogs.map(l => l.street));
            if (streetsAggressed.size >= 2) {
                adjustedEquity *= 0.85;
                reasons.push(`CẢNH BÁO: Đối thủ Bet/Raise dồn dập qua ${streetsAggressed.size} vòng (Multi-barrel). Khả năng rất cao có bài thật (Monster Hand).`);
            }
            
            // Trapping detection (Generalized)
            const streetsSeq = ['PRE_FLOP', 'FLOP', 'TURN', 'RIVER'];
            const currentStreetIdx = streetsSeq.indexOf(currentStreet);
            if (currentStreetIdx > 0) {
                const prevStreet = streetsSeq[currentStreetIdx - 1];
                const prevLogs = actionHistory.filter(log => log.player_id === aggressorId && log.street === prevStreet);
                const hadAggressionPrev = prevLogs.some(l => l.action === 'Bet' || l.action === 'Raise');
                const onlyPassivePrev = prevLogs.length > 0 && !hadAggressionPrev;
                
                const aggressingNow = thisStreetLogs.some(l => l.player_id === aggressorId && (l.action === 'Raise' || l.action === 'Bet'));

                if (onlyPassivePrev && aggressingNow) {
                    adjustedEquity *= 0.7;
                    reasons.push(`CẢNH BÁO: Vòng trước kẻ này ngoan ngoãn Check/Call nhưng vòng này đột ngột Raise! Dấu hiệu Trapping (Gài bẫy) cực kỳ nguy hiểm.`);
                }
            }
        }
        
        // Màng lọc 3: Vị trí
        const heroPlayer = playersConfig.find(p => p.isHero);
        if (heroPlayer) {
            if (heroPlayer.label === 'BTN' || heroPlayer.label === 'CO') {
                adjustedEquity *= 1.05;
                reasons.push(`Lợi thế vị trí (Ngồi sau cùng) -> Có thể đánh nới lỏng hơn.`);
            } else if (heroPlayer.label === 'SB' || heroPlayer.label === 'BB' || heroPlayer.label === 'UTG') {
                adjustedEquity *= 0.95;
                reasons.push(`Bất lợi vị trí (Phải hành động trước) -> Cần bài mạnh hơn bình thường để Call.`);
            }
        }

        // Quyết định cuối cùng (EV Logic)
        let action = 'FOLD';
        let color = 'bg-red-600';
        
        if (callAmount === 0) {
            if (adjustedEquity > 65) { action = 'VALUE BET / RAISE'; color = 'bg-purple-600'; }
            else if (adjustedEquity > 40) { action = 'CHECK (Vẫn còn cơ hội)'; color = 'bg-blue-600'; }
            else { action = 'CHECK (Bài yếu)'; color = 'bg-gray-600'; }
        } else {
            if (adjustedEquity > potOdds + 20) { action = 'RAISE / ALL-IN'; color = 'bg-purple-600'; }
            else if (adjustedEquity > potOdds) { action = 'CALL (Có lãi EV)'; color = 'bg-green-600'; }
            else { action = 'FOLD'; color = 'bg-red-600'; }
        }
        
        return { action, color, reasons, adjustedEquity, potOdds };
        
    }, [equity, pot, currentBet, heroContrib, actionHistory, currentStreet, playersConfig, globalProfiles]);

    if (isCollapsed) {
        return (
            <div 
                onClick={() => setIsCollapsed(false)}
                className="absolute top-2 left-2 bg-gray-900 border border-cyan-500 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] z-50 cursor-pointer flex items-center gap-1.5 hover:bg-gray-800 transition-all pointer-events-auto"
            >
                <span className="text-xl">🤖</span>
                <span className="font-bold text-cyan-400 text-[10px] sm:text-sm">AI: <span className="text-white ml-1">{advice.action}</span></span>
            </div>
        );
    }

    return (
        <div className="absolute top-2 left-2 bg-gray-900/95 border-2 border-cyan-500 p-3 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.5)] z-50 w-64 sm:w-72 pointer-events-auto transition-all backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2 border-b border-gray-700 pb-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-xl drop-shadow-md">🧠</span>
                    <h3 className="font-bold text-cyan-400 text-sm sm:text-base">Hệ thống Cố vấn</h3>
                </div>
                <button onClick={() => setIsCollapsed(true)} className="text-gray-400 hover:text-white font-bold text-xl leading-none">&times;</button>
            </div>
            
            <div className="text-center mb-4">
                <div className="text-[10px] text-gray-400 mb-1 font-bold tracking-widest">GỢI Ý LƯỢT NÀY</div>
                <div className={`px-4 py-2.5 rounded-lg font-black text-white shadow-xl ${advice.color} transform transition-transform hover:scale-105`}>
                    {advice.action}
                </div>
            </div>
            
            <div className="space-y-2.5 text-xs text-gray-300 max-h-48 overflow-y-auto pr-1">
                {advice.reasons.map((r, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                        <span className="text-cyan-500 mt-0.5">⯈</span>
                        <p className="leading-snug">{r}</p>
                    </div>
                ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between text-xs font-mono font-bold">
                <span className={advice.adjustedEquity > advice.potOdds ? 'text-green-400' : 'text-red-400'}>
                    Tỉ lệ thắng (Adj): {advice.adjustedEquity.toFixed(1)}%
                </span>
                <span className="text-yellow-400">Pot Odds: {advice.potOdds.toFixed(1)}%</span>
            </div>
        </div>
    );
}
