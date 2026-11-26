"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { IconMenu } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { usePathname } from "@/i18n/navigation";
import type { MenuDrawerPanel } from "./menu-drawer-panel";

type Panel = typeof MenuDrawerPanel;

let panelLoad: Promise<Panel> | undefined;
function loadPanel() {
  panelLoad ??= import("./menu-drawer-panel")
    .then((module) => module.MenuDrawerPanel)
    .catch((error: unknown) => {
      panelLoad = undefined;
      throw error;
    });
  return panelLoad;
}

/**
 * The menu button. The drawer (Base UI's dialog) is fetched when the learner first reaches for the
 * button, not with every page (home JS budget, ADR-0014). It then stays mounted for later opens.
 */
export function MenuDrawer() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const trigger = useRef<HTMLButtonElement>(null);
  const [Panel, setPanel] = useState<Panel | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "failed">("idle");
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  if (openedAt !== null && !open) setOpenedAt(null);

  const preload = () => {
    // Warm the chunk on hover or focus; a failure here is retried by the click.
    loadPanel().catch(() => undefined);
  };

  return (
    <>
      <div className="relative">
        <IconButton
          ref={trigger}
          icon={<IconMenu />}
          label={t("menu")}
          loading={loadState === "loading"}
          aria-haspopup="dialog"
          aria-expanded={open}
          onPointerEnter={preload}
          onFocus={preload}
          onClick={() => {
            if (Panel) {
              setOpenedAt(open ? null : pathname);
              return;
            }
            setLoadState("loading");
            const openedOn = pathname;
            void loadPanel().then(
              (loaded) => {
                setPanel(() => loaded);
                setOpenedAt(openedOn);
                setLoadState("idle");
              },
              () => {
                setLoadState("failed");
              },
            );
          }}
        />
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={
            loadState === "failed"
              ? "absolute end-0 inset-bs-full z-50 mbs-2 rounded-card border border-border bg-surface-raised p-3 text-ui shadow-raised inline-56"
              : "sr-only"
          }
        >
          {loadState === "failed" ? t("menuLoadFailed") : loadState === "loading" ? t("menuLoading") : null}
        </p>
      </div>
      {Panel && (
        <Panel
          open={open}
          onOpenChange={(nextOpen) => {
            setOpenedAt(nextOpen ? pathname : null);
          }}
          trigger={trigger}
        />
      )}
    </>
  );
}
