"use client";
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 px-3 mt-8">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} Modern Todo App. All rights reserved.</p>
        <p className="text-xs mt-1">Built with Next.js and Tailwind CSS</p>
      </div>
    </footer>
  );
};

export default Footer;
