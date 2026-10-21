import { Cloud, Starburst } from "./brand-shapes";
import { BrandLogo } from "@/shared/components/layout/brand-mark";
import { LoginIllustration } from "./login-illustration";

/** Light mint of the panel art: near-white tinted with the panel's own turquoise (existing tokens only). */
const MINT = "text-[color:color-mix(in_oklch,var(--alf-near-white)_88%,var(--alf-turquoise))]";

/** Left turquoise panel of the login: logo, illustration, headline and decorative shapes. */
export function LoginBrandPanel() {
  return (
    <section className="relative flex flex-col overflow-hidden bg-turquoise px-6 pt-[max(env(safe-area-inset-top),2.25rem)] pb-10 text-near-white md:min-h-dvh md:w-[39%] md:max-w-[560px] md:px-14 md:py-14 md:[@media(max-height:500px)]:py-8">
      {/* decorative shapes, cropped by the panel edges */}
      <Cloud className={`absolute -top-1 -right-3 w-[76px] md:-top-4 md:-right-14 md:w-44 lg:-top-7 lg:-right-16 lg:w-72 ${MINT}`} />
      <Starburst className="absolute -bottom-10 -left-10 hidden w-24 text-tangerine md:block lg:-bottom-12 lg:-left-12 lg:w-36" />
      <Starburst className="absolute -right-16 -bottom-20 hidden w-40 text-tan-sun md:block lg:-right-20 lg:-bottom-24 lg:w-64" />
      {/* Mobile header corner: only ~36px shows, inside the bottom padding, so it never sits under the text. */}
      <Starburst className="absolute -right-5 -bottom-11 w-20 text-tan-sun md:hidden" />

      <div className="relative flex items-center gap-3">
        <BrandLogo loading="eager" />
        <span className="text-lg font-extrabold">Alfabética</span>
      </div>

      <div className="relative md:mt-auto md:mb-auto">
        {/* Hidden on short landscape screens (phones) so the panel fits without scrolling. */}
        <LoginIllustration className={`mt-12 hidden w-[150px] md:block lg:w-[210px] 2xl:w-[230px] md:[@media(max-height:500px)]:hidden ${MINT}`} />
        <div className="mt-8 md:mt-10 md:[@media(max-height:500px)]:mt-6">
          <h1 className="text-[28px] leading-[1.05] font-extrabold md:text-5xl">
            Alfabética
            <br />
            Workspace
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-near-white/85 md:mt-4 md:text-base md:leading-normal">La fábrica de libros de todas las tallas, para todos los gustos.</p>
        </div>
      </div>

      {/* Above the starbursts (z-10) and placed between them so it always sits on turquoise. */}
      <p className="relative z-10 mt-8 hidden self-start text-xs font-semibold whitespace-nowrap text-near-white md:block lg:mr-36 lg:self-end">Thanber Software &amp; Consulting</p>
    </section>
  );
}
