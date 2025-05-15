import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white">
              Home
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-white">
              About
            </Link>
            <Link href="https://github.com/your-username/onlyfrens" className="text-gray-300 hover:text-white">
              GitHub
            </Link>
          </div>
          
          <div className="mt-8 md:mt-0">
            <p className="text-center md:text-right text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} OnlyFrens. Built with <span className="text-indigo-400">♥</span> for Stellar Hackathon.
            </p>
            <p className="text-center md:text-right text-gray-500 text-xs mt-1">
              Powered by Soroban, Passkey-Kit, and Launchtube
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 