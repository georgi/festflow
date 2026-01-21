export function RoleBadgeHeader({ role }: { role: string }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="text-sm text-muted-foreground">FestFlow</div>
        <div className="flex items-center gap-3">
          <a className="text-sm text-muted-foreground hover:text-foreground" href="/login">
            Switch
          </a>
          <div className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{role}</div>
        </div>
      </div>
    </header>
  );
}
