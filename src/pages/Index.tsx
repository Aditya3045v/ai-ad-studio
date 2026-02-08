import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import StepIndicator from "@/components/StepIndicator";
import BrandContextStep from "@/components/BrandContextStep";
import StrategyStep from "@/components/StrategyStep";
import VisualStyleStep from "@/components/VisualStyleStep";
import CanvasStep from "@/components/CanvasStep";
import type { BrandContext, Headline, VisualStyle } from "@/types/marketing";

const steps = [
  { label: "Context", icon: "📋" },
  { label: "Strategy", icon: "💡" },
  { label: "Style", icon: "🎨" },
  { label: "Canvas", icon: "✨" },
];

const Index = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const [brandContext, setBrandContext] = useState<BrandContext>({
    brandName: "",
    industry: "",
    description: "",
    targetAudience: "",
  });
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [selectedHeadline, setSelectedHeadline] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingHeadlines, setIsGeneratingHeadlines] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleGenerateHeadlines = useCallback(async () => {
    setIsGeneratingHeadlines(true);
    setHeadlines([]);
    setSelectedHeadline("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-headlines", {
        body: brandContext,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setHeadlines(data.headlines || []);
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: e.message || "Could not generate headlines. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingHeadlines(false);
    }
  }, [brandContext, toast]);

  const handleGenerateImage = useCallback(async () => {
    if (!selectedStyle || !selectedHeadline) return;
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ad-image", {
        body: {
          headline: selectedHeadline,
          style: selectedStyle,
          brandName: brandContext.brandName,
          description: brandContext.description,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedImage(data.imageUrl);
    } catch (e: any) {
      toast({
        title: "Image generation failed",
        description: e.message || "Could not generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  }, [selectedStyle, selectedHeadline, brandContext, toast]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">AdStudio</h1>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                AI Marketing Engine
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
            Pro
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <StepIndicator currentStep={currentStep} steps={steps} />

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <BrandContextStep
              key="step1"
              data={brandContext}
              onChange={setBrandContext}
              onNext={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 2 && (
            <StrategyStep
              key="step2"
              brandContext={brandContext}
              headlines={headlines}
              selectedHeadline={selectedHeadline}
              isGenerating={isGeneratingHeadlines}
              onGenerate={handleGenerateHeadlines}
              onSelect={setSelectedHeadline}
              onBack={() => setCurrentStep(1)}
              onNext={() => setCurrentStep(3)}
            />
          )}
          {currentStep === 3 && (
            <VisualStyleStep
              key="step3"
              selectedStyle={selectedStyle}
              onSelect={setSelectedStyle}
              onBack={() => setCurrentStep(2)}
              onNext={() => setCurrentStep(4)}
            />
          )}
          {currentStep === 4 && selectedStyle && (
            <CanvasStep
              key="step4"
              brandContext={brandContext}
              headline={selectedHeadline}
              style={selectedStyle}
              generatedImage={generatedImage}
              isGenerating={isGeneratingImage}
              onGenerate={handleGenerateImage}
              onBack={() => setCurrentStep(3)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
