import type { AppProps } from 'next/app';
import '../styles/globals.css'; // Assuming you'll have a global CSS file
import { WalletProvider } from '../contexts/WalletContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  );
}

export default MyApp; 