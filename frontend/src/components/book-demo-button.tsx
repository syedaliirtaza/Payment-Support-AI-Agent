import { buttonVariants } from "@/components/ui/button";
import { appButtonClassName } from "@/lib/button-styles";
import { BOOK_DEMO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BookDemoButton({ className }: { className?: string }) {
  return (
    <a
      href={BOOK_DEMO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ size: "sm" }),
        appButtonClassName,
        className,
      )}
    >
      Book Demo
    </a>
  );
}
