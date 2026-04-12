import type { Metadata, Viewport } from "next"
import { Fira_Code, Fira_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"

const firaSans = Fira_Sans({ 
  subsets: ["latin"], 
  weight: ["400", "700", "800"],
  variable: "--font-fira-sans",
  display: "swap",
})

const firaCode = Fira_Code({ 
  subsets: ["latin"],
  variable: "--font-fira-code",
  display: "swap",
})

export const metadata: Metadata = {
  title: "GaleriLink B2B Ticaret Ağı",
  description: "Galericiler için kapalı devre araç ticaret platformu",
}

// VIEWPORT: Applied requested maximumScale: 1 and userScalable: false
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
}

import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
      lang="tr" 
      suppressHydrationWarning 
      className={`${firaSans.variable} ${firaCode.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className={firaSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
