import type { Metadata } from 'next'
import { Inter, Lobster } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const lobster = Lobster({ subsets: ['latin'], weight: '400', variable: '--font-vintage' })

export const metadata: Metadata = {
  title: 'ThriftersFind OMS',
  description: 'Order Management System for ThriftersFind',
  icons: {
    icon: '/images/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, lobster.variable, "font-body antialiased")} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
