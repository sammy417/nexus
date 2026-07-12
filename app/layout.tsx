import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import AssetFormModal from "@/components/asset/AssetFormModal";
import Toast from "@/components/common/Toast";
import { AssetModalProvider } from "@/lib/asset-modal-context";
import { PortfolioProvider } from "@/lib/portfolio-context";

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
    <html lang="ko">
      <body className="font-sans antialiased">
        <PortfolioProvider>
          <AssetModalProvider>
            <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-surface">
              <Header />
              <main className="flex-1 px-5 pb-8 pt-2">{children}</main>
              <BottomNav />
            </div>
            <AssetFormModal />
            <Toast />
          </AssetModalProvider>
        </PortfolioProvider>
      </body>
    </html>
  );
}
