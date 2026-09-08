import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Topbar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-navy-3 px-6 py-3 text-white shadow-md">
      <div className="flex items-center gap-2 text-lg font-bold">
        Repara<span className="text-orange">Já</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange text-sm font-bold">
            {initials}
          </div>
          <span className="text-sm font-medium">{name}</span>
        </div>
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
