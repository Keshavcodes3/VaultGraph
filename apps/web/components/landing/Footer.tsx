import { LogoMark } from "./Navbar";

const COLS: Array<{ title: string; links: string[] }> = [
  { title: "Product", links: ["Product", "Features", "Workspace", "Changelog"] },
  { title: "Resources", links: ["Documentation", "GitHub"] },
  { title: "Company", links: ["About", "Contact"] },
];

export default function Footer() {
  return (
    <footer className="border-t border-mist bg-white pt-[72px] pb-9">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 max-md:grid-cols-2 max-md:gap-8">
          <div className="max-md:col-span-full">
            <span className="inline-flex items-center gap-2">
              <LogoMark size={24} />
              <span className="text-[17px] font-semibold tracking-[-0.02em]">
                VaultGraph
              </span>
            </span>
            <p className="mt-3.5 max-w-[260px] text-[14.5px] leading-[1.6] text-muted">
              Built for people who think in connections.
            </p>
          </div>
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-1">
              <p className="mb-2.5 text-xs font-bold tracking-[0.1em] text-faint uppercase">
                {col.title}
              </p>
              {col.links.map((l) => (
                <a
                  key={l}
                  href={l === "GitHub" ? "https://github.com" : "#top"}
                  className="w-fit py-[5px] text-[14.5px] text-muted transition-colors duration-200 hover:text-ink"
                  {...(l === "GitHub"
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {l}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap justify-between gap-3 border-t border-mist pt-6 text-[13.5px] text-faint">
          <span>© 2026 VaultGraph</span>
          <span>
            Your knowledge, beautifully connected.
          </span>
        </div>
      </div>
    </footer>
  );
}
