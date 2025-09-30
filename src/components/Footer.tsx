"use client";
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 text-center mt-8">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} Modern Todo App. All rights reserved.</p>
        <p className="text-sm mt-1">Built with Next.js and Tailwind CSS</p>
      </div>
    </footer>
  );
};

export default Footer;
