import { MarketingHeader } from "@/components/layout/marketing-header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME ?? "My SaaS App"}. All rights reserved.
      </footer>
    </div>
  );
}
