import { motion } from "framer-motion";

interface HeroSectionProps {
  onScrollToSamples: () => void;
  onScrollToBuilder: () => void;
}

const FloatingPoster = ({
  position,
  gradient,
}: {
  position: string;
  gradient: string;
}) => (
  <div
    className={`absolute w-[140px] h-[200px] bg-[rgba(255,255,255,0.05)] rounded-xl border border-[rgba(255,255,255,0.08)] shadow-[0_20px_40px_rgba(0,0,0,0.5)] opacity-60 overflow-hidden transition-all duration-300 hover:opacity-80 hover:scale-105 hover:z-10 cursor-pointer ${position}`}
  >
    <div className="w-full h-full bg-gradient-to-br from-[rgba(255,255,255,0.1)] to-[rgba(255,255,255,0.01)] relative overflow-hidden">
      <div
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-[rotateGradient_10s_linear_infinite]"
        style={{
          background: gradient,
        }}
      />
    </div>
  </div>
);

const HeroSection = ({ onScrollToSamples, onScrollToBuilder }: HeroSectionProps) => {
  return (
    <section className="relative h-screen w-full flex flex-col justify-center items-center text-center overflow-hidden pt-20">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-40 bg-[#4F46E5] -top-[100px] -right-[100px]" />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-40 bg-[#7C3AED] -bottom-[150px] -left-[150px]" />

        {/* Floating Posters */}
        <FloatingPoster
          position="top-[15%] left-[10%] -rotate-12"
          gradient="radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, transparent 60%)"
        />
        <FloatingPoster
          position="top-[15%] right-[10%] rotate-12"
          gradient="radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 60%)"
        />
        <FloatingPoster
          position="bottom-[20%] left-[8%] rotate-[8deg] hidden lg:block"
          gradient="radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 60%)"
        />
        <FloatingPoster
          position="bottom-[20%] right-[8%] -rotate-[8deg] hidden lg:block"
          gradient="radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 60%)"
        />
      </div>

      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-[800px] z-10 px-6"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-full text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-6">
          <span className="w-1.5 h-1.5 bg-accent-violet rounded-full shadow-[0_0_8px_hsl(258,90%,66%)]" />
          Powered by Gemini 3.0, n8n and NanoBanana
        </div>

        <h1 className="font-heading text-[clamp(40px,6vw,64px)] leading-[1.1] mb-6 font-semibold">
          Create Marketing<br />
          Campaigns <br />
          <span className="text-gradient">That Convert.</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-[500px] mx-auto mb-12 font-light">
          An automated ecosystem that transforms product intelligence into high-performance Instagram and WhatsApp campaigns in minutes.
        </p>

        {/* Stats */}
        <div className="flex justify-center items-center gap-8 mb-12">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-heading font-semibold">10x</span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-1">Efficiency</span>
          </div>
          <div className="w-px h-8 bg-[rgba(255,255,255,0.08)]" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-heading font-semibold">95%</span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-1">Engagement</span>
          </div>
          <div className="w-px h-8 bg-[rgba(255,255,255,0.08)]" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-heading font-semibold">5k+</span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-1">Enterprises</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onScrollToBuilder}
            className="bg-foreground text-background py-3 px-8 rounded-full font-semibold text-sm border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(255,255,255,0.3)]"
          >
            Get Started Free
          </button>
          <button
            onClick={onScrollToSamples}
            className="bg-transparent text-foreground py-3 px-8 rounded-full font-medium text-sm border border-[rgba(255,255,255,0.08)] cursor-pointer inline-flex items-center gap-2 transition-all duration-300 hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.03)]"
          >
            View Showcase
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 11L11 1M11 1H3M11 1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <div
        onClick={onScrollToSamples}
        className="absolute bottom-10 flex flex-col items-center gap-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity duration-300"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase">SCROLL</span>
        <div className="w-px h-12 bg-gradient-to-b from-muted-foreground to-transparent" />
      </div>
    </section>
  );
};

export default HeroSection;
