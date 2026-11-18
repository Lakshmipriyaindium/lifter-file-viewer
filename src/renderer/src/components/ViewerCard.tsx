import React from 'react';
import { ViewerCardConfig } from '../lib/viewerCards';

interface ViewerCardProps {
  card: ViewerCardConfig;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>, selectedMode: string) => void;
}

export default function ViewerCard({ card, onUpload }: ViewerCardProps) {
  const accept = card.accept || '.json';
  const buttonText = card.buttonText || 'Select JSON File';

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-orange-500 transition-all duration-300 overflow-hidden flex flex-col group relative">
      <div className="p-8 flex-grow flex flex-col items-center">
        <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-300">
          {card.icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">{card.title}</h2>
        <p className="text-gray-500 text-sm mb-8 text-center leading-relaxed">{card.description}</p>
        <label className="mt-auto cursor-pointer w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg text-center">
          {buttonText}
          <input
            type="file"
            accept={accept}
            onChange={(e) => onUpload(e, card.mode)}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
