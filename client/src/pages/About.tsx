import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import team1 from "@assets/generated_images/Team_member_headshot_1_a93f13a1.png";
import team2 from "@assets/generated_images/Team_member_headshot_2_a5b48c82.png";
import team3 from "@assets/generated_images/Team_member_headshot_3_f879fe38.png";

const team = [
  {
    name: "Gohar Anjum",
    role: "CEO & Co-Founder",
    bio: "Head of AI Research at ideavire. Expert in On-page and search algorithms with 7+ years experience.",
    image: team1,
  },
  {
    name: "Syed Agha Shah Hassan",
    role: "CTO & Co-Founder",
    bio: "SEO Team Lead at ideavire Ltd. Previously led on-page team lead at ideavire Ltd. Passionate about AI accessibility.",
    image: team2,
  },
  {
    name: "Muhammad Talha Jameel",
    role: "Head of Product",
    bio: "Off-page expert with deep expertise in Backlink Aquisition and PBN analytics. Building Backlinks that google love.",
    image: team3,
  },
];

const milestones = [
  { year: "2022", title: "Founded", description: "Started with a mission to democratize AI optimization" },
  { year: "2023", title: "Product Launch", description: "Released first version to early adopters" },
  { year: "2023 Q4", title: "Growth", description: "Reached 1,000+ active users across 30 countries" },
  { year: "2024", title: "Innovation", description: "Launched AI citation tracking and clustering tools" },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              About LUMINI AEO
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              We're building the future of search optimization. As AI transforms how people find information, we help businesses adapt and thrive in this new era.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Our Mission
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                The rise of AI-powered answer engines like ChatGPT, Google Gemini, and Perplexity is fundamentally changing how information is discovered and consumed. Traditional search engine optimization is no longer enough.
              </p>
              <p>
                LUMINI AEO was created to solve a critical challenge: helping businesses optimize their content for AI visibility. We provide the tools, insights, and analytics needed to ensure your content is discovered, cited, and trusted by AI platforms.
              </p>
              <p>
                Our platform combines advanced semantic analysis, citation tracking, and content optimization tools to give you a competitive edge in the AI era. Whether you're a content creator, marketer, or business owner, we make AI optimization accessible and actionable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {[
                { label: "Active Users", value: "10,000+" },
                { label: "AI Citations Tracked", value: "1M+" },
                { label: "Countries", value: "50+" },
              ].map((stat, index) => (
                <Card key={index} data-testid={`stat-${index}`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-muted-foreground">
              Experts in AI, search, and content optimization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="hover-elevate transition-all duration-200" data-testid={`team-member-${index}`}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      data-testid={`img-team-${index}`}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{member.name}</h3>
                    <p className="text-sm text-primary font-medium">{member.role}</p>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-muted-foreground">
              Building the future of AI optimization
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="flex gap-6 items-start"
                data-testid={`milestone-${index}`}
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1 pb-8 border-b last:border-0">
                  <div className="text-sm font-semibold text-primary mb-1">
                    {milestone.year}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                  <p className="text-muted-foreground">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
