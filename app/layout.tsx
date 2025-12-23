import './globals.css';
import OidcProvider from './provider/OidcProvider';
import { ThemeProvider } from './provider/ThemeProvider';

export const metadata = {
  title: 'DevSync Collaborative Code Editor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <OidcProvider>
            {children}
          </OidcProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
