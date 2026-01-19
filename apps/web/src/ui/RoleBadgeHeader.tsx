export function RoleBadgeHeader({ role }: { role: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="text-sm text-slate-400">FestFlow</div>
        <div className="rounded-full bg-slate-800 px-3 py-1 text-sm font-medium">
          {role}
        </div>
      </div>
    </header>
  );
}

