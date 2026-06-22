import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gta-bg">
      <Sidebar />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
