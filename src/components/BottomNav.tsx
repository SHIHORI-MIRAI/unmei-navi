"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dict";

const navItems: { href: string; labelKey: DictKey; icon: string }[] = [
  { href: "/", labelKey: "nav.home", icon: "/nav/home.png" },
  { href: "/graph", labelKey: "nav.fortune", icon: "/nav/fortune.png" },
  { href: "/goal", labelKey: "nav.goal", icon: "/nav/goal.png" },
  { href: "/analysis", labelKey: "nav.strength", icon: "/nav/strength.png" },
  { href: "/diary", labelKey: "nav.diary", icon: "/nav/diary.png" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  if (pathname === "/unlock") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-t border-card-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                isActive
                  ? "text-accent-orange"
                  : "text-muted hover:text-accent-gold"
              }`}
            >
              <img
                src={item.icon}
                alt=""
                width={28}
                height={28}
                className={`w-7 h-7 object-contain transition-all ${
                  isActive ? "opacity-100" : "opacity-55 grayscale-[0.15] group-hover:opacity-90"
                }`}
              />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
