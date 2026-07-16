// Force Vite HMR reload
import React, { useState, useEffect } from 'react';
import TableSetup from './components/TableSetup';
import GameTable from './components/GameTable';
import NextHandSetup from './components/NextHandSetup';
import Login from './components/Login';
import HistoryViewer from './components/HistoryViewer';

export default function App() {
    console.log("App.jsx has mounted! isAuth in localStorage:", localStorage.getItem('poker_isAuth'));
    const [isAuth, setIsAuth] = useState(() => localStorage.getItem('poker_isAuth') === 'true');
    const [gameState, setGameState] = useState(() => localStorage.getItem('poker_gameState') || 'setup');
    const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('poker_config')) || null);
    const [handCount, setHandCount] = useState(() => parseInt(localStorage.getItem('poker_handCount')) || 0);
    const [globalProfiles, setGlobalProfiles] = useState(() => JSON.parse(localStorage.getItem('poker_profiles')) || {});
    const [pastSessions, setPastSessions] = useState(() => JSON.parse(localStorage.getItem('poker_pastSessions')) || []);
    const [handHistories, setHandHistories] = useState(() => JSON.parse(localStorage.getItem('poker_handHistories')) || []);
    
    const [showHistory, setShowHistory] = useState(false);

    // Tự động lưu toàn bộ state xuống ổ cứng trình duyệt
    useEffect(() => {
        localStorage.setItem('poker_isAuth', isAuth);
        localStorage.setItem('poker_gameState', gameState);
        localStorage.setItem('poker_config', JSON.stringify(config));
        localStorage.setItem('poker_handCount', handCount);
        localStorage.setItem('poker_profiles', JSON.stringify(globalProfiles));
        localStorage.setItem('poker_pastSessions', JSON.stringify(pastSessions));
        localStorage.setItem('poker_handHistories', JSON.stringify(handHistories));
    }, [isAuth, gameState, config, handCount, globalProfiles, pastSessions, handHistories]);

    if (!isAuth) {
        return <Login onLogin={() => setIsAuth(true)} />;
    }

    const handleEndSession = () => {
        if (!window.confirm("Bạn có chắc chắn muốn Kết thúc bàn chơi hiện tại? Toàn bộ dữ liệu bàn này sẽ được lưu vào Lịch sử.")) return;
        
        if (config && handHistories.length > 0) {
            const sessionData = {
                timestamp: new Date().toISOString(),
                config,
                globalProfiles,
                handCount,
                hands: handHistories
            };
            
            setPastSessions(prev => {
                const updated = [sessionData, ...prev];
                return updated.slice(0, 5); // Chỉ giữ 5 bàn gần nhất
            });
        }
        
        setConfig(null);
        setGlobalProfiles({});
        setHandCount(0);
        setHandHistories([]);
        setGameState('setup');
    };

    const handleStart = (setupData) => {
        const players = [];
        for (let i = 1; i <= setupData.num_players; i++) {
            players.push({ seat: i, id: `Player_${Math.random().toString(36).substr(2, 6)}` });
        }
        setConfig({ ...setupData, players });
        setGameState('playing');
    };

    const handleHandComplete = (handData) => {
        if (handData && handData.actionHistory) {
            const { actionHistory, tableConfig, villainCards, winners, contributions, totalPot } = handData;
            const newProfiles = { ...globalProfiles };
            
            tableConfig.players.forEach(p => {
                if (!newProfiles[p.id]) {
                    newProfiles[p.id] = {
                        hands: 0, vpipHands: 0, pfrHands: 0, 
                        postflopBets: 0, postflopCalls: 0,
                        wentToShowdown: 0, netChips: 0, wonHands: 0,
                        originalSeat: p.seat,
                        isHero: p.isHero
                    };
                }
                newProfiles[p.id].lastKnownSeat = p.seat;
                newProfiles[p.id].isHero = p.isHero;
            });

            const playerActions = {};
            actionHistory.forEach(log => {
                if (!playerActions[log.player_id]) playerActions[log.player_id] = [];
                playerActions[log.player_id].push(log);
            });

            tableConfig.players.forEach(p => {
                const profile = newProfiles[p.id];
                const actions = playerActions[p.id] || [];
                
                profile.hands += 1;
                
                // Tính toán Chip Thắng thua
                const contrib = contributions?.[p.id] || 0;
                let wonAmount = 0;
                if (winners && winners.find(w => w.id === p.id)) {
                    wonAmount = (totalPot || 0) / winners.length;
                    profile.wonHands = (profile.wonHands || 0) + 1;
                }
                profile.netChips = (profile.netChips || 0) + (wonAmount - contrib);
                
                let vpip = false;
                let pfr = false;
                
                actions.forEach(log => {
                    if (log.street === 'PRE_FLOP') {
                        if (log.action === 'Call' || log.action === 'Raise') vpip = true;
                        if (log.action === 'Raise') pfr = true;
                    } else if (log.street !== 'SHOWDOWN') {
                        if (log.action === 'Bet' || log.action === 'Raise') profile.postflopBets += 1;
                        if (log.action === 'Call') profile.postflopCalls += 1;
                    }
                });
                
                if (vpip) profile.vpipHands += 1;
                if (pfr) profile.pfrHands += 1;
                
                if (handData.showdownPlayerIds && handData.showdownPlayerIds.has(p.id)) {
                    profile.wentToShowdown += 1;
                }
                
                // Gán Tag trực tiếp vào Profile để lưu vào Lịch sử
                let tag = 'Unknown';
                if (profile.hands >= 3) {
                    const v = (profile.vpipHands / profile.hands) * 100;
                    const pr = (profile.pfrHands / profile.hands) * 100;
                    if (v > 40 && pr > 30) tag = 'Maniac';
                    else if (v > 30 && pr < 10) tag = 'Station';
                    else if (v >= 25 && pr >= 20) tag = 'LAG';
                    else if (v >= 15 && pr >= 12) tag = 'TAG';
                    else if (v < 15 && pr < 12) tag = 'Nit';
                }
                profile.tag = tag;
            });

            setGlobalProfiles(newProfiles);
            setHandHistories(prev => [...prev, handData]);
        }
        
        setGameState('next_hand_setup');
    };

    const handleNextHand = (newConfig) => {
        setConfig(newConfig);
        setHandCount(prev => prev + 1);
        setGameState('playing');
    };

    return (
        <div className="h-full w-full overflow-hidden bg-gray-900 flex flex-col font-sans">
            {/* Yêu cầu xoay ngang trên Mobile Portrait */}
            <div className="hidden portrait:flex fixed inset-0 bg-gray-900 z-[9999] flex-col items-center justify-center p-6 text-center md:portrait:hidden">
                <div className="text-6xl mb-6 animate-pulse">🔄</div>
                <h2 className="text-2xl font-bold text-blue-400 mb-4">Vui lòng xoay ngang điện thoại</h2>
                <p className="text-gray-300 text-sm">Bàn Poker cần không gian rộng để hiển thị đầy đủ thông tin. Hãy xoay ngang màn hình để trải nghiệm tốt nhất!</p>
            </div>

            {/* Global Navbar */}
            <div className="bg-gray-900 border-b border-gray-800 p-3 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <span className="text-2xl text-blue-500">♠️</span>
                    <span className="font-bold text-gray-200 tracking-widest uppercase text-sm">Poker AI Advisor</span>
                    {config && <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded ml-2 border border-blue-900/50">Ván: {handCount + 1}</span>}
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowHistory(true)}
                        className="text-gray-400 hover:text-white font-semibold text-sm flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
                    >
                        <span>📜</span> Lịch sử
                    </button>
                    
                    {gameState === 'playing' && (
                        <button 
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('SAVE_MID_HAND'));
                            }}
                            className="bg-blue-900/40 hover:bg-blue-900/60 border border-blue-800/50 text-blue-300 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-all"
                        >
                            <span>💾</span> Lưu Ván Dở
                        </button>
                    )}
                    
                    {gameState !== 'setup' && (
                        <button 
                            onClick={handleEndSession}
                            className="bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow-red-900/20"
                        >
                            <span className="mr-1">🛑</span> Kết thúc Bàn
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative">
                {gameState === 'setup' && <TableSetup onStart={handleStart} />}
                {gameState === 'playing' && <GameTable key={handCount} tableConfig={config} globalProfiles={globalProfiles} onHandComplete={handleHandComplete} />}
                {gameState === 'next_hand_setup' && <NextHandSetup config={config} onComplete={handleNextHand} />}
            </div>
            
            {showHistory && <HistoryViewer sessions={pastSessions} onClose={() => setShowHistory(false)} />}
        </div>
    );
}
