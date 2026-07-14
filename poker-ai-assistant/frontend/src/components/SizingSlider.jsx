import React from 'react';

export default function SizingSlider({ onSelectSize }) {
    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-xl w-full">
            <div className="text-center mb-4 text-gray-300 font-bold uppercase tracking-widest text-sm">Raise Size</div>
            
            {/* Thanh trượt */}
            <input 
                type="range" 
                min="1" 
                max="100" 
                className="w-full h-4 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-6"
            />
            
            {/* Các nút Chọn nhanh với Touch target lớn (py-4, text-lg) */}
            <div className="flex justify-between gap-2">
                <button 
                    onClick={() => onSelectSize('1/2 Pot')}
                    className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 active:bg-blue-600 rounded-lg font-bold text-lg text-white"
                >
                    1/2
                </button>
                <button 
                    onClick={() => onSelectSize('2/3 Pot')}
                    className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 active:bg-blue-600 rounded-lg font-bold text-lg text-white"
                >
                    2/3
                </button>
                <button 
                    onClick={() => onSelectSize('All-in')}
                    className="flex-1 py-4 bg-red-900 hover:bg-red-800 active:bg-red-600 rounded-lg font-bold text-lg text-white border border-red-500"
                >
                    MAX
                </button>
            </div>
        </div>
    );
}
