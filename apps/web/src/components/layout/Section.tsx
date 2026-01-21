import type { ReactNode } from "react";

type SectionProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  withDivider?: boolean;
};

export function Section({ title, subtitle, actions, children, withDivider = true }: SectionProps) {
  return (
    <section className={withDivider ? "border-t border-border/60 pt-6" : ""}>
      {(title || subtitle || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      )}
      <div className={title || subtitle || actions ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

