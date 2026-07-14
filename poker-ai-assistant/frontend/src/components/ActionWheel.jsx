import React from 'react';

export default function ActionWheel({ active, position }) {
    if (!active) return null;
    
    // UI mô phỏng Radial Menu (Bánh xe hành động) hiển thị tại tọa độ tay người dùng.
    return (
        <div 
            className="absolute z-50 rounded-full w-48 h-48 border-4 border-gray-600 flex items-center justify-center bg-gray-800 bg-opacity-80 pointer-events-none transition-opacity duration-150"
            style={{ left: position.x - 96, top: position.y - 96 }}
        >
            <div className="absolute top-2 text-red-500 font-bold text-xl uppercase tracking-wider">Raise (Lên)</div>
            <div className="absolute left-2 text-gray-400 font-bold text-xl uppercase tracking-wider">Fold (Trái)</div>
            <div className="absolute right-2 text-green-500 font-bold text-xl uppercase tracking-wider">Call (Phải)</div>
            
            {/* Vòng tròn nhỏ ở giữa định vị tay */}
            <div className="w-12 h-12 bg-white rounded-full opacity-20"></div>
        </div>
    );
}
