import React, { useState } from 'react';

export default function PlayerAvatar({ label, seat, isHero, isActive, hasFolded, canCheck, disableAll, isPostFlop, onAction, onAvatarClick, isFocused }) {
    const [timing, setTiming] = useState("Lưỡng lự");
    const [showRaiseMenu, setShowRaiseMenu] = useState(false);
    
    return (
        <div className={`relative flex flex-col items-center gap-2 transition-all duration-300 ${(isActive && !disableAll) || isFocused ? 'scale-110 z-50' : 'z-10'} ${hasFolded ? 'opacity-30 grayscale' : ''} ${disableAll && !isFocused ? 'opacity-50 pointer-events-none' : ''}`}>
            
            {/* Avatar Circle */}
            <div 
                onClick={() => !disableAll && onAvatarClick && onAvatarClick(seat)}
                className={`w-20 h-20 rounded-full bg-gray-800 border-4 flex flex-col items-center justify-center shadow-xl cursor-pointer transition-all duration-300
                ${isFocused ? 'border-yellow-400 shadow-[0_0_35px_rgba(250,204,21,0.9)] bg-gray-700' : 
                 isActive && !disableAll ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)]' : 
                 'border-gray-600 hover:border-gray-400'}
                ${isHero && !isFocused ? 'bg-blue-900 border-blue-500' : ''}
            `}>
                <span className="font-bold text-gray-200 text-sm">{isHero ? 'Hero' : `Ghế ${seat}`}</span>
                <span className={`text-xs font-mono font-bold ${isActive ? 'text-yellow-400' : 'text-gray-400'}`}>[{label}]</span>
            </div>
        </div>
    );
}
