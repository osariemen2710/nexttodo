"use client";
import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

const Header: React.FC = () => {
  const { data: session } = useSession();

  return (
    <header className="bg-gradient-to-r from-green-700 to-green-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Modern Todo App
        </Link>
        <nav>
          <ul className="flex space-x-4 items-center">
            <li>
              <Link href="/" className="hover:text-green-200 transition-colors">
                Todos
              </Link>
            </li>
            <li>
              {session ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm">{session.user?.name}</span>
                  <button onClick={() => signOut()} className="px-3 py-1 bg-white text-green-700 rounded">Sign out</button>
                </div>
              ) : (
                <Link href="/signin" className="px-3 py-1 bg-white text-green-700 rounded">Sign in</Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
