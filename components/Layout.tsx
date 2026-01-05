
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-0 sm:p-4 lg:p-10 overflow-hidden">
      <div className="w-full max-w-full md:max-w-4xl lg:max-w-6xl h-[100dvh] md:h-[88vh] glass-panel md:rounded-[4rem] relative flex flex-col overflow-hidden transition-all duration-1000 ease-out border-white/80 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)]">
        {children}
      </div>
    </div>
  );
};

export default Layout;
