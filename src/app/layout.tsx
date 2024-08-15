import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {Providers} from "./providers";
import { NextUIProvider } from "@nextui-org/react"; 



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FocusFlow",
  description: "Grind time baby",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} dark`}>
        <NextUIProvider>
          <Providers>
            {children}
          </Providers>
        </NextUIProvider>
      </body>
    </html>
  );
}
