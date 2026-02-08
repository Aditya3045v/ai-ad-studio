import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImageIcon, Loader2, X, Check, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BuilderSectionProps {
  sectionRef: React.RefObject<HTMLElement>;
}

const BuilderSection = ({ sectionRef }: BuilderSectionProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("Instagram Story");
  const [tone, setTone] = useState("Professional");
  const [aspectRatio, setAspectRatio] = useState("9:16 (Story)");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 5MB.", variant: "destructive" });
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setLocalPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("ad-assets")
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("ad-assets")
        .getPublicUrl(filePath);

      setProductImageUrl(urlData.publicUrl);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message || "Could not upload image.", variant: "destructive" });
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = () => {
    setProductImageUrl(null);
    setLocalPreview(null);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsGenerating(true);
    setShowResults(false);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-ad-image", {
        body: {
          headline: description,
          style: "photorealistic" as const,
          brandName: "Campaign",
          description: `Create a ${platform} ad with a ${tone.toLowerCase()} tone. Aspect ratio: ${aspectRatio}. ${description}`,
          logoUrl: null,
          productImageUrl: productImageUrl,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedImage(data.imageUrl);
      setShowResults(true);
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: e.message || "Could not generate campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [description, platform, tone, aspectRatio, productImageUrl, toast]);

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = "adgen-campaign.png";
    link.click();
  };

  const previewSrc = localPreview || productImageUrl;

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1000px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-full text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-6">
            Create
          </div>
          <h2 className="font-heading text-[40px] font-semibold mb-4">Start Your Campaign</h2>
          <p className="text-muted-foreground">Drag, drop, and let AI handle the rest.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-6 md:p-10 rounded-3xl">
            {/* Left Column: Image Upload */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2">
                Product Image
              </label>
              <div
                className={`border-2 border-dashed rounded-2xl h-[300px] flex justify-center items-center text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
                  isDragging
                    ? "border-accent-violet bg-[rgba(139,92,246,0.05)]"
                    : "border-[rgba(255,255,255,0.08)] hover:border-accent-violet hover:bg-[rgba(139,92,246,0.05)]"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                {previewSrc ? (
                  <>
                    <img
                      src={previewSrc}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-accent-violet" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(); }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center gap-2">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p className="text-sm">
                      Drag & Drop or <span className="text-accent-violet underline">Browse</span>
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Right Column: Inputs */}
            <div className="flex flex-col gap-0">
              {/* Ad Description */}
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2">
                  Ad Description
                </label>
                <textarea
                  placeholder="Describe your product and campaign goal..."
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] p-3 px-4 rounded-lg text-foreground font-sans text-sm outline-none transition-colors duration-300 focus:border-accent-violet resize-none"
                />
              </div>

              {/* Platform + Tone */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] p-3 px-4 rounded-lg text-foreground font-sans text-sm outline-none transition-colors duration-300 focus:border-accent-violet appearance-none cursor-pointer"
                  >
                    <option>Instagram Story</option>
                    <option>Instagram Post</option>
                    <option>WhatsApp Status</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] p-3 px-4 rounded-lg text-foreground font-sans text-sm outline-none transition-colors duration-300 focus:border-accent-violet appearance-none cursor-pointer"
                  >
                    <option>Professional</option>
                    <option>Playful</option>
                    <option>Urgent</option>
                    <option>Luxury</option>
                  </select>
                </div>
              </div>

              {/* Aspect Ratio + Email */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] p-3 px-4 rounded-lg text-foreground font-sans text-sm outline-none transition-colors duration-300 focus:border-accent-violet appearance-none cursor-pointer"
                  >
                    <option>9:16 (Story)</option>
                    <option>1:1 (Square)</option>
                    <option>4:5 (Portrait)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2">
                    Work Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] p-3 px-4 rounded-lg text-foreground font-sans text-sm outline-none transition-colors duration-300 focus:border-accent-violet"
                  />
                </div>
              </div>

              {/* Consent */}
              <div className="flex items-center gap-3 mb-6">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="w-4 h-4 rounded border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] accent-accent-violet cursor-pointer"
                />
                <label htmlFor="consent" className="text-xs text-muted-foreground font-normal cursor-pointer">
                  I verify that I have the rights to use this content.
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-foreground text-background py-3 px-8 rounded-full font-semibold text-sm border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isGenerating ? "Generating..." : "Generate Campaign"}
              </button>
            </div>
          </div>
        </form>

        {/* Results Area */}
        <AnimatePresence>
          {showResults && generatedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-10 text-center"
            >
              <div className="mb-6">
                <div className="w-12 h-12 bg-[#00C853] text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-1">Campaign Generated!</h3>
                <p className="text-muted-foreground text-sm">Your assets are ready for download.</p>
              </div>

              <div className="max-w-[600px] mx-auto rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-black">
                <img
                  src={generatedImage}
                  alt="Generated campaign"
                  className="w-full h-auto"
                />
              </div>

              <button
                onClick={handleDownload}
                className="mt-6 bg-transparent text-foreground py-3 px-8 rounded-full font-medium text-sm border border-[rgba(255,255,255,0.08)] cursor-pointer inline-flex items-center gap-2 transition-all duration-300 hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.03)]"
              >
                <Download className="w-4 h-4" />
                Download Image
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default BuilderSection;
