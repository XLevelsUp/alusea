import type { ReactNode } from "react";

type PageBannerProps = {
  /** The page's name, kept for reference; it is not shown. */
  crumb?: string;
  title: ReactNode;
  eyebrow?: string;
  children?: ReactNode;
};

/** The opening band of every inner page: the page heading and its introduction. */
const PageBanner = ({ title, eyebrow, children }: PageBannerProps) => {
  return (
    <header className="window-grid bg-blueberry pb-[clamp(3rem,7vw,6rem)] pt-[calc(var(--header-h)+clamp(2.5rem,6vw,5rem))] text-white">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-20">
          <div className="lg:col-span-7">
            {eyebrow && <p className="eyebrow on-dark mb-5">{eyebrow}</p>}
            <h1 className="h-display text-white">{title}</h1>
          </div>
          {children && <div className="lede text-plate-white lg:col-span-5 [&_a]:font-semibold [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4">{children}</div>}
        </div>
      </div>
    </header>
  );
};

export default PageBanner;
