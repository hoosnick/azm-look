import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1c1c1e]/80 ios-blur border-b border-white/10">
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          AzmLook
        </h1>
      </div>
    </header>
  );
};

export default Header;