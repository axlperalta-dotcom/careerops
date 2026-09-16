import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerOps · Mi espacio",
  description: "Vacantes, proyectos y evidencias para construir tu portafolio.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
