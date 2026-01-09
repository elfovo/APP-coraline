import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthAurora } from "@/components/animations";
import { ConditionalNav } from "@/components/navigation";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CommoCare",
  description: "Suivi quotidien du rétablissement post-commotion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.className} min-h-screen bg-black text-white`}>
        <LanguageProvider>
          <AuthProvider>
            <div className="relative min-h-screen">
              <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-black" />
                <AuthAurora />
              </div>
              <div className="relative z-10 min-h-screen">
                <ConditionalNav />
                {children}
              </div>
            </div>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
