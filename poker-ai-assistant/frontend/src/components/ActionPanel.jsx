import React, { useState } from 'react';

export default function ActionPanel({ isActive, isPostFlop, canCheck, onAction, playerName, isHero }) {
    const [timing, setTiming] = useState("Lưỡng lự");
    const [showRaiseMenu, setShowRaiseMenu] = useState(false);

    if (!isActive) return null;

    return (
        <div className="bg-gray-800 p-4 rounded-xl border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] w-full max-w-sm mx-auto md:w-64">
            <div className="text-center mb-2">
                <span className="text-xs text-red-400 font-bold uppercase tracking-widest">Đến lượt hành động</span>
                <div className="text-lg font-bold text-white">{isHero ? 'Hero' : playerName}</div>
            </div>

            {/* Timing Tell Selection (Only from Flop onwards) */}
            {isPostFlop && (
                <div className="flex flex-col gap-1 border-b border-gray-600 pb-3 mb-3">
                    <div className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-wider">Thời gian quyết định</div>
                    <div className="flex gap-2 justify-center">
                        <button onClick={() => setTiming("Nhanh")} className={`flex-1 py-1.5 text-xs font-bold rounded transition ${timing === "Nhanh" ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Nhanh</button>
                        <button onClick={() => setTiming("Lưỡng lự")} className={`flex-1 py-1.5 text-xs font-bold rounded transition ${timing === "Lưỡng lự" ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Lưỡng lự</button>
                        <button onClick={() => setTiming("Chậm")} className={`flex-1 py-1.5 text-xs font-bold rounded transition ${timing === "Chậm" ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Chậm</button>
                    </div>
                </div>
            )}

            {!showRaiseMenu ? (
                <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={() => onAction("Fold", timing)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-bold transition">Fold</button>
                    {canCheck && (
                        <button onClick={() => onAction("Check", timing)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-bold transition">Check</button>
                    )}
                    <button onClick={() => onAction("Call", timing)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-bold transition">Call</button>
                    <button onClick={() => setShowRaiseMenu(true)} className="w-full mt-1 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white text-sm font-bold transition shadow-lg border border-red-500">Bet / Raise...</button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="w-full text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kích cỡ (Sizing)</div>
                    <div className="flex gap-2">
                        <button onClick={() => { setShowRaiseMenu(false); onAction("Raise", timing, "Small"); }} className="py-2 bg-red-800 hover:bg-red-600 rounded-lg text-white text-xs font-bold transition flex-1 border border-red-500">Nhỏ (≤3bb)</button>
                        <button onClick={() => { setShowRaiseMenu(false); onAction("Raise", timing, "Medium"); }} className="py-2 bg-red-700 hover:bg-red-500 rounded-lg text-white text-xs font-bold transition flex-1 border border-red-400">Vừa (3-10bb)</button>
                        <button onClick={() => { setShowRaiseMenu(false); onAction("Raise", timing, "Big"); }} className="py-2 bg-red-600 hover:bg-red-400 rounded-lg text-white text-xs font-bold transition flex-1 border border-red-300">Lớn (≥10bb)</button>
                    </div>
                    <button onClick={() => setShowRaiseMenu(false)} className="py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white text-sm font-bold transition w-full mt-2">Quay lại</button>
                </div>
            )}
        </div>
    );
}
