import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Finanças | App com Tags",
  description: "Controle suas finanças com tags",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Finanças",
  },
  formatDetection: {
    telephone: false,
    email: false,
  },
  icons: {
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <AuthProvider>
          <DataProvider>
            <div className="min-h-screen flex flex-col">
              <Nav />
            <main className="flex-1 w-full min-w-0 overflow-x-hidden px-4 py-5 tablet:px-6 tablet:py-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-w-[min(100%,56rem)] tablet:max-w-[min(100%,56rem)] lg:max-w-[min(100%,72rem)] mx-auto">
              <AuthGuard>{children}</AuthGuard>
            </main>
          </div>
        </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
