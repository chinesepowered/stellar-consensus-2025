import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Head from 'next/head';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout = ({ children, title = 'OnlyFrens' }: LayoutProps) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="icon" href="/favicon.ico" /> {/* Ensure you have a favicon.ico in public/ */}
      </Head>
      <Navbar />
      <main>
        <div className="container"> {/* Using .container class from globals.css */}
          {children}
        </div>
      </main>
      <footer style={footerStyles}>
        <p>&copy; {new Date().getFullYear()} OnlyFrens - Hackathon Project</p>
      </footer>
    </>
  );
};

const footerStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: '2rem 0',
  marginTop: '2rem',
  borderTop: '1px solid #eaeaea',
  fontSize: '0.9rem',
  color: '#555',
};

export default Layout; 