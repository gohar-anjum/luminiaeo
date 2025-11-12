import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Search, CheckCircle2, Eye, ArrowRight, Star } from "lucide-react";
import heroImage from "@assets/generated_images/SaaS_dashboard_hero_image_6c6317fb.png";

const features = [
  {
    icon: Search,
    title: "Keyword Research",
    description: "Discover high-impact keywords optimized for AI search engines like ChatGPT, Gemini, and Perplexity.",
  },
  {
    icon: CheckCircle2,
    title: "Semantic Score",
    description: "Analyze and improve your content's semantic relevance to boost AI citation rates.",
  },
  {
    icon: Eye,
    title: "AI Visibility",
    description: "Track when and where your content is cited across major AI platforms.",
  },
];

const steps = [
  { number: "01", title: "Analyze", description: "Import your content and run comprehensive AEO analysis" },
  { number: "02", title: "Optimize", description: "Apply AI-powered recommendations to improve visibility" },
  { number: "03", title: "Track", description: "Monitor citations and rankings across AI platforms" },
];

const testimonials = [
  {
    quote: "LUMINI AEO transformed our AI visibility strategy. We've seen a 300% increase in ChatGPT citations.",
    author: "Sarah Chen",
    role: "Head of Marketing, TechCorp",
    rating: 5,
  },
  {
    quote: "The semantic analysis tools are incredibly powerful. Essential for modern content optimization.",
    author: "Michael Rodriguez",
    role: "SEO Director, GrowthLabs",
    rating: 5,
  },
  {
    quote: "Finally, a platform that understands the future of search. Game-changing insights.",
    author: "Emily Watson",
    role: "Content Strategist, Digital Solutions",
    rating: 5,
  },
];

const partners = ["OpenAI", "Google", "Anthropic", "Perplexity", "Microsoft"];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent -z-10" />
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Optimize for the
                  <span className="text-primary"> AI Era</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Professional Answer Engine Optimization platform. Improve your visibility across ChatGPT, Gemini, Perplexity, and other AI search engines.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-hero-cta">
                    Start Free Demo
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-learn-more">
                    Learn More
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={heroImage}
                  alt="LUMINI AEO Dashboard Interface"
                  className="w-full h-auto"
                  data-testid="img-hero"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-3xl -z-10" />
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-success/20 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for AI Optimization
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed in the age of AI search
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate transition-all duration-200" data-testid={`card-feature-${index}`}>
                <CardContent className="p-8 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to AI optimization success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center space-y-4" data-testid={`step-${index}`}>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-12 bg-muted/40">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Optimized for major AI platforms
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="text-xl font-semibold text-muted-foreground/60"
                data-testid={`partner-${index}`}
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Marketing Teams
            </h2>
            <p className="text-lg text-muted-foreground">
              See what our customers have to say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover-elevate transition-all duration-200" data-testid={`testimonial-${index}`}>
                <CardContent className="p-8 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Optimize for AI Search?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of companies already improving their AI visibility
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
              data-testid="button-cta-signup"
            >
              Start Free Demo
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
