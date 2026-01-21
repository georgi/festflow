import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

type SectionProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  withDivider?: boolean;
};

export function Section({ title, subtitle, actions, children, withDivider = true }: SectionProps) {
  return (
    <section className={withDivider ? "pt-6" : ""}>
      {withDivider && <Separator className="mb-6" />}
      {(title || subtitle || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}

