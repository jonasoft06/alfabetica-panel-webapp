import { isMockOnly } from "@/config/env.server";
import { RuntimeConfigProvider } from "@/core/runtime/runtime-config";
import { PanelShell } from "@/shared/components/layout/panel-shell";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <RuntimeConfigProvider value={{ mockOnly: isMockOnly() }}>
      <PanelShell>{children}</PanelShell>
    </RuntimeConfigProvider>
  );
}
