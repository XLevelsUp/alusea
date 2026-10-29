import type { ReactNode } from "react";
import Link from "next/link";
import { Rotate3d } from "lucide-react";

/** A link to the virtual showroom page; the caller decides how it looks. */
export default function TourButton({
  className,
  children,
  onClick,
  icon = true,
}: {
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  icon?: boolean;
}) {
  return (
    <Link href="/vr-room" onClick={onClick} className={className}>
      {icon && <Rotate3d aria-hidden="true" className="size-4" />}
      {children ?? "Experience Centre"}
    </Link>
  );
}
