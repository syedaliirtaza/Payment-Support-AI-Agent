import { AppNav } from "@/components/app-nav";

export function SiteHeader() {
  return (
    <header className="mx-auto w-full max-w-5xl shrink-0 px-6 pt-10 pb-8">
      <div className="flex justify-center">
        <AppNav />
      </div>
    </header>
  );
}
