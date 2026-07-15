import React, { useState } from 'react';

export default function NextHandSetup({ config, onComplete }) {
    const [addPositions, setAddPositions] = useState("");
    const [removePositions, setRemovePositions] = useState("");
    const [error, setError] = useState("");

    const handleNext = () => {
        try {
            // Parse inputs
            const removes = removePositions.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            const adds = addPositions.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            
            let table = [];
            let dealerRelative = (config.dealer_seat - config.hero_seat + config.num_players) % config.num_players;
            
            for (let i = 0; i < config.num_players; i++) {
                const seat = ((i + config.hero_seat - 1) % config.num_players) + 1;
                const player = config.players ? config.players.find(p => p.seat === seat) : null;
                const id = player ? player.id : `Unknown_${seat}`;

                table.push({ 
                    relative: i, 
                    isHero: i === 0,
                    isDealer: i === dealerRelative,
                    id: id
                });
            }

            // Xử lý Bớt người (Đánh dấu xóa)
            for (let r of removes) {
                if (r === 0) throw new Error("Không thể bớt Hero (vị trí 0)!");
                if (r < 0 || r >= config.num_players) throw new Error(`Vị trí bớt ${r} không hợp lệ!`);
                table[r].toRemove = true;
            }

            // Xử lý Thêm người (Đánh dấu thêm vào TRƯỚC vị trí relative tương ứng)
            // Ví dụ: Thêm 1 -> Chèn vào giữa 0 và 1. Thêm 2 -> Chèn vào giữa 1 và 2.
            let additionsMap = {};
            for (let a of adds) {
                if (a <= 0 || a > config.num_players) throw new Error(`Vị trí thêm ${a} không hợp lệ!`);
                additionsMap[a] = (additionsMap[a] || 0) + 1;
            }

            // Xây dựng bàn mới
            let newTable = [];
            for (let i = 0; i <= config.num_players; i++) {
                // Thêm người mới trước khi push người cũ ở vị trí i
                if (additionsMap[i]) {
                    for (let k = 0; k < additionsMap[i]; k++) {
                        newTable.push({ isNew: true, id: `Player_${Math.random().toString(36).substr(2, 6)}` });
                    }
                }
                
                if (i < config.num_players) {
                    if (!table[i].toRemove) {
                        newTable.push(table[i]);
                    }
                }
            }

            // Bàn mới có bao nhiêu người?
            const newNumPlayers = newTable.length;
            if (newNumPlayers < 2) throw new Error("Bàn phải có ít nhất 2 người!");
            if (newNumPlayers > 10) throw new Error("Bàn chỉ chứa tối đa 10 người!");

            // Xác định Hero seat mới (Hero luôn nằm trong mảng)
            const heroIndex = newTable.findIndex(p => p.isHero);
            // Theo logic GameTable, seat từ 1 đến N. Ta gán Hero seat = 3 (mặc định) hoặc giữ nguyên config.hero_seat nếu có thể
            // Để UI đẹp, ta có thể fix Hero luôn ở ghế (Ví dụ: Math.floor(newNumPlayers/2) + 1)
            // Hoặc giữ nguyên hero_seat cũ, nếu vượt quá thì lấy hero_seat = newNumPlayers
            let newHeroSeat = config.hero_seat;
            if (newHeroSeat > newNumPlayers) newHeroSeat = newNumPlayers;

            // Xác định Dealer cũ nằm ở Index nào trong mảng newTable
            let oldDealerIndex = newTable.findIndex(p => p.isDealer);
            if (oldDealerIndex === -1) {
                // Nếu Dealer bị xóa, dealer sẽ là người ngồi ngay vị trí đó (hoặc người tiếp theo)
                // Ta tìm người gần nhất bên phải Dealer cũ
                let searchIdx = dealerRelative;
                while (true) {
                    searchIdx = (searchIdx + 1) % config.num_players;
                    const p = newTable.find(x => x.relative === searchIdx);
                    if (p) {
                        oldDealerIndex = newTable.indexOf(p);
                        // Lùi lại 1 bước vì quy tắc là dịch dealer sang phải 1 ghế
                        oldDealerIndex = (oldDealerIndex - 1 + newNumPlayers) % newNumPlayers;
                        break;
                    }
                }
            }

            // Dịch chuyển Dealer sang phải (ngược chiều kim đồng hồ? Không, thuận kim đồng hồ tức là Index tăng lên 1)
            let newDealerIndex = (oldDealerIndex + 1) % newNumPlayers;

            // Tính toán Seat thật (1 -> N)
            // Biết rằng newTable[heroIndex] phải mang seat = newHeroSeat
            // Vậy newTable[0] sẽ mang seat = (newHeroSeat - heroIndex + newNumPlayers) % newNumPlayers
            // Lưu ý Seat chạy từ 1->N, nên Math modulo cần chú ý.
            
            const offset = (newHeroSeat - 1 - heroIndex + newNumPlayers) % newNumPlayers;
            
            let finalDealerSeat = 1;
            const newPlayers = [];
            for (let i = 0; i < newNumPlayers; i++) {
                const seat = ((i + offset) % newNumPlayers) + 1;
                if (i === newDealerIndex) {
                    finalDealerSeat = seat;
                }
                newPlayers.push({ seat, id: newTable[i].id });
            }

            onComplete({
                ...config,
                num_players: newNumPlayers,
                hero_seat: newHeroSeat,
                dealer_seat: finalDealerSeat,
                players: newPlayers
            });

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-gray-900 text-white flex flex-col items-center p-4 font-sans relative">
            <div className="hidden sm:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-green-900 rounded-[150px] border-[10px] border-amber-900 opacity-20 pointer-events-none"></div>
            
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700 z-10 relative my-auto shrink-0 mt-8 mb-8">
                <div className="absolute -top-4 -right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">Setup Ván mới</div>
                
                <h1 className="text-2xl font-bold mb-6 text-center text-blue-400">Điều chỉnh Bàn Chơi</h1>
                
                <div className="space-y-6">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-inner">
                        <label className="flex items-center gap-2 mb-2 font-bold text-green-400">
                            <input type="checkbox" className="w-4 h-4 rounded text-green-500" onChange={e => { if(!e.target.checked) setAddPositions("")}} />
                            Thêm người chơi
                        </label>
                        <p className="text-xs text-gray-400 mb-2">Nhập vị trí thêm (Tính theo chiều kim đồng hồ từ Hero=0). VD: <span className="text-white">1, 3</span> sẽ chèn người mới vào trước ghế 1 và ghế 3.</p>
                        <input type="text" value={addPositions} onChange={e => setAddPositions(e.target.value)} placeholder="VD: 1, 3" className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white outline-none focus:border-green-500 font-mono tracking-widest text-lg" />
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-inner">
                        <label className="flex items-center gap-2 mb-2 font-bold text-red-400">
                            <input type="checkbox" className="w-4 h-4 rounded text-red-500" onChange={e => { if(!e.target.checked) setRemovePositions("")}} />
                            Bớt người chơi
                        </label>
                        <p className="text-xs text-gray-400 mb-2">Nhập vị trí người cần bớt (Tính từ Hero=0). VD: <span className="text-white">2, 5</span> sẽ đuổi người ở vị trí 2 và 5.</p>
                        <input type="text" value={removePositions} onChange={e => setRemovePositions(e.target.value)} placeholder="VD: 2, 5" className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white outline-none focus:border-red-500 font-mono tracking-widest text-lg" />
                    </div>

                    {error && (
                        <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-2 rounded text-sm text-center font-bold animate-bounce">
                            {error}
                        </div>
                    )}

                    <button onClick={handleNext} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transform hover:-translate-y-1 mt-4">
                        Tạo Ván Mới ➔
                    </button>
                </div>
            </div>
        </div>
    );
}
