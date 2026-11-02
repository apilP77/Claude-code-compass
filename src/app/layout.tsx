import type { Metadata } from "next";
import { Archivo, JetBrains_Mono, Public_Sans } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

// Archivo's width axis lets headings be set expanded, like lettering on a map.
const display = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const body = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Claude Code Compass",
  description:
    "Find community-built skills, plugins, and tools for Claude Code.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
        >
          Skip to content
        </a>
        <Header />
        <div id="main-content" className="flex flex-1 flex-col">
          {children}
        </div>
        <footer className="border-t border-line px-5 py-6 text-center text-sm text-faint">
          Independent community project, not an official Anthropic site.
        </footer>
      </body>
    </html>
  );
}
