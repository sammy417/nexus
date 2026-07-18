import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import AssetFormModal from "@/components/asset/AssetFormModal";
import Toast from "@/components/common/Toast";
import { AssetModalProvider } from "@/lib/asset-modal-context";
import { PortfolioProvider } from "@/lib/portfolio-context";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/lib/theme-provider";

export const metadata: Metadata = {
  title: "NEXUS | 나의 자산 포트폴리오",
  description: "Next-gen eXperience for Unified Sight — 개인 자산 포트폴리오 관리",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <PortfolioProvider>
            <AssetModalProvider>
              <div className="flex min-h-dvh bg-surface text-gray-900 dark:bg-surface-dark dark:text-gray-100">
                <Sidebar />
                <main className="min-w-0 flex-1">
                  <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
                </main>
              </div>
              <AssetFormModal />
              <Toast />
            </AssetModalProvider>
          </PortfolioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
