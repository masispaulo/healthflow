
import React from 'react';
import { ChartBarIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <ChartBarIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">
          Health<span className="text-indigo-600">Flow</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
