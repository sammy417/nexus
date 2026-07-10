import { Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
        <span className="text-lg font-bold tracking-tight text-gray-900">
          NEXUS
        </span>
        <button
          type="button"
          aria-label="알림"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200"
        >
          <Bell size={20} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
