import React, { useState } from 'react';

export default function ActionPanel({ isActive, isPostFlop, canCheck, onAction, playerName, isHero }) {
    const [timing, setTiming] = useState("Lưỡng lự");
    const [showRaiseMenu, setShowRaiseMenu] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isActive) return null;

    const handleActionClick = (actionName, sizing = null) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setTimeout(() => {
            onAction(actionName, timing, sizing);
            setIsProcessing(false);
            if (sizing) setShowRaiseMenu(false);
        }, 150);
    };

    return (
        <div className={`bg-gray-900/90 p-2 rounded-xl border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] w-full max-w-[220px] ml-0 backdrop-blur-sm transition-opacity ${isProcessing ? 'opacity-70 pointer-events-none' : ''}`}>
            
            <div className="text-center mb-1.5 border-b border-red-500/30 pb-1">
                <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest block leading-tight">Đến lượt hành động</span>
                <div className="text-sm font-bold text-white leading-tight">{isHero ? 'Hero' : playerName}</div>
            </div>

            {/* Timing Tell Selection (Siêu nhỏ) */}
            {isPostFlop && (
                <div className="flex gap-1 mb-2">
                    <button onClick={() => setTiming("Nhanh")} className={`flex-1 py-1 text-[9px] font-bold rounded transition active:scale-95 border ${timing === "Nhanh" ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>Nhanh</button>
                    <button onClick={() => setTiming("Lưỡng lự")} className={`flex-1 py-1 text-[9px] font-bold rounded transition active:scale-95 border ${timing === "Lưỡng lự" ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>Vừa</button>
                    <button onClick={() => setTiming("Chậm")} className={`flex-1 py-1 text-[9px] font-bold rounded transition active:scale-95 border ${timing === "Chậm" ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>Chậm</button>
                </div>
            )}

            {!showRaiseMenu ? (
                <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                        <button onClick={() => handleActionClick("Fold")} className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 active:scale-95 rounded text-white text-xs font-bold transition">Fold</button>
                        {canCheck ? (
                            <button onClick={() => handleActionClick("Check")} className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-600 active:scale-95 rounded text-white text-xs font-bold transition">Check</button>
                        ) : (
                            <button onClick={() => handleActionClick("Call")} className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-600 active:scale-95 rounded text-white text-xs font-bold transition">Call</button>
                        )}
                    </div>
                    <button onClick={() => setShowRaiseMenu(true)} className="w-full py-1.5 bg-red-700 hover:bg-red-600 active:scale-95 rounded text-white text-xs font-bold transition border border-red-500">Bet / Raise...</button>
                </div>
            ) : (
                <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                        <button onClick={() => handleActionClick("Raise", "Small")} className="flex-1 py-1.5 bg-red-800 active:scale-95 rounded text-white text-[9px] font-bold border border-red-500">Nhỏ (≤3bb)</button>
                        <button onClick={() => handleActionClick("Raise", "Medium")} className="flex-1 py-1.5 bg-red-700 active:scale-95 rounded text-white text-[9px] font-bold border border-red-400">Vừa</button>
                        <button onClick={() => handleActionClick("Raise", "Big")} className="flex-1 py-1.5 bg-red-600 active:scale-95 rounded text-white text-[9px] font-bold border border-red-300">Lớn (≥10bb)</button>
                    </div>
                    <button onClick={() => setShowRaiseMenu(false)} className="w-full py-1 bg-gray-600 active:scale-95 rounded text-white text-[10px] font-bold">Huỷ</button>
                </div>
            )}
        </div>
    );
}
