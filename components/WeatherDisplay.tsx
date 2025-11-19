import React from 'react';
import { WeatherData } from '../types';

const WeatherDisplay: React.FC<{ weather: WeatherData }> = ({ weather }) => {
  return (
    <div className="bg-black/60 backdrop-blur-sm border-l-4 border-amber-500 p-3 font-mono text-[10px] text-amber-400 shadow-lg">
      <div className="flex justify-between items-center mb-2 border-b border-amber-900/50 pb-1">
        <span className="font-bold tracking-widest">ACARS DATALINK</span>
        <span className="text-amber-700">RX: ACTIVE</span>
      </div>
      <div className="mb-2 opacity-90">
        <span className="text-amber-600 block text-[9px] uppercase mb-0.5">METAR (CYQT)</span>
        <p className="whitespace-pre-wrap leading-tight">{weather.metar}</p>
      </div>
      <div className="opacity-90">
        <span className="text-amber-600 block text-[9px] uppercase mb-0.5">TAF (CYTZ)</span>
        <p className="whitespace-pre-wrap leading-tight">{weather.taf}</p>
      </div>
    </div>
  );
};

export default WeatherDisplay;