import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function RoleBadgeHeader({ role }: { role: string }) {
  const { t } = useTranslation();
  
  // Map role names to translation keys
  const roleKeyMap: Record<string, string> = {
    'Waiter': 'roles.waiter',
    'Kitchen': 'roles.kitchen',
    'Bar': 'roles.bar',
    'Cashier': 'roles.cashier',
    'Admin': 'roles.admin',
  };
  
  const roleKey = roleKeyMap[role] || role;
  
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="text-sm text-muted-foreground">{t('app.title')}</div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a className="text-sm text-muted-foreground hover:text-foreground" href="/login">
            Switch
          </a>
          <div className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{t(roleKey)}</div>
        </div>
      </div>
    </header>
  );
}
