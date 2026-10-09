import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Uptime Kit — Service Status",
  description: "Live uptime monitoring and service health.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
