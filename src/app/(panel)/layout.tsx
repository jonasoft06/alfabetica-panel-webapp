import { PanelShell } from "@/shared/components/layout/panel-shell";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}
