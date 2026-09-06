import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AzaisAi — AI Video & Image Generator | Sora, Veo, Runway in One Platform",
  description:
    "Turn ideas into reality with AI. Generate cinematic videos and ultra-realistic images using Sora, Veo, Runway, GPT Image, and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          appearance={{
            variables: {
              colorPrimary: "#3b82f6",
              colorBackground: "#0d0f14",
              colorForeground: "#f4f5f7",
            },
          }}
        >
          <NavBar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
