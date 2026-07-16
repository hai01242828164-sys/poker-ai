import React, { useState, useEffect, useMemo, useRef } from 'react';
import PlayerAvatar from './PlayerAvatar';
import AIAdvisor from './AIAdvisor';
import ActionPanel from './ActionPanel';
import { startSession, sendAction, getAIPrediction } from '../services/api';
import pokersolver from 'pokersolver';
const Hand = pokersolver.Hand;

const STREETS = ['PRE_FLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'];

function getPositionLabels(numPlayers) {
    if (numPlayers === 2) return ['SB/BTN', 'BB'];
    if (numPlayers === 3) return ['BTN', 'SB', 'BB'];
    const labels = ['SB', 'BB'];
    if (numPlayers === 4) labels.push('UTG');
    else if (numPlayers === 5) labels.push('UTG', 'CO');
    else if (numPlayers === 6) labels.push('UTG', 'MP', 'CO');
    else if (numPlayers === 7) labels.push('UTG', 'UTG+1', 'MP', 'CO');
    else if (numPlayers === 8) labels.push('UTG', 'UTG+1', 'MP', 'MP+1', 'CO');
    else if (numPlayers === 9) labels.push('UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'CO');
    else if (numPlayers === 10) labels.push('UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'MP+2', 'CO');
    labels.push('BTN');
    labels.push('BTN');
    return labels;
}

const getPlayerTag = (profile) => {
    if (!profile || profile.hands < 3) return { text: 'Unknown', color: 'bg-gray-600' };
    const vpip = (profile.vpipHands / profile.hands) * 100;
    const pfr = (profile.pfrHands / profile.hands) * 100;
    const af = profile.postflopCalls === 0 ? (profile.postflopBets > 0 ? 10 : 0) : (profile.postflopBets / profile.postflopCalls);

    if (vpip > 40 && pfr > 30) return { text: 'Maniac', color: 'bg-red-600' };
    if (vpip > 30 && pfr < 10) return { text: 'Station', color: 'bg-green-600' };
    if (vpip >= 25 && vpip <= 40 && pfr >= 20) return { text: 'LAG', color: 'bg-orange-500' };
    if (vpip >= 15 && vpip < 25 && pfr >= 12) return { text: 'TAG', color: 'bg-blue-600' };
    if (vpip < 15 && pfr < 12) return { text: 'Nit', color: 'bg-purple-600' };
    
    return { text: 'Normal', color: 'bg-gray-500' };
};

const toPokerSolverCard = (cardStr) => {
    const match = cardStr.trim().toLowerCase().match(/^(\d+)([crnb])$/);
    if (!match) return null;
    let val = parseInt(match[1]);
    let rank = val.toString();
    if (val === 1) rank = 'A';
    else if (val === 10) rank = 'T';
    else if (val === 11) rank = 'J';
    else if (val === 12) rank = 'Q';
    else if (val === 13) rank = 'K';

    let suit = 's';
    if (match[2] === 'c') suit = 'h'; // cơ
    if (match[2] === 'r') suit = 'd'; // rô
    if (match[2] === 'n') suit = 'c'; // nhép
    if (match[2] === 'b') suit = 's'; // bích

    return rank + suit;
};

const PokerCard = ({ cardStr }) => {
    const match = cardStr.trim().toLowerCase().match(/^(\d+)([crnb])$/);
    if (!match) return null;
    let val = parseInt(match[1]);
    if (val === 1) val = 'A';
    else if (val === 11) val = 'J';
    else if (val === 12) val = 'Q';
    else if (val === 13) val = 'K';
    
    let suit = { s: '?', c: 'text-gray-900' };
    if (match[2] === 'c') suit = { s: '♥', c: 'text-red-600' }; // cơ
    if (match[2] === 'r') suit = { s: '♦', c: 'text-red-600' }; // rô
    if (match[2] === 'n') suit = { s: '♣', c: 'text-gray-900' }; // nhép
    if (match[2] === 'b') suit = { s: '♠', c: 'text-gray-900' }; // bích

    return (
        <div className="bg-white rounded w-10 h-14 flex flex-col items-center justify-center border border-gray-400 shadow-md">
            <div className={`text-base font-bold leading-none ${suit.c}`}>{val}</div>
            <div className={`text-xl leading-none ${suit.c}`}>{suit.s}</div>
        </div>
    );
};

const RenderCards = ({ input }) => {
    const parts = input.split(' ').filter(p => p.length >= 2);
    if (parts.length === 0) return null;
    return (
        <div className="flex gap-1 justify-center pointer-events-none my-1">
            {parts.map((p, i) => <PokerCard key={i} cardStr={p} />)}
        </div>
    );
};

export default function GameTable({ tableConfig, globalProfiles, onHandComplete }) {
    const { num_players, dealer_seat, hero_seat, small_blind, big_blind } = tableConfig;
    const initData = JSON.parse(localStorage.getItem('poker_mid_hand_save')) || {};

    const [sessionId, setSessionId] = useState(null);
    const [currentStreetIndex, setCurrentStreetIndex] = useState(initData.currentStreetIndex || 0);
    const currentStreet = STREETS[currentStreetIndex];
    
    const [heroCardsInput, setHeroCardsInput] = useState(initData.heroCardsInput || "");
    const [boardCardsInput, setBoardCardsInput] = useState(initData.boardCardsInput || "");
    const [villainCards, setVillainCards] = useState(initData.villainCards || {});

    const [actionHistory, setActionHistory] = useState(initData.actionHistory || []);
    const [foldedSeats, setFoldedSeats] = useState(initData.foldedSeats ? new Set(initData.foldedSeats) : new Set());
    
    const [heroCardsHidden, setHeroCardsHidden] = useState(initData.heroCardsHidden || false);
    const [boardCardsHidden, setBoardCardsHidden] = useState(initData.boardCardsHidden || false);
    
    const [aiPrediction, setAiPrediction] = useState("Sẵn sàng phân tích Real-time.");
    const [showTagInfo, setShowTagInfo] = useState(false);
    const [showWinnerModal, setShowWinnerModal] = useState(false);
    const [winnerIds, setWinnerIds] = useState(new Set());
    
    useEffect(() => {
        // Chỉ nạp state cũ 1 lần duy nhất, sau đó xoá để ép người dùng phải lưu lại nếu muốn
        localStorage.removeItem('poker_mid_hand_save');
    }, []);

    useEffect(() => {
        const handleSave = () => {
            const state = {
                currentStreetIndex, heroCardsInput, boardCardsInput, villainCards, 
                actionHistory, foldedSeats: Array.from(foldedSeats), 
                heroCardsHidden, boardCardsHidden
            };
            localStorage.setItem('poker_mid_hand_save', JSON.stringify(state));
            alert('Đã lưu trạng thái ván đấu hiện tại! Nếu thoát, lần tới sẽ tự động khôi phục.');
        };
        window.addEventListener('SAVE_MID_HAND', handleSave);
        return () => window.removeEventListener('SAVE_MID_HAND', handleSave);
    }, [currentStreetIndex, heroCardsInput, boardCardsInput, villainCards, actionHistory, foldedSeats, heroCardsHidden, boardCardsHidden]);
    
    const tableContainerRef = useRef(null);
    const [tableScale, setTableScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (tableContainerRef.current) {
                const containerWidth = tableContainerRef.current.clientWidth;
                const containerHeight = tableContainerRef.current.clientHeight;
                // Bàn gốc là 800x600. Thêm margin an toàn.
                const scaleX = containerWidth / 850;
                const scaleY = containerHeight / 650;
                setTableScale(Math.max(0.3, Math.min(scaleX, scaleY, 1))); // Tối thiểu 0.3, tối đa 1
            }
        };
        
        updateScale();
        // Delay slight resize to handle mobile orientation changes smoothly
        setTimeout(updateScale, 100);
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Tính toán góc độ, nhãn và vị trí tọa độ của tất cả các ghế
    const playersConfig = useMemo(() => {
        const labels = getPositionLabels(num_players);
        const configs = [];
        for (let i = 1; i <= num_players; i++) {
            const distanceToDealer = (i - dealer_seat + num_players) % num_players;
            // distance=1 => SB (index 0). distance=0 => BTN (index N-1)
            const labelIndex = (distanceToDealer - 1 + num_players) % num_players;
            const label = labels[labelIndex] || 'Unknown';
            // Tính toán góc độ để tạo hình móng ngựa né góc dưới-trái (Action Panel)
            const offsetFromHero = (i - hero_seat + num_players) % num_players;
            
            let angleDeg;
            if (num_players <= 2) {
                // Heads-up: Đối diện nhau
                angleDeg = offsetFromHero === 0 ? 90 : 270;
            } else if (offsetFromHero === 0) {
                // Hero luôn ở góc dưới cùng (90 độ)
                angleDeg = 90;
            } else {
                // Ép tất cả các đối thủ còn lại dồn hoàn toàn lên nửa trên của bàn (cung 215 -> 325 độ)
                // 270 là hướng 12h (trên cùng). 215 là nửa trên bên trái, 325 là nửa trên bên phải.
                // Điều này giải phóng 100% diện tích nửa dưới của màn hình, bảng Action Panel hay Showdown
                // panel có to đến mấy cũng vĩnh viễn không bao giờ có cơ hội che đè người chơi.
                const startAngle = 215;
                const endAngle = 325;
                const step = (endAngle - startAngle) / Math.max(1, (num_players - 2));
                angleDeg = startAngle + (offsetFromHero - 1) * step;
            }
            
            const angleRad = angleDeg * (Math.PI / 180);
            
            const Rx = 350;
            const Ry = 200;
            
            const left = `calc(50% + ${Math.cos(angleRad) * Rx}px)`;
            const top = `calc(50% + ${Math.sin(angleRad) * Ry}px)`;
            
            const playerDef = tableConfig.players ? tableConfig.players.find(x => x.seat === i) : null;
            const id = playerDef ? playerDef.id : `Unknown_${i}`;
            
            configs.push({ seat: i, label, id, isHero: i === hero_seat, isDealer: i === dealer_seat, left, top });
        }
        return configs;
    }, [num_players, dealer_seat, hero_seat]);

    // Thuật toán lấy người tiếp theo chưa Fold
    const getNextActiveSeat = (startSeat) => {
        let seat = startSeat;
        for (let count = 0; count < num_players; count++) {
            if (!foldedSeats.has(seat)) return seat;
            seat = (seat % num_players) + 1;
        }
        return -1; // Tất cả đã Fold
    };

    // Ai đi trước? Pre-flop: UTG. Post-flop: SB.
    const getFirstSeatOfStreet = (isPreflop) => {
        if (isPreflop) {
            if (num_players === 2) return dealer_seat; // Heads-up Dealer/SB acts first
            return getNextActiveSeat((dealer_seat + 2) % num_players + 1); // UTG acts first
        }
        return getNextActiveSeat((dealer_seat % num_players) + 1); // SB acts first
    };

    const [currentTurnSeat, setCurrentTurnSeat] = useState(() => getFirstSeatOfStreet(true));
    
    // States hỗ trợ chức năng sửa lại (Undo/Edit) Action
    const [editingSeat, setEditingSeat] = useState(null);
    const [savedTurnSeat, setSavedTurnSeat] = useState(null);

    // State focus cho vòng Showdown (để highlight avatar khi nhập bài)
    const [focusedVillainSeat, setFocusedVillainSeat] = useState(null);

    // Derived state for Pot, Current Bet, and Player Contributions
    const { pot, currentBet, currentContributions } = useMemo(() => {
        let currentPot = small_blind + big_blind;
        let cBet = big_blind;
        let cStreet = 'PRE_FLOP';
        let contribs = {};
        
        const sbPlayer = playersConfig.find(p => p.label === 'SB');
        const bbPlayer = playersConfig.find(p => p.label === 'BB');
        if (sbPlayer) contribs[sbPlayer.id] = small_blind;
        if (bbPlayer) contribs[bbPlayer.id] = big_blind;

        actionHistory.forEach(log => {
            if (log.street !== cStreet) {
                cStreet = log.street;
                cBet = 0;
                contribs = {};
            }
            if (log.action === 'Call') {
                currentPot += cBet - (contribs[log.player_id] || 0);
                contribs[log.player_id] = cBet;
            } else if (log.action === 'Raise') {
                let newBet = cBet;
                if (cBet === 0) {
                    if (log.sizing === 'Small') newBet = big_blind * 2.5;
                    else if (log.sizing === 'Medium') newBet = big_blind * 5;
                    else if (log.sizing === 'Big') newBet = big_blind * 12;
                    else newBet = big_blind * 3;
                } else {
                    if (log.sizing === 'Small') newBet = cBet * 2;
                    else if (log.sizing === 'Medium') newBet = cBet * 3;
                    else if (log.sizing === 'Big') newBet = cBet * 5;
                    else newBet = cBet * 2.5;
                }
                
                currentPot += newBet - (contribs[log.player_id] || 0);
                cBet = newBet;
                contribs[log.player_id] = cBet;
            }
        });
        
        if (currentStreet !== cStreet) {
            cBet = 0;
            contribs = {};
        }

        return { pot: currentPot, currentBet: cBet, currentContributions: contribs };
    }, [actionHistory, currentStreet, playersConfig, small_blind, big_blind]);
    
    // 1. Validation Logic (Trùng bài & Định dạng bài)
    const isValidCards = useMemo(() => {
        const regex = /^(\d+)([crnb])$/;
        
        const hCards = heroCardsInput.split(' ').filter(p => p.trim() !== '');
        const bCards = boardCardsInput.split(' ').filter(p => p.trim() !== '');
        
        let vCards = [];
        Object.values(villainCards).forEach(val => {
            vCards = vCards.concat(val.split(' ').filter(p => p.trim() !== ''));
        });

        const allCards = [...hCards, ...bCards, ...vCards];
        
        // Kiểm tra đúng định dạng
        for (let card of allCards) {
            if (!regex.test(card.trim().toLowerCase())) return false;
        }

        const uniqueCards = new Set(allCards.map(c => c.trim().toLowerCase()));
        return uniqueCards.size === allCards.length;
    }, [heroCardsInput, boardCardsInput, villainCards]);

    // Validation Logic (Số lượng lá bài trên bàn theo vòng)
    const isBoardValid = useMemo(() => {
        const regex = /^(\d+)([crnb])$/;
        if (currentStreetIndex === 0) return true; // Pre-flop
        const bCards = boardCardsInput.split(' ').filter(p => p.trim() !== '');
        
        // Bắt buộc tất cả lá bài chung phải đúng định dạng mới tính là hợp lệ
        if (!bCards.every(c => regex.test(c.trim().toLowerCase()))) return false;

        if (currentStreetIndex === 1 && bCards.length !== 3) return false; // Flop
        if (currentStreetIndex === 2 && bCards.length !== 4) return false; // Turn
        if (currentStreetIndex >= 3 && bCards.length !== 5) return false; // River & Showdown
        return true;
    }, [currentStreetIndex, boardCardsInput]);

    // 2. Dynamic Equity Calculation (Monte Carlo Simulation)
    const activePlayersCount = num_players - foldedSeats.size;
    const equity = useMemo(() => {
        if (!heroCardsHidden || heroCardsInput.length < 5 || !isValidCards) return 0;
        
        const hCards = heroCardsInput.split(' ').filter(c => c.trim() !== '').map(toPokerSolverCard).filter(Boolean);
        const bCards = boardCardsInput.split(' ').filter(c => c.trim() !== '').map(toPokerSolverCard).filter(Boolean);
        
        if (hCards.length !== 2) return 0;
        
        const knownVillains = [];
        Object.values(villainCards).forEach(val => {
            const vCards = val.split(' ').filter(c => c.trim() !== '').map(toPokerSolverCard).filter(Boolean);
            if (vCards.length === 2) {
                knownVillains.push(vCards);
            }
        });
        
        const deck = [];
        const suits = ['h', 'd', 'c', 's'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        
        for (let r of ranks) {
            for (let s of suits) {
                const card = r + s;
                let isKnownVillainCard = false;
                for (let kv of knownVillains) {
                    if (kv.includes(card)) isKnownVillainCard = true;
                }
                if (!hCards.includes(card) && !bCards.includes(card) && !isKnownVillainCard) {
                    deck.push(card);
                }
            }
        }
        
        let wins = 0;
        let ties = 0;
        const iterations = 500;
        const numVillains = Math.max(1, activePlayersCount - 1);
        const unknownVillainsCount = Math.max(0, numVillains - knownVillains.length);
        
        for (let i = 0; i < iterations; i++) {
            const currentDeck = [...deck];
            for (let j = currentDeck.length - 1; j > 0; j--) {
                const k = Math.floor(Math.random() * (j + 1));
                [currentDeck[j], currentDeck[k]] = [currentDeck[k], currentDeck[j]];
            }
            
            const neededBoard = 5 - bCards.length;
            const simBoard = [...bCards];
            let deckIndex = 0;
            
            for (let b = 0; b < neededBoard; b++) {
                simBoard.push(currentDeck[deckIndex++]);
            }
            
            const heroHand = Hand.solve([...hCards, ...simBoard]);
            const allHands = [heroHand];
            
            for (let kv of knownVillains) {
                allHands.push(Hand.solve([...kv, ...simBoard]));
            }
            
            for (let v = 0; v < unknownVillainsCount; v++) {
                const vCards = [currentDeck[deckIndex++], currentDeck[deckIndex++]];
                allHands.push(Hand.solve([...vCards, ...simBoard]));
            }
            
            const winners = Hand.winners(allHands);
            let heroWon = false;
            for (let w of winners) {
                if (w === heroHand) {
                    heroWon = true;
                    break;
                }
            }
            
            if (heroWon) {
                if (winners.length === 1) wins++;
                else ties += (1 / winners.length);
            }
        }
        
        return Math.round(((wins + ties) / iterations) * 100);
    }, [heroCardsInput, boardCardsInput, heroCardsHidden, activePlayersCount, isValidCards, villainCards]);

    // 3. Street Completion Logic
    const isStreetComplete = useMemo(() => {
        const activePlayers = playersConfig.filter(p => !foldedSeats.has(p.seat));
        if (activePlayers.length <= 1) return true; // Mọi người fold hết trừ 1 người

        const playersActedThisStreet = new Set();
        actionHistory.forEach(log => {
            if (log.street === currentStreet) {
                playersActedThisStreet.add(log.player_id);
            }
        });

        const allActed = activePlayers.every(p => playersActedThisStreet.has(p.id));
        const allMatched = activePlayers.every(p => (currentContributions[p.id] || 0) === currentBet);

        return allActed && allMatched;
    }, [playersConfig, foldedSeats, actionHistory, currentStreet, currentContributions, currentBet]);


    useEffect(() => {
        const initGame = async () => {
            try {
                const session = await startSession(tableConfig);
                setSessionId(session.id);
            } catch (err) {
                console.error("Session Init Error:", err);
            }
        };
        initGame();
    }, [tableConfig]);

    const handleAvatarClick = (seat) => {
        if (seat !== currentTurnSeat) {
            // Cho phép nhấp vào người chơi khác để sửa Action
            setSavedTurnSeat(currentTurnSeat);
            setCurrentTurnSeat(seat);
            setEditingSeat(seat);
        }
    };

    const handleAction = async (action, timing, sizing) => {
        const actingPlayer = playersConfig.find(p => p.seat === currentTurnSeat);
        
        let updatedHistory = [...actionHistory];
        const lastIdx = updatedHistory.findLastIndex(log => log.player_id === actingPlayer.id && log.street === currentStreet);
        const isEditing = (editingSeat === currentTurnSeat);

        const newFoldedSeats = new Set(foldedSeats);
        if (action === 'Fold') {
            newFoldedSeats.add(currentTurnSeat);
        } else {
            newFoldedSeats.delete(currentTurnSeat);
        }
        setFoldedSeats(newFoldedSeats);

        const newActionLog = {
            street: currentStreet,
            player_id: actingPlayer.id,
            action: action,
            sizing: sizing || null,
            timing_tell: timing
        };

        if (isEditing && lastIdx !== -1) {
            updatedHistory[lastIdx] = newActionLog;
            setEditingSeat(null);
            setCurrentTurnSeat(savedTurnSeat);
        } else {
            updatedHistory.push(newActionLog);
            
            const nextSeatCandidate = (currentTurnSeat % num_players) + 1;
            let nextSeat = nextSeatCandidate;
            for (let count = 0; count < num_players; count++) {
                if (!newFoldedSeats.has(nextSeat)) break;
                nextSeat = (nextSeat % num_players) + 1;
            }
            setCurrentTurnSeat(nextSeat);
        }
        
        setActionHistory(updatedHistory);

        // GỌI API REAL-TIME (Trừ lúc Fold để tiết kiệm tài nguyên)
        if (action !== 'Fold') {
            setAiPrediction(`[${actingPlayer.label}] Đang phân tích Real-time...`);
            try {
                const mockSessionId = "e5b1c900-3b4e-4f6c-8a2b-1a9d4c7a5b3f";
                await sendAction({
                    session_id: sessionId || mockSessionId,
                    hero_cards: heroCardsInput,
                    community_cards: boardCardsInput,
                    actions_log: updatedHistory
                });
                
                const predictionData = await getAIPrediction(actingPlayer.label);
                
                if (predictionData && predictionData.history_patterns && predictionData.history_patterns.length > 0) {
                    setAiPrediction(`[${actingPlayer.label}] Range Phân cực! (${predictionData.history_patterns.length} dữ liệu mẫu)`);
                } else {
                    setAiPrediction(`[${actingPlayer.label}] Dự đoán Range: Thiếu mẫu lịch sử.`);
                }
            } catch (e) {
                setAiPrediction(`[${actingPlayer.label}] Lỗi API kết nối Real-time.`);
            }
        } else {
            setAiPrediction(`[${actingPlayer.label}] Fold.`);
        }
    };

    const handleNextStreet = () => {
        if (currentStreetIndex < STREETS.length - 1) {
            const nextIdx = currentStreetIndex + 1;
            setCurrentStreetIndex(nextIdx);
            setCurrentTurnSeat(getFirstSeatOfStreet(false));
            setAiPrediction(`Đã chuyển sang ${STREETS[nextIdx].replace('_', ' ')}. Lượt của người sau Dealer.`);
        }
    };

    const submitHandData = (winnersArray) => {
        if (onHandComplete) {
            const showdownPlayerIds = new Set();
            Object.keys(villainCards).forEach(seatStr => {
                const p = playersConfig.find(x => x.seat === parseInt(seatStr));
                if (p) showdownPlayerIds.add(p.id);
            });
            onHandComplete({ 
                actionHistory, 
                tableConfig, 
                villainCards, 
                showdownPlayerIds,
                winners: winnersArray,
                contributions: currentContributions,
                totalPot: pot
            });
        }
        setShowWinnerModal(false);
    };

    const handleCompleteHand = () => {
        const activePlayers = playersConfig.filter(p => !foldedSeats.has(p.seat));
        let determinedWinners = [];
        let autoResolved = false;

        // 1. Mọi người Fold hết, 1 người ăn Pot
        if (activePlayers.length === 1) {
            determinedWinners = [activePlayers[0]];
            autoResolved = true;
        } 
        // 2. Tự động đọ bài ở Showdown
        else if (currentStreet === 'SHOWDOWN') {
            const heroHasCards = heroCardsInput.trim().split(' ').length === 2;
            let allVillainsHaveCards = true;
            activePlayers.forEach(p => {
                if (!p.isHero) {
                    const cardsStr = villainCards[p.seat];
                    if (!cardsStr || cardsStr.trim().split(' ').length < 2) {
                        allVillainsHaveCards = false;
                    }
                }
            });

            if (heroHasCards && allVillainsHaveCards && isBoardValid) {
                try {
                    const bCards = boardCardsInput.split(' ').filter(c => c.trim() !== '').map(toPokerSolverCard).filter(Boolean);
                    const handsMap = new Map();
                    const allHands = [];
                    
                    activePlayers.forEach(p => {
                        let hCardsStr = p.isHero ? heroCardsInput : villainCards[p.seat];
                        const hCards = hCardsStr.split(' ').filter(c => c.trim() !== '').map(toPokerSolverCard).filter(Boolean);
                        const hand = Hand.solve([...hCards, ...bCards]);
                        handsMap.set(hand, p);
                        allHands.push(hand);
                    });

                    const winners = Hand.winners(allHands);
                    determinedWinners = winners.map(w => handsMap.get(w));
                    autoResolved = true;
                } catch (e) {
                    console.error("Auto resolve failed", e);
                }
            }
        }

        if (autoResolved && determinedWinners.length > 0) {
            submitHandData(determinedWinners);
        } else {
            // Không đủ dữ liệu đọ bài -> Bật Modal hỏi
            setWinnerIds(new Set());
            setShowWinnerModal(true);
        }
    };

    const handlePrevStreet = () => {
        if (currentStreetIndex > 0) {
            const prevIdx = currentStreetIndex - 1;
            
            // Lọc các action thuộc về vòng trước hoặc cũ hơn
            let updatedHistory = actionHistory.filter(log => STREETS.indexOf(log.street) <= prevIdx);
            
            // Xóa action cuối cùng của vòng trước để vòng đó chưa "Hoàn tất"
            let poppedAction = null;
            if (updatedHistory.length > 0 && updatedHistory[updatedHistory.length - 1].street === STREETS[prevIdx]) {
                poppedAction = updatedHistory.pop();
            }
            
            setActionHistory(updatedHistory);
            
            // Cập nhật lại danh sách những người đã Fold
            const newFoldedSeats = new Set();
            updatedHistory.forEach(log => {
                if (log.action === 'Fold') {
                    const p = playersConfig.find(p => p.id === log.player_id);
                    if (p) newFoldedSeats.add(p.seat);
                }
            });
            setFoldedSeats(newFoldedSeats);

            // Cắt giảm bài chung cho đúng luật của vòng trước
            const cards = boardCardsInput.trim().split(' ').filter(c => c !== '');
            if (prevIdx === 0) setBoardCardsInput("");
            else if (prevIdx === 1) setBoardCardsInput(cards.slice(0, 3).join(' '));
            else if (prevIdx === 2) setBoardCardsInput(cards.slice(0, 4).join(' '));
            
            setCurrentStreetIndex(prevIdx);
            
            // Đặt lượt đánh cho người vừa bị pop action (để họ nhập lại)
            if (poppedAction) {
                const p = playersConfig.find(p => p.id === poppedAction.player_id);
                if (p) setCurrentTurnSeat(p.seat);
            } else {
                setCurrentTurnSeat(getFirstSeatOfStreet(prevIdx === 0));
            }
            
            setAiPrediction(`Đã quay lại ${STREETS[prevIdx].replace('_', ' ')}. Vui lòng nhập lại Action cuối.`);
        }
    };

    // Tính toán thông tin cho Action Panel của người đang có lượt
    const activePlayer = playersConfig.find(p => p.seat === currentTurnSeat);
    const activePlayerContrib = activePlayer ? (currentContributions[activePlayer.id] || 0) : 0;
    const canActivePlayerCheck = activePlayerContrib === currentBet;
    const isActionDisabled = currentStreetIndex === 4 || !heroCardsHidden || isStreetComplete || !isValidCards || !isBoardValid;

    return (
        <div ref={tableContainerRef} className="flex-1 w-full h-full bg-gray-900 text-white flex flex-col relative overflow-hidden select-none font-sans">
            
            {/* Real-time AI HUD (Center Top) */}
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none w-max max-w-[80vw]">
                <div className="px-3 py-1 rounded-full font-bold text-[9px] sm:text-[10px] bg-blue-600/90 shadow-[0_0_10px_rgba(37,99,235,0.5)] flex items-center gap-1.5 w-full text-center">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse flex-shrink-0"></div>
                    <span className="truncate whitespace-nowrap">{aiPrediction}</span>
                </div>
            </div>

            {/* Control Panels Container - Floating in Corners */}
            <div className="absolute inset-0 z-40 pointer-events-none">
                
                {/* AI Advisor Panel - Top Left */}
                {currentTurnSeat === hero_seat && !isStreetComplete && heroCardsHidden && (
                    <AIAdvisor 
                        equity={equity}
                        pot={pot}
                        currentBet={currentBet}
                        heroContrib={currentContributions[playersConfig.find(p => p.isHero)?.id] || 0}
                        actionHistory={actionHistory}
                        currentStreet={currentStreet}
                        playersConfig={playersConfig}
                        globalProfiles={globalProfiles}
                        activePlayersCount={activePlayersCount}
                    />
                )}
                
                {/* Control Panel (Next Street) - Top Right */}
                <div className="absolute top-1 right-1 flex flex-col gap-1 bg-gray-800/90 p-1.5 sm:p-2 rounded-xl border border-gray-600 shadow-xl pointer-events-auto backdrop-blur-sm w-[130px] sm:w-[150px]">
                    <div className="font-bold text-gray-300 text-[9px] text-center">Giai đoạn: <span className="text-purple-400">{currentStreet.replace('_', ' ')}</span></div>
                    {activePlayersCount === 1 || currentStreet === 'SHOWDOWN' ? (
                        <button onClick={handleCompleteHand} className="bg-green-600 hover:bg-green-500 text-white px-2 py-1.5 rounded font-bold shadow-[0_0_15px_rgba(34,197,94,0.5)] transition mt-1 animate-pulse text-[10px]">
                            Hoàn tất Ván
                        </button>
                    ) : (
                        <button onClick={handleNextStreet} className="bg-purple-700 hover:bg-purple-600 text-white px-2 py-1.5 rounded font-bold shadow transition mt-1 text-[10px]">
                            Tiến Street Tiếp ➔
                        </button>
                    )}
                    
                    {currentStreetIndex > 0 && (
                        <button onClick={handlePrevStreet} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-[9px] transition mt-1 border border-gray-500">
                            ⟵ Quay lại
                        </button>
                    )}
                </div>

                {/* Hero Stats Panel - Bottom Right (Rất nhỏ, không che màn hình) */}
                <div className="absolute bottom-2 right-2 bg-gray-800/90 p-2 rounded-xl border border-blue-500/50 shadow-lg w-28 sm:w-32 pointer-events-auto backdrop-blur-sm text-center">
                    <button onClick={() => setHeroCardsHidden(false)} className="text-[10px] sm:text-xs font-bold text-blue-400 hover:text-blue-300 underline mb-1">
                        + Nhập Bài Tẩy
                    </button>
                    {heroCardsHidden && heroCardsInput.length >= 4 && (
                        <div className="mt-1 border-t border-gray-700/50 pt-1">
                            <div className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-wider">Tỉ lệ thắng</div>
                            <div className="text-sm sm:text-base font-bold text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                                {equity}%
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Action Panel / Showdown Panel - Bottom Left */}
                <div className="absolute bottom-1 left-1 w-48 sm:w-56 pointer-events-auto origin-bottom-left">
                    {currentStreet === 'SHOWDOWN' ? (
                        <div className="bg-gray-800/95 backdrop-blur p-4 rounded-xl border border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.3)] w-full">
                            <h3 className="text-yellow-400 font-bold text-sm mb-2 border-b border-gray-700 pb-2">🃏 Nhập Bài Đối Thủ</h3>
                            <p className="text-[10px] text-gray-400 mb-3 leading-tight">Nhập bài lật (nếu có) để AI tự động đọ bài & lưu lịch sử.</p>
                            <div className="max-h-[35vh] overflow-y-auto space-y-3 pr-1">
                                {playersConfig.filter(p => !foldedSeats.has(p.seat) && !p.isHero).map(p => (
                                    <div key={p.id} className="flex flex-col gap-1 bg-gray-900/50 p-2 rounded border border-gray-700">
                                        <div className="text-xs font-bold text-gray-300">
                                            Ghế {p.seat} <span className="text-gray-500 font-normal">({p.label})</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <input 
                                                type="text" 
                                                value={villainCards[p.seat] || ''} 
                                                onChange={e => setVillainCards({...villainCards, [p.seat]: e.target.value})} 
                                                onFocus={() => setFocusedVillainSeat(p.seat)}
                                                onBlur={() => setFocusedVillainSeat(null)}
                                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs font-mono text-center outline-none focus:border-yellow-500 shadow-inner transition-colors" 
                                                placeholder="VD: 1c 13b" 
                                            />
                                            <RenderCards input={villainCards[p.seat] || ''} />
                                        </div>
                                    </div>
                                ))}
                                {playersConfig.filter(p => !foldedSeats.has(p.seat) && !p.isHero).length === 0 && (
                                    <div className="text-xs text-gray-500 italic text-center py-2">Không còn đối thủ nào.</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="scale-90 origin-bottom-left">
                            <ActionPanel 
                                isActive={!isActionDisabled} 
                                isPostFlop={currentStreetIndex >= 1} 
                                canCheck={canActivePlayerCheck} 
                                onAction={handleAction} 
                                playerName={activePlayer ? `Ghế ${activePlayer.seat} - ${activePlayer.label}` : ''} 
                                isHero={activePlayer ? activePlayer.isHero : false}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Scaled Poker Table Area */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div style={{ transform: `scale(${tableScale})`, width: '800px', height: '600px' }} className="relative origin-center pointer-events-auto">
                    
                    {/* The Poker Table Oval Background */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-green-800 rounded-[200px] border-[16px] border-amber-900 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                    </div>

            {/* Dynamic Rendering of N Players in Circular Pattern */}
            {playersConfig.map(p => {
                const myContrib = currentContributions[p.id] || 0;
                const canCheck = myContrib === currentBet;
                const isPDisabled = currentStreetIndex === 4 || !heroCardsHidden || isStreetComplete || !isValidCards || !isBoardValid;

                const playerLogs = actionHistory.filter(log => log.player_id === p.id);
                let lastActionText = null;
                let isLastFolded = false;
                
                if (playerLogs.length > 0) {
                    const lastLog = playerLogs[playerLogs.length - 1];
                    lastActionText = `${lastLog.action}${lastLog.sizing ? ' ' + lastLog.sizing : ''}`;
                    isLastFolded = lastLog.action === 'Fold';
                }

                const profile = globalProfiles && globalProfiles[p.id];
                const tag = getPlayerTag(profile);

                return (
                    <div key={p.seat} style={{ left: p.left, top: p.top }} className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${currentTurnSeat === p.seat && !isPDisabled ? 'z-50' : 'z-20'}`}>
                        {/* Hiển thị 2 Action gần nhất của người chơi */}
                        {lastActionText && (
                            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs px-2 py-0.5 rounded border whitespace-nowrap z-10 shadow-lg font-bold transition-all ${isLastFolded ? 'bg-red-900 border-red-500 text-red-200' : 'bg-gray-800 border-blue-500 text-blue-300'}`}>
                                {lastActionText}
                            </div>
                        )}
                        
                        <PlayerAvatar 
                            seat={p.seat} 
                            label={p.label} 
                            isHero={p.isHero} 
                            isActive={currentTurnSeat === p.seat} 
                            hasFolded={foldedSeats.has(p.seat)}
                            canCheck={canCheck}
                            disableAll={isPDisabled}
                            isPostFlop={currentStreetIndex >= 1}
                            onAction={handleAction} 
                            onAvatarClick={setEditingSeat}
                            isFocused={focusedVillainSeat === p.seat}
                        />

                        {/* Tag Badge */}
                        <div onClick={() => setShowTagInfo(true)} className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[9px] px-1.5 py-0.5 rounded font-bold shadow-lg whitespace-nowrap z-30 cursor-pointer hover:scale-110 transition-transform flex items-center gap-1 ${tag.color}`}>
                            <span>{tag.text} {profile && profile.hands > 0 ? `(${profile.hands})` : ''}</span>
                            <span className="text-[7px] bg-black/30 rounded-full w-3 h-3 flex items-center justify-center">?</span>
                        </div>
                        
                        {/* Biểu tượng Dealer (D) gắn kèm */}
                        {p.isDealer && (
                            <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white text-black text-xs font-bold flex items-center justify-center rounded-full shadow-lg border-2 border-gray-400 z-30">
                                D
                            </div>
                        )}
                        
                    </div>
                );
            })}
            
            </div>
            
            {/* Board Cards and Pot (Center of Table - Outside Scale) */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 ${!isBoardValid ? 'z-[60]' : 'z-30'} pointer-events-none`}>
                <div className="bg-gray-900 bg-opacity-80 px-6 py-2 rounded-full border border-green-500 text-xl font-bold text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                    Pot: ${pot}
                </div>
                {currentStreetIndex >= 1 && (
                    <div className="flex flex-col items-center relative group pointer-events-auto">
                        <div className="cursor-pointer" onClick={() => setBoardCardsHidden(false)}>
                            <RenderCards input={boardCardsInput} />
                            {boardCardsHidden && isBoardValid && boardCardsInput.trim() !== '' && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 rounded-lg transition-opacity text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-[1px]">
                                    Chỉnh sửa
                                </div>
                            )}
                        </div>
                        
                        {(!boardCardsHidden || !isBoardValid || boardCardsInput.trim() === '') && (
                            <div className="flex flex-col gap-1 items-center mt-2 bg-gray-800/80 p-2 rounded-lg border border-gray-600 backdrop-blur-sm">
                                <div className="flex gap-1 items-center">
                                    <input type="text" value={boardCardsInput} onChange={e => setBoardCardsInput(e.target.value)} className={`w-32 bg-gray-700/80 border rounded px-2 py-1 text-white outline-none font-mono text-center shadow-inner text-sm ${!isBoardValid ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-600'}`} placeholder="Nhập: 10c 12r 2b" autoFocus />
                                    <button onClick={() => setBoardCardsHidden(true)} disabled={!isBoardValid || boardCardsInput.trim() === ''} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-1 px-3 rounded text-xs transition">Xong</button>
                                </div>
                                {!isBoardValid && boardCardsInput.length > 0 && (
                                    <span className="text-red-400 text-[9px] font-bold">Sai định dạng hoặc trùng lặp!</span>
                                )}
                            </div>
                        )}
                        
                        {heroCardsHidden && !isBoardValid && activePlayersCount > 1 && (
                            <div className="absolute -bottom-28 bg-blue-900 bg-opacity-90 px-4 py-2 rounded-lg border border-blue-400 shadow-xl w-max animate-bounce">
                                <span className="text-blue-200 font-bold text-sm">
                                    {currentStreetIndex === 1 && "Nhập 3 lá Flop để tiếp tục!"}
                                    {currentStreetIndex === 2 && "Nhập thêm 1 lá Turn để tiếp tục!"}
                                    {currentStreetIndex >= 3 && "Nhập thêm 1 lá River để tiếp tục!"}
                                </span>
                            </div>
                        )}
                        {!isValidCards && (
                            <div className="absolute -bottom-28 text-red-100 font-bold bg-red-600 px-4 py-2 rounded-lg shadow-xl animate-pulse w-max">
                                Sai định dạng bài! (VD: 1c, 13b)
                            </div>
                        )}
                    </div>
                )}
            </div>
            </div>
            
            {/* Overlay thông báo Kết thúc vòng cược */}
            {isStreetComplete && currentStreet !== 'SHOWDOWN' && activePlayersCount > 1 && (
                <div className="absolute inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center pointer-events-none">
                    <div className="bg-purple-900 px-8 py-5 rounded-2xl border-2 border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.6)] flex flex-col items-center pointer-events-auto transform transition animate-bounce">
                        <span className="text-white text-2xl font-bold mb-4 drop-shadow">Vòng cược đã hoàn tất!</span>
                        <button onClick={handleNextStreet} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all">
                            Chuyển sang {currentStreetIndex < STREETS.length - 1 ? STREETS[currentStreetIndex + 1].replace('_', ' ') : ''} ➔
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Nhập Bài Tẩy (Thay thế cho Panel cũ) */}
            {!heroCardsHidden && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 pointer-events-auto backdrop-blur-sm">
                    <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border-2 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.5)] flex flex-col items-center">
                        <h2 className="text-xl font-bold text-blue-400 mb-4">Nhập Bài Tẩy (Hero)</h2>
                        <div className="flex flex-col gap-4 w-full relative">
                            <div className="scale-125 origin-center my-2 flex justify-center">
                                <RenderCards input={heroCardsInput} />
                            </div>
                            <input type="text" value={heroCardsInput} onChange={e => setHeroCardsInput(e.target.value)} className={`w-full bg-gray-900 border-2 rounded-xl p-4 text-white outline-none font-mono text-center shadow-inner text-2xl tracking-widest ${!isValidCards ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-600 focus:border-blue-400'}`} placeholder="VD: 1c 13b" autoFocus />
                            
                            {!isValidCards && (
                                <div className="text-red-400 font-bold text-center animate-pulse">
                                    Lỗi: Trùng lá bài hoặc sai định dạng!
                                </div>
                            )}
                            
                            <div className="text-blue-300 text-sm font-bold text-center animate-pulse">
                                Hãy nhập và Khóa bài để bắt đầu / tiếp tục chơi!
                            </div>
                            
                            <button onClick={() => setHeroCardsHidden(true)} disabled={heroCardsInput.length < 5 || !isValidCards} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl text-lg transition-all shadow-lg mt-2 uppercase tracking-wide">
                                Khóa & Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tag Info Modal */}
            {showTagInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100] p-4">
                    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-2xl border border-gray-600 shadow-2xl overflow-y-auto max-h-full pointer-events-auto">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                            <h2 className="text-xl font-bold text-blue-400">📖 Bảng tra cứu Nhãn dán (Player Tags)</h2>
                            <button onClick={() => setShowTagInfo(false)} className="text-gray-400 hover:text-white font-bold text-2xl leading-none">&times;</button>
                        </div>
                        <div className="space-y-4 text-sm text-gray-300">
                            <p>Hệ thống tự động phân loại người chơi dựa trên các chỉ số VPIP (Tự nguyện bỏ tiền vào Pot) và PFR (Raise trước Flop) qua các ván đấu.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-900 p-3 rounded border-l-4 border-red-500">
                                    <span className="font-bold text-red-500 block mb-1">[Maniac] - Kẻ điên</span>
                                    VPIP &gt; 40%, PFR &gt; 30%. Đánh cực kỳ hổ báo, raise và bluff vô tội vạ.
                                </div>
                                <div className="bg-gray-900 p-3 rounded border-l-4 border-cyan-400">
                                    <span className="font-bold text-cyan-400 block mb-1">[Station] - Máy gọi (Calling Station)</span>
                                    VPIP &gt; 30%, PFR &lt; 10%. Rất lười Raise nhưng lại không bao giờ chịu Fold.
                                </div>
                                <div className="bg-gray-900 p-3 rounded border-l-4 border-yellow-400">
                                    <span className="font-bold text-yellow-400 block mb-1">[LAG] - Hổ báo (Loose Aggressive)</span>
                                    VPIP &ge; 25%, PFR &ge; 20%. Đánh rất rộng và liên tục gây áp lực.
                                </div>
                                <div className="bg-gray-900 p-3 rounded border-l-4 border-blue-400">
                                    <span className="font-bold text-blue-400 block mb-1">[TAG] - Chặt chẽ (Tight Aggressive)</span>
                                    VPIP 15-25%, PFR 12-20%. Chỉ đánh bài mạnh và một khi đã đánh là sẽ raise.
                                </div>
                                <div className="bg-gray-900 p-3 rounded border-l-4 border-green-400">
                                    <span className="font-bold text-green-400 block mb-1">[Nit] - Kẻ nhát gan / Đá tảng</span>
                                    VPIP &lt; 15%, PFR &lt; 12%. Chỉ chờ 2 con Xì (AA) hoặc Già (KK) mới chơi.
                                </div>
                                <div className="bg-gray-900 p-3 rounded border-l-4 border-gray-500">
                                    <span className="font-bold text-gray-400 block mb-1">[Unknown] - Chưa rõ</span>
                                    Chưa đủ 3 ván bài để hệ thống phân tích.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Winner Selection Modal (Hiển thị khi không thể tự động đọ bài) */}
            {showWinnerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[200] p-4 pointer-events-auto">
                    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-sm border border-yellow-600 shadow-2xl animate-pulse-slow">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                            <h2 className="text-xl font-bold text-yellow-500">🏆 Chọn Người Thắng</h2>
                        </div>
                        <p className="text-sm text-gray-300 mb-4">
                            Có đối thủ úp bài không lật (Muck), hệ thống không đủ dữ kiện để tự động đọ bài. Vui lòng chọn (các) người gom Pot:
                        </p>
                        
                        <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                            {playersConfig.filter(p => !foldedSeats.has(p.seat)).map(p => {
                                const isSelected = winnerIds.has(p.id);
                                return (
                                    <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-yellow-900 border-yellow-500 text-yellow-200' : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-700'}`}>
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded text-yellow-500"
                                            checked={isSelected}
                                            onChange={(e) => {
                                                const newSet = new Set(winnerIds);
                                                if (e.target.checked) newSet.add(p.id);
                                                else newSet.delete(p.id);
                                                setWinnerIds(newSet);
                                            }}
                                        />
                                        <span className="font-bold">Ghế {p.seat} {p.isHero ? '(Hero)' : `(${p.label})`}</span>
                                    </label>
                                );
                            })}
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowWinnerModal(false)} 
                                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded transition-colors"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={() => {
                                    if (winnerIds.size === 0) return alert("Vui lòng chọn ít nhất 1 người thắng!");
                                    const winnersArray = playersConfig.filter(p => winnerIds.has(p.id));
                                    submitHandData(winnersArray);
                                }}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded shadow-[0_0_15px_rgba(202,138,4,0.5)] transition-colors"
                            >
                                Chốt Xong!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
