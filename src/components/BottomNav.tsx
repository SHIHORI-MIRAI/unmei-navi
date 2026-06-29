"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "ホーム", icon: "/nav/home.png" },
  { href: "/graph", label: "運勢", icon: "/nav/fortune.png" },
  { href: "/goal", label: "目標", icon: "/nav/goal.png" },
  { href: "/analysis", label: "強み", icon: "/nav/strength.png" },
  { href: "/diary", label: "日記", icon: "/nav/diary.png" },
];

export default function BottomNav() {
  const pathname = usePathname();
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
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
