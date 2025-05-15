import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-600 p-6 text-center mt-12">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} OnlyFrens. All rights reserved (for this hackathon!).</p>
        <p className="text-sm mt-1">
          Built for the Stellar Consensus Hackathon 2025 - Web3 UX Track.
        </p>
        <p className="text-xs mt-2">
            <a href="https://github.com/stellar/launchtube" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">Launchtube</a> | 
            <a href="https://github.com/kalepail/passkey-kit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500"> Passkey-Kit</a> | 
            <a href="https://developers.stellar.org/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500"> Stellar Docs</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer; 