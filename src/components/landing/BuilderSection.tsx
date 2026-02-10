import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, X, Check, Download, Copy, Sparkles, Image as ImageIcon, Palette, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BuilderSectionProps {
  sectionRef: React.RefObject<HTMLElement>;
}

const INDUSTRIES = ["Fashion", "Food", "Tech", "Beauty", "Real Estate"];
const THEMES = ["Diwali", "New Year", "Sale", "Launch", "Minimal"];
const STYLES = ["Photorealistic", "Neon", "Pastel", "Luxury"];

const PIPELINE_STEPS = [
  { label: "Analyzing product", icon: "🔍" },
  { label: "Engineering prompt", icon: "🧠" },
  { label: "Generating image", icon: "🎨" },
  { label: "Writing caption", icon: "✍️" },
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const BuilderSection = ({ sectionRef }: BuilderSectionProps) => {
  const { toast } = useToast();
  const productInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [theme, setTheme] = useState(THEMES[0]);
  const [headlineText, setHeadlineText] = useState("");
  const [visualStyle, setVisualStyle] = useState(STYLES[0]);
  const [brandColor, setBrandColor] = useState("#8B5CF6");

  // File state
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
  const [captionCopied, setCaptionCopied] = useState(false);

  const handleFileSelect = (
    file: File | undefined,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 10MB.", variant: "destructive" });
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!brandName.trim() || !headlineText.trim()) {
        toast({ title: "Missing fields", description: "Please fill in Brand Name and Main Offer.", variant: "destructive" });
        return;
      }

      setIsGenerating(true);
      setGeneratedImage(null);
      setGeneratedCaption(null);
      setCurrentStep(0);

      try {
        let productImageBase64: string | undefined;
        let productImageMimeType: string | undefined;
        let logoImageBase64: string | undefined;
        let logoImageMimeType: string | undefined;

        if (productFile) {
          productImageBase64 = await fileToBase64(productFile);
          productImageMimeType = productFile.type;
          setCurrentStep(0);
        } else {
          setCurrentStep(1);
        }

        if (logoFile) {
          logoImageBase64 = await fileToBase64(logoFile);
          logoImageMimeType = logoFile.type;
        }

        // Simulate step progression with timing
        const stepTimer = setInterval(() => {
          setCurrentStep((prev) => {
            if (prev < 3) return prev + 1;
            clearInterval(stepTimer);
            return prev;
          });
        }, 6000);

        const { data, error } = await supabase.functions.invoke("generate-campaign", {
          body: {
            brandName,
            industry,
            theme,
            headlineText,
            visualStyle,
            brandColor,
            productImageBase64,
            productImageMimeType,
            logoImageBase64,
            logoImageMimeType,
          },
        });

        clearInterval(stepTimer);

        if (error) {
          // Check for rate limit or payment errors
          const errorMsg = error.message || "";
          if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("rate limit")) {
            throw new Error("Rate limit exceeded. Please wait a moment and try again.");
          }
          if (errorMsg.includes("402") || errorMsg.toLowerCase().includes("credit")) {
            throw new Error("AI credits exhausted. Please add credits to your workspace.");
          }
          throw error;
        }
        if (data?.error) throw new Error(data.error);

        setCurrentStep(3);
        setGeneratedImage(data.imageUrl);
        setGeneratedCaption(data.caption || null);
      } catch (e: any) {
        toast({
          title: "Generation failed",
          description: e.message || "Could not generate campaign. Please try again.",
          variant: "destructive",
        });
      } finally {
        setTimeout(() => setIsGenerating(false), 500);
      }
    },
    [brandName, industry, theme, headlineText, visualStyle, brandColor, productFile, logoFile, toast]
  );

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `${brandName || "adgen"}-campaign.png`;
    link.click();
  };

  const handleCopyCaption = () => {
    if (!generatedCaption) return;
    navigator.clipboard.writeText(generatedCaption);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2000);
  };

  const handleWhatsAppBroadcast = async () => {
    if (!generatedImage) return;

    try {
      // Convert the base64/data URL image to a File object
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], `${brandName || "adgen"}-campaign.png`, { type: "image/png" });

      const shareText = generatedCaption || headlineText || `${brandName} Campaign`;

      // Try native Web Share API first (works great on mobile, supports files)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${brandName} Campaign`,
          text: shareText,
          files: [file],
        });
        toast({ title: "Shared successfully!", description: "Your campaign was shared." });
        return;
      }

      // Fallback: open WhatsApp Web with caption text
      // First, download the image so user can attach it
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = `${brandName || "adgen"}-campaign.png`;
      link.click();

      // Then open WhatsApp with caption
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, "_blank");

      toast({
        title: "Image downloaded!",
        description: "Attach the downloaded image in the WhatsApp chat that just opened.",
      });
    } catch (e: any) {
      if (e.name === "AbortError") return; // User cancelled share
      toast({
        title: "Share failed",
        description: "Could not share. Try downloading and sharing manually.",
        variant: "destructive",
      });
    }
  };

  const inputClasses =
    "w-full bg-[hsl(var(--glass-bg))] border border-[hsl(var(--glass-border))] p-3 px-4 rounded-xl text-foreground font-sans text-sm outline-none transition-colors duration-300 focus:border-accent-violet";
  const labelClasses = "block text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2";
  const selectClasses = `${inputClasses} appearance-none cursor-pointer`;

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[hsl(var(--glass-bg))] border border-[hsl(var(--glass-border))] rounded-full text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI Campaign Studio
          </div>
          <h2 className="font-heading text-[40px] font-semibold mb-4">Start Your Campaign</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Fill in your brand details, upload assets, and let our 3-step AI pipeline generate
            stunning marketing creatives with matching captions.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* ========== LEFT: Form (3 cols) ========== */}
            <div className="lg:col-span-3 bg-[hsl(var(--glass-bg))] border border-[hsl(var(--glass-border))] p-6 md:p-8 rounded-3xl space-y-5">
              {/* Brand Name + Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Luxe Beauty"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Industry</label>
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={selectClasses}>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Theme + Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Occasion / Theme</label>
                  <select value={theme} onChange={(e) => setTheme(e.target.value)} className={selectClasses}>
                    {THEMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Visual Style</label>
                  <select value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)} className={selectClasses}>
                    {STYLES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className={labelClasses}>Main Offer / Headline</label>
                <input
                  type="text"
                  placeholder='e.g. "50% OFF — Limited Time!"'
                  required
                  value={headlineText}
                  onChange={(e) => setHeadlineText(e.target.value)}
                  className={inputClasses}
                />
                <p className="text-[11px] text-muted-foreground mt-1.5 opacity-70">
                  This text will appear directly on the generated image.
                </p>
              </div>

              {/* Color Picker */}
              <div>
                <label className={labelClasses}>Brand Color</label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-[hsl(var(--glass-border))] cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className={`${inputClasses} flex-1 font-mono uppercase`}
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Image Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Image */}
                <div>
                  <label className={labelClasses}>Upload Product Image</label>
                  <div
                    className="border-2 border-dashed border-[hsl(var(--glass-border))] rounded-2xl h-[160px] flex justify-center items-center text-center cursor-pointer transition-all duration-300 hover:border-accent-violet hover:bg-accent-violet/5 relative overflow-hidden"
                    onClick={() => productInputRef.current?.click()}
                  >
                    {productPreview ? (
                      <>
                        <img src={productPreview} alt="Product" className="absolute inset-0 w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductFile(null);
                            setProductPreview(null);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors z-10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center gap-1.5 px-4">
                        <ImageIcon className="w-8 h-8 opacity-50" />
                        <p className="text-xs leading-tight">
                          Upload a clear photo of your product.
                          <br />
                          <span className="opacity-60">AI will analyze & place it in the design.</span>
                        </p>
                      </div>
                    )}
                    <input
                      ref={productInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files?.[0], setProductFile, setProductPreview)}
                    />
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <label className={labelClasses}>Upload Brand Logo</label>
                  <div
                    className="border-2 border-dashed border-[hsl(var(--glass-border))] rounded-2xl h-[160px] flex justify-center items-center text-center cursor-pointer transition-all duration-300 hover:border-accent-violet hover:bg-accent-violet/5 relative overflow-hidden"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo" className="absolute inset-0 w-full h-full object-contain p-4 bg-background/50" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors z-10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center gap-1.5 px-4">
                        <Palette className="w-8 h-8 opacity-50" />
                        <p className="text-xs leading-tight">
                          Upload your logo (PNG).
                          <br />
                          <span className="opacity-60">Overlaid on the final design for branding.</span>
                        </p>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files?.[0], setLogoFile, setLogoPreview)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-accent-violet text-foreground py-3.5 px-8 rounded-full font-semibold text-sm border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_hsl(var(--accent-violet)/0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Campaign
                  </>
                )}
              </button>
            </div>

            {/* ========== RIGHT: Preview Card (2 cols) ========== */}
            <div className="lg:col-span-2 flex items-start justify-center">
              <div className="w-full max-w-[360px] sticky top-24">
                {/* Phone Frame */}
                <div className="bg-[hsl(var(--card))] border border-[hsl(var(--glass-border))] rounded-[2rem] p-3 shadow-2xl">
                  {/* Notch */}
                  <div className="flex justify-center mb-2">
                    <div className="w-24 h-5 bg-background rounded-full" />
                  </div>

                  {/* Preview Content */}
                  <div className="rounded-2xl overflow-hidden bg-background aspect-square relative">
                    <AnimatePresence mode="wait">
                      {isGenerating ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6"
                        >
                          <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-2 border-accent-violet/20" />
                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-violet animate-spin" />
                            <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-accent-blue animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                          </div>
                          <div className="space-y-3 w-full max-w-[200px]">
                            {PIPELINE_STEPS.map((step, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0.3, x: -10 }}
                                animate={{
                                  opacity: i <= currentStep ? 1 : 0.3,
                                  x: 0,
                                }}
                                transition={{ delay: i * 0.15 }}
                                className="flex items-center gap-2.5 text-xs"
                              >
                                <span className="text-base">{step.icon}</span>
                                <span className={i <= currentStep ? "text-foreground" : "text-muted-foreground"}>
                                  {step.label}
                                </span>
                                {i < currentStep && <Check className="w-3.5 h-3.5 text-success ml-auto" />}
                                {i === currentStep && (
                                  <Loader2 className="w-3.5 h-3.5 text-accent-violet ml-auto animate-spin" />
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ) : generatedImage ? (
                        <motion.div
                          key="result"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="relative w-full h-full"
                        >
                          <img src={generatedImage} alt="Generated ad" className="w-full h-full object-cover" />
                          {/* Logo overlay */}
                          {logoPreview && (
                            <img
                              src={logoPreview}
                              alt="Brand logo"
                              className="absolute bottom-4 right-4 w-16 h-16 object-contain drop-shadow-lg"
                            />
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground"
                        >
                          <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: `${brandColor}15` }}
                          >
                            <ImageIcon className="w-8 h-8" style={{ color: brandColor }} />
                          </div>
                          <div className="text-center px-6">
                            <p className="text-sm font-medium text-foreground/60">Preview</p>
                            <p className="text-xs mt-1 opacity-50">Your generated ad will appear here</p>
                          </div>
                          {headlineText && (
                            <div
                              className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold text-center max-w-[80%]"
                              style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                            >
                              "{headlineText}"
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bottom bar */}
                  <div className="flex justify-center gap-1.5 mt-3 mb-1">
                    <div className="w-28 h-1 bg-foreground/20 rounded-full" />
                  </div>
                </div>

                {/* Action Buttons (below phone) */}
                <AnimatePresence>
                  {generatedImage && !isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 space-y-3"
                    >
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="w-full bg-foreground text-background py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <Download className="w-4 h-4" />
                        Download Image
                      </button>

                      {/* WhatsApp Broadcast Button */}
                      <button
                        type="button"
                        onClick={handleWhatsAppBroadcast}
                        className="w-full bg-[#25D366] text-white py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:bg-[#20bd5a]"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Broadcast to WhatsApp
                      </button>

                      {generatedCaption && (
                        <div className="bg-[hsl(var(--glass-bg))] border border-[hsl(var(--glass-border))] rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Generated Caption
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyCaption}
                              className="text-xs text-accent-violet flex items-center gap-1 hover:underline"
                            >
                              {captionCopied ? (
                                <>
                                  <Check className="w-3 h-3" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed">{generatedCaption}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default BuilderSection;
