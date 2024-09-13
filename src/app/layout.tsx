import type { Metadata } from "next";
import { Nunito } from 'next/font/google';
import "./globals.css";
import {Providers} from "./providers";
import { NextUIProvider } from "@nextui-org/react"; 



const nunito = Nunito({ 
  subsets: ["latin"],
  weight: ["400", "700"] // Specify font weights (normal and bold)
});
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
      <body className={`${nunito.className} dark`}>
        <NextUIProvider>
          <Providers>
            {children}
          </Providers>
        </NextUIProvider>
      </body>
    </html>
  );
}
