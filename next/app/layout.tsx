import "./globals.scss";
import type { Metadata } from "next";
import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/Footer";
import { Inter } from 'next/font/google'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Society of Software Engineers',
  description: 'The Society of Software Engigneers is an academic organization at the Rochester Institute of Technology that provides mentoring and support for students in the Golisano College for Computing and Information Sciences.',
  icons: ["./sse-small.svg"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <html lang="en">
      <body
        className={`min-h-screen flex flex-col text-slate-300 bg-gradient-to-b from-slate-900 to-slate-1000`}
      >
        <Navbar />
        <main className="flex flex-col grow items-center p-2 md:p-4 lg:p-6 xl:p-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}