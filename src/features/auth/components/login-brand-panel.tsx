import { BrandImagePlaceholder, BrandMark } from "@/shared/components/layout/brand-mark";

/** Left turquoise panel of the login (decorative shapes are generic, the logo/illustration are placeholders). */
export function LoginBrandPanel() {
  return (
    <section className="relative flex flex-col overflow-hidden bg-turquoise px-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-8 text-near-white md:min-h-dvh md:w-[39%] md:max-w-[560px] md:px-14 md:py-14">
      {/* decorative shapes */}
      <svg aria-hidden viewBox="0 0 200 180" className="absolute -top-10 -right-10 w-48 text-near-white/95 md:-top-6 md:-right-4 md:w-60">
        <path fill="currentColor" d="M44 8c30-14 76-8 110 6s52 52 38 92-56 72-98 72S8 150 4 110 14 22 44 8Z" opacity=".95" />
      </svg>
      <svg aria-hidden viewBox="0 0 120 120" className="absolute -bottom-16 -left-14 hidden w-40 text-tangerine md:block">
        <path
          fill="currentColor"
          d="M60 0l10 16 18-6 2 19 19 3-7 18 16 11-16 11 7 18-19 3-2 19-18-6-10 16-10-16-18 6-2-19-19-3 7-18L0 61l16-11-7-18 19-3 2-19 18 6Z"
        />
      </svg>
      <svg aria-hidden viewBox="0 0 120 120" className="absolute right-[-30px] bottom-8 hidden w-32 text-tan-sun md:block">
        <path
          fill="currentColor"
          d="M60 0l10 16 18-6 2 19 19 3-7 18 16 11-16 11 7 18-19 3-2 19-18-6-10 16-10-16-18 6-2-19-19-3 7-18L0 61l16-11-7-18 19-3 2-19 18 6Z"
        />
      </svg>

      <div className="relative flex items-center gap-3">
        <BrandMark className="size-10 text-near-white" />
        <span className="text-lg font-extrabold">Alfabética</span>
      </div>

      <BrandImagePlaceholder className="relative mt-16 hidden h-28 w-36 text-near-white md:flex" label="Ilustración" />

      <div className="relative mt-8 md:mt-auto md:mb-auto">
        <h1 className="text-[32px] leading-[1.05] font-extrabold md:text-5xl">
          Alfabética
          <br />
          Workspace
        </h1>
        <p className="mt-3 max-w-sm text-sm text-near-white/85 md:mt-4 md:text-base">La fábrica de libros de todas las tallas, para todos los gustos.</p>
      </div>

      <p className="relative z-10 mt-8 hidden self-end text-xs text-near-white/80 md:block">Thanber Software &amp; Consulting</p>
    </section>
  );
}
