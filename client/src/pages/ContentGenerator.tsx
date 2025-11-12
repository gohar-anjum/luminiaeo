import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContentGenerator() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("neutral");
  const [targetLength, setTargetLength] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt or keyword",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setContent({
      title: `The Complete Guide to ${prompt}`,
      intro: `Understanding ${prompt} is essential in today's digital landscape. This comprehensive guide will walk you through everything you need to know to master this important topic.`,
      sections: [
        {
          title: `What is ${prompt}?`,
          content: `${prompt} represents a fundamental shift in how we approach modern challenges. By understanding its core principles, you can leverage its power to achieve remarkable results.`,
        },
        {
          title: "Key Benefits and Advantages",
          content: "There are numerous advantages to implementing this approach. From improved efficiency to better outcomes, the benefits are clear and measurable.",
        },
        {
          title: "Best Practices and Strategies",
          content: "Success requires following proven methodologies. Here are the essential strategies that top performers use to maximize their results.",
        },
        {
          title: "Common Challenges and Solutions",
          content: "While powerful, there are challenges to navigate. Understanding these obstacles and their solutions is key to long-term success.",
        },
      ],
      cta: "Ready to get started? Begin implementing these strategies today and see the difference for yourself.",
    });

    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (!content) return;

    const text = `${content.title}\n\n${content.intro}\n\n${content.sections
      .map((s: any) => `${s.title}\n${s.content}`)
      .join("\n\n")}\n\n${content.cta}`;

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Downloading content as TXT file...",
    });
  };

  const handleRegenerateSection = (index: number) => {
    toast({
      title: "Regenerating...",
      description: "Creating new content for this section",
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Semantic Content Generator</h1>
        <p className="text-muted-foreground">
          Generate optimized content for AI search engines
        </p>
      </div>

      <Card data-testid="card-generator">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt / Keyword</Label>
              <Input
                id="prompt"
                placeholder="Enter topic or keyword..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                data-testid="input-prompt"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone" data-testid="select-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">Target Length</Label>
                <Select value={targetLength} onValueChange={setTargetLength}>
                  <SelectTrigger id="length" data-testid="select-length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (500-800 words)</SelectItem>
                    <SelectItem value="medium">Medium (800-1500 words)</SelectItem>
                    <SelectItem value="long">Long (1500+ words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              data-testid="button-generate"
            >
              {isGenerating ? "Generating..." : "Generate Content"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {content && (
        <>
          <div className="flex gap-2">
            <Button onClick={handleCopy} data-testid="button-copy">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button onClick={handleDownload} variant="outline" data-testid="button-download">
              <Download className="w-4 h-4 mr-2" />
              Download .txt
            </Button>
          </div>

          <Card data-testid="card-content">
            <CardContent className="p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4" data-testid="text-title">{content.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{content.intro}</p>
              </div>

              {content.sections.map((section: any, index: number) => (
                <div key={index} className="space-y-3" data-testid={`section-${index}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRegenerateSection(index)}
                      data-testid={`button-regenerate-${index}`}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                  <Textarea
                    value={section.content}
                    onChange={(e) => {
                      const newSections = [...content.sections];
                      newSections[index].content = e.target.value;
                      setContent({ ...content, sections: newSections });
                    }}
                    rows={3}
                    className="resize-none"
                    data-testid={`textarea-${index}`}
                  />
                </div>
              ))}

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Call to Action</h3>
                <Textarea
                  value={content.cta}
                  onChange={(e) => setContent({ ...content, cta: e.target.value })}
                  rows={2}
                  className="resize-none"
                  data-testid="textarea-cta"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
