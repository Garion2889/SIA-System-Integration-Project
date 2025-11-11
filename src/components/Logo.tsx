import React from 'react';
import logoImage from 'figma:asset/d9fa69601ec1c965a0d1dc8bba0e81e031481fa6.png';

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={logoImage}
        alt="SmartStock Logistics Logo" 
        className="h-20 w-20 object-contain"
      />
      <div className="flex flex-col">
        <span className="text-emerald-600">SmartStock Logistics</span>
        <span className="text-xs text-gray-500">RMT Marketing Solutions Inc.</span>
      </div>
    </div>
  );
}
