import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { MetaBalls } from "@/components/animations";
import { SimpleNav } from "@/components/navigation";

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
        <div className="relative min-h-screen">
          <div className="fixed inset-0 -z-10">
            {/* <MetaBalls /> */}
            <div className="absolute inset-0 bg-black" />
          </div>
          <AuthProvider>
            <div className="relative z-10 min-h-screen">
              <SimpleNav />
              {children}
            </div>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
