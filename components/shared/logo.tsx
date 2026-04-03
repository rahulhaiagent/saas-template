import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold text-lg">
      {/* Replace with your logo image or icon */}
      <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
        {APP_NAME.charAt(0)}
      </div>
      <span>{APP_NAME}</span>
    </Link>
  );
}
