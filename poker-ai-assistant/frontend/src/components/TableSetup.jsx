import React, { useState } from 'react';

export default function TableSetup({ onStart }) {
    const [numPlayers, setNumPlayers] = useState(6);
    const [dealerSeat, setDealerSeat] = useState(1);
    const [heroSeat, setHeroSeat] = useState(3);
    const [sb, setSb] = useState(1);
    const [bb, setBb] = useState(2);

    const handleSubmit = (e) => {
        e.preventDefault();
        onStart({
            table_format: `${numPlayers}-max`,
            num_players: parseInt(numPlayers),
            dealer_seat: parseInt(dealerSeat),
            hero_seat: parseInt(heroSeat),
            small_blind: parseFloat(sb),
            big_blind: parseFloat(bb)
        });
    };

    return (
        <div className="absolute inset-0 overflow-y-auto bg-gray-900 text-white flex flex-col items-center p-4 font-sans">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 my-auto shrink-0 mt-8 mb-8">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Thiết Lập Bàn Chơi</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Số người chơi (2-10)</label>
                        <input type="number" min="2" max="10" value={numPlayers} onChange={(e) => setNumPlayers(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500 font-bold text-lg" required />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Ghế Dealer (1-{numPlayers})</label>
                            <input type="number" min="1" max={numPlayers} value={dealerSeat} onChange={(e) => setDealerSeat(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500 font-bold text-yellow-400" required />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Ghế Hero (1-{numPlayers})</label>
                            <input type="number" min="1" max={numPlayers} value={heroSeat} onChange={(e) => setHeroSeat(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500 font-bold text-blue-400 text-lg" required />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Small Blind ($)</label>
                            <input type="number" step="0.5" value={sb} onChange={(e) => setSb(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500 text-lg" required />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Big Blind ($)</label>
                            <input type="number" step="0.5" value={bb} onChange={(e) => setBb(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500 text-lg" required />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors mt-4 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                        Khởi Tạo Bàn Chơi
                    </button>
                </form>
            </div>
        </div>
    );
}
