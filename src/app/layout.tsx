import type { Metadata, Viewport } from "next"
import { Fira_Code, Fira_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"

const firaSans = Fira_Sans({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-fira-sans"
})

const firaCode = Fira_Code({ 
  subsets: ["latin"],
  variable: "--font-fira-code"
})

export const metadata: Metadata = {
  title: "GaleriLink B2B Ticaret Ağı",
  description: "Galericiler için kapalı devre araç ticaret platformu",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${firaSans.variable} ${firaCode.variable}`}>
      <body className={firaSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
