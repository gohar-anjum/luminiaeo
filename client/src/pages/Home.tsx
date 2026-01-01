import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Search, 
  BarChart2, 
  Cpu, 
  Zap, 
  Database, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  CreditCard
} from "lucide-react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Now live: AEO Analytics v2.0
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 text-balance">
              Affordable <span className="text-gradient">Answer-Engine Optimization</span> for Everyone
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Don't just rank on search engines—be the answer. Our integrated suite of AI-powered tools helps you dominate the new era of search for a fraction of the cost.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-blue-500/25 bg-primary hover:bg-blue-600 hover:-translate-y-1 transition-all duration-300">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-slate-300 hover:bg-white hover:border-slate-400 text-slate-700">
                View Live Demo
              </Button>
            </motion.div>

            {/* Stats/Social Proof */}
            <motion.div variants={fadeInUp} className="mt-16 pt-8 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Queries Analyzed", value: "10M+" },
                { label: "Active Users", value: "5,000+" },
                { label: "Data Points", value: "1B+" },
                { label: "Money Saved", value: "$2M+" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="section-padding bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Complete Toolset for AEO</h2>
            <p className="text-lg text-slate-600">Everything you need to optimize your content for AI search engines like ChatGPT, Gemini, and Perplexity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: <Search className="w-6 h-6 text-blue-600" />, 
                title: "Keyword Research", 
                desc: "Discover high-intent questions users are actually asking AI models." 
              },
              { 
                icon: <Database className="w-6 h-6 text-indigo-600" />, 
                title: "FAQ Generator", 
                desc: "Automatically generate structured data and FAQ schemas that AI loves." 
              },
              { 
                icon: <BarChart2 className="w-6 h-6 text-purple-600" />, 
                title: "Semantic Score", 
                desc: "Get a 0-100 score on how well your content answers user intent." 
              },
              { 
                icon: <Cpu className="w-6 h-6 text-emerald-600" />, 
                title: "AI Indexability", 
                desc: "Check if your site is blocking or allowing AI scrapers effectively." 
              },
              { 
                icon: <Globe className="w-6 h-6 text-orange-600" />, 
                title: "Entity Mapping", 
                desc: "Visualize how AI connects your brand to related topics and entities." 
              },
              { 
                icon: <Zap className="w-6 h-6 text-yellow-600" />, 
                title: "Instant Audit", 
                desc: "One-click technical audit for both traditional SEO and AEO factors." 
              },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="section-padding bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Simple, Transparent, Effective</h2>
              <p className="text-lg text-slate-600 mb-8">No monthly subscriptions required. Pay only for what you use with our credit-based system.</p>
              
              <div className="space-y-8">
                {[
                  { step: "01", title: "Sign Up Free", desc: "Get started instantly with 10 free credits. No credit card required." },
                  { step: "02", title: "Choose Your Tool", desc: "Select from our suite of 12+ specialized AEO tools." },
                  { step: "03", title: "Get Results", desc: "Receive actionable insights and content optimizations in seconds." },
                  { step: "04", title: "Top Up Anytime", desc: "Buy more credits starting at just $5 whenever you need them." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary font-bold shadow-sm">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
               {/* Decorative card stack representation */}
               <div className="relative mx-auto w-full max-w-md aspect-square">
                 <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl opacity-10 rotate-6" />
                 <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 flex flex-col">
                   <div className="h-8 w-1/3 bg-slate-100 rounded-lg mb-6" />
                   <div className="space-y-4 mb-8">
                     <div className="h-4 w-full bg-slate-50 rounded" />
                     <div className="h-4 w-5/6 bg-slate-50 rounded" />
                     <div className="h-4 w-4/6 bg-slate-50 rounded" />
                   </div>
                   <div className="flex-1 bg-blue-50/50 rounded-xl border border-blue-100 p-6 flex flex-col justify-center items-center gap-4">
                     <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600">
                       <TrendingUp className="w-8 h-8" />
                     </div>
                     <div className="text-center">
                       <div className="text-2xl font-bold text-slate-900">94/100</div>
                       <div className="text-sm text-slate-500">Optimization Score</div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Pay As You Grow</h2>
            <p className="text-lg text-slate-600">Flexible credit packs. No expiring credits. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors">
              <h3 className="text-xl font-bold text-slate-900">Free Trial</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-slate-900">$0</span>
              </div>
              <p className="text-slate-600 mb-8 min-h-[48px]">Perfect for testing out the platform and running your first audit.</p>
              <Link href="/signup">
                <Button variant="outline" className="w-full mb-8 h-12 text-base font-semibold">Get Started</Button>
              </Link>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> 10 Credits included
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> Access to all tools
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> Basic support
                </li>
              </ul>
            </div>

            {/* Starter Tier - Highlighted */}
            <div className="relative p-8 rounded-2xl bg-slate-900 text-white shadow-2xl scale-105 border border-slate-800 z-10">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
              <h3 className="text-xl font-bold text-white">Starter Pack</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-white">$5</span>
                <span className="text-slate-400 font-medium"> / one-time</span>
              </div>
              <p className="text-slate-300 mb-8 min-h-[48px]">Enough for small sites and individual content creators.</p>
              <Button className="w-full mb-8 h-12 text-base font-semibold bg-primary hover:bg-blue-600 text-white border-0 shadow-lg shadow-blue-500/25">Buy Credits</Button>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> 100 Credits ($0.05/credit)
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> Never expires
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> Priority processing
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" /> Export to CSV/PDF
                </li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors">
              <h3 className="text-xl font-bold text-slate-900">Pro Pack</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-slate-900">$20</span>
                <span className="text-slate-400 font-medium"> / one-time</span>
              </div>
              <p className="text-slate-600 mb-8 min-h-[48px]">Best value for agencies and heavy users.</p>
              <Button variant="outline" className="w-full mb-8 h-12 text-base font-semibold">Buy Credits</Button>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> 500 Credits ($0.04/credit)
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> API Access
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> White-label reports
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- BLOG PREVIEW --- */}
      <section id="blog" className="section-padding bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Latest Insights</h2>
              <p className="text-slate-600">Stay ahead of the AI search curve.</p>
            </div>
            <a href="#" className="text-primary font-medium hover:underline hidden sm:block">View all posts →</a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "The AI Search Revolution is Here",
                excerpt: "Why Google SGE changes everything for SEO professionals and how to adapt.",
                date: "Oct 12, 2024",
                image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=400&fit=crop"
              },
              {
                title: "Optimizing for Perplexity",
                excerpt: "A deep dive into how citation engines work and how to get your brand cited.",
                date: "Oct 08, 2024",
                image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop"
              },
              {
                title: "Structured Data in 2025",
                excerpt: "The schema markups that matter most for LLM training data visibility.",
                date: "Sep 28, 2024",
                image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop"
              }
            ].map((post, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-[3/2] rounded-xl overflow-hidden mb-4 bg-slate-200">
                  {/* Blog post thumbnail */}
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="text-sm text-slate-500 mb-2">{post.date}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-slate-600 line-clamp-2">{post.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT & CTA --- */}
      <section id="contact" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">Ready to Optimize?</h2>
              <p className="text-xl text-slate-600 mb-10">Join thousands of forward-thinking marketers who are already optimizing for the future of search.</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">10 Free Credits</h4>
                    <p className="text-sm text-slate-600">No commitment required.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Instant Access</h4>
                    <p className="text-sm text-slate-600">Start analyzing in seconds.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <ContactForm />
          </div>
        </div>
      </section>

      {/* --- FINAL CTA BANNER --- */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-8">Stop playing catch-up. Start leading.</h2>
          <Link href="/signup">
            <Button size="lg" className="h-16 px-10 text-lg bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-2xl rounded-full">
              Start Your Free Trial Now
            </Button>
          </Link>
          <p className="mt-4 text-blue-100 text-sm opacity-80">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
