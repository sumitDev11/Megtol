// app/layout.jsx
import "./globals.css"; // your global styles
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Magnetic Field Analyzer",
  description: "Visualize and analyze magnetic field signals",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <h1 className="text-2xl font-bold">Magnetic Field Analyzer</h1>
        </header>

        <main className="min-h-screen bg-gray-50 p-6">{children}</main>

        <footer className="bg-gray-200 text-gray-700 p-4 text-center mt-10">
          &copy; {new Date().getFullYear()} Magnetic Field Project
        </footer>
      </body>
    </html>
  );
}