// src/config/featureHeroConfigs.ts
// All configs for FeatureHero — one per page.
// Each config is passed spread into <FeatureHero {...CONFIG} />.
// The hero IS the input form. Remove all duplicate search bars / inputs from pages.

export const KEYWORD_RESEARCH_HERO = {
  badge: "AI-Powered Research",
  accentColor: "#6366f1",
  headline: "Discover Keywords That Win in AI Search",
  subheadline:
      "Find high-intent keywords optimized for ChatGPT, Gemini, and Perplexity — not just Google. Get search volume, CPC, and intent signals in seconds.",
  ctaLabel: "Search Keywords",
  inputPlaceholder: "Enter a keyword or topic...",
  exampleValue: "answer engine optimization",
  exampleLabel: "Try an example",
  tips: ["Works in 212 countries", "Informational or all-intent modes"],
  stats: [
    { value: "100+", label: "keywords per search" },
    { value: "212", label: "countries supported" },
    { value: "2", label: "intent categories" },
    { value: "99%", label: "accuracy rate" },
  ],
  featurePoints: [
    { icon: "🎯", title: "Intent scoring", desc: "Know if keywords are informational, commercial, or transactional before you write a word." },
    { icon: "📊", title: "Volume & CPC data", desc: "Real search volume and cost-per-click from DataForSEO, not estimates." },
    { icon: "🤖", title: "AI visibility signals", desc: "See which keywords have the best chance of getting cited by AI answer engines." },
    { icon: "📥", title: "CSV export", desc: "Export your full keyword list with all metrics for use in your content strategy." },
  ],
};

export const FAQ_GENERATOR_HERO = {
  badge: "FAQ & Schema Markup",
  accentColor: "#0ea5e9",
  headline: "Generate FAQs That AI Engines Love to Cite",
  subheadline:
      "Enter a URL or topic and get structured FAQ content built to appear in AI-generated answers. Turn your content into authoritative Q&A pairs instantly.",
  ctaLabel: "Generate FAQs",
  inputPlaceholder: "Enter a URL or topic (e.g. digital marketing)...",
  exampleValue: "https://example.com/blog/seo-guide",
  exampleLabel: "Try an example",
  tips: ["Accepts any live URL", "Auto-detects schema type", "Location-aware output"],
  stats: [
    { value: "20+", label: "FAQs per generation" },
    { value: "< 30s", label: "generation time" },
    { value: "100%", label: "schema-ready output" },
  ],
  featurePoints: [
    { icon: "🔍", title: "URL or topic input", desc: "Paste any live URL or describe a topic — we handle the research automatically." },
    { icon: "✨", title: "AI-crafted answers", desc: "Answers are optimized for clarity and written to match how AI systems summarize information." },
    { icon: "📋", title: "One-click copy", desc: "Copy individual FAQs or all at once, ready to paste into your CMS or structured data." },
    { icon: "🌍", title: "Location-aware", desc: "Generate location-specific FAQs for any country or language market." },
  ],
};

export const SEMANTIC_SCORE_HERO = {
  badge: "Semantic Analysis",
  accentColor: "#10b981",
  headline: "See How Semantically Relevant Your Page Really Is",
  subheadline:
      "Get a precise 0–100 score showing how well your content matches user intent. Understand exactly which keywords to strengthen before AI engines evaluate your page.",
  ctaLabel: "Analyze Page",
  inputPlaceholder: "https://your-page.com/article",
  exampleValue: "https://lumini-aeo.com/guide",
  exampleLabel: "See a live example",
  tips: ["1 credit per new analysis", "Cached URLs are free", "Optional: add a focus keyword below"],
  stats: [
    { value: "1", label: "credit per analysis" },
    { value: "98%", label: "cache hit rate" },
    { value: "10+", label: "keyword signals" },
  ],
  featurePoints: [
    { icon: "📈", title: "Semantic score", desc: "Instant 0–100 relevance score with Excellent, Good, and Poor benchmarks." },
    { icon: "🔑", title: "Keyword breakdown", desc: "See extraction and semantic scores for each keyword on your page." },
    { icon: "💾", title: "Free repeat checks", desc: "Cached results mean re-analyzing the same URL costs zero credits." },
    { icon: "📜", title: "Full history", desc: "Every analysis is saved so you can track improvement over time." },
  ],
};

export const META_OPTIMIZER_HERO = {
  badge: "Meta Tag Optimization",
  accentColor: "#f59e0b",
  headline: "Optimize Your Meta Tags for Higher Click-Through Rates",
  subheadline:
      "Instantly analyze any URL and get AI-optimized title and description tags. See your SERP preview before you publish and fix keyword gaps in seconds.",
  ctaLabel: "Optimize Tags",
  inputPlaceholder: "https://your-page.com/article",
  exampleValue: "https://wikipedia.org/wiki/SEO",
  exampleLabel: "Try with Wikipedia",
  tips: ["4 credits per analysis", "Add a target keyword for sharper suggestions"],
  stats: [
    { value: "4", label: "credits per analysis" },
    { value: "50–60", label: "ideal title chars" },
    { value: "140–160", label: "ideal desc chars" },
  ],
  featurePoints: [
    { icon: "🖊️", title: "AI-rewritten tags", desc: "Keyword-optimized title and description suggestions tailored to your page content." },
    { icon: "👁️", title: "Live SERP preview", desc: "See exactly how your page will appear in Google results before making changes." },
    { icon: "💡", title: "Optimization tips", desc: "Actionable suggestions to close semantic gaps and improve click-through rates." },
    { icon: "🔄", title: "Re-analyze anytime", desc: "Click re-analyze from history to instantly refresh with one click." },
  ],
};

export const CONTENT_GENERATOR_HERO = {
  badge: "Semantic Content Outlines",
  accentColor: "#8b5cf6",
  headline: "Build Content That AI Engines Recognize as Authoritative",
  subheadline:
      "Generate AI-optimized content outlines with semantic keyword clusters, FAQ suggestions, and section briefs — structured to rank and get cited.",
  ctaLabel: "Generate Outline",
  inputPlaceholder: "Enter your target keyword...",
  exampleValue: "remote work productivity tips",
  exampleLabel: "Try this keyword",
  tips: ["4 credits per outline", "Choose a tone below before generating"],
  stats: [
    { value: "5+", label: "tone options" },
    { value: "4", label: "credits per outline" },
    { value: "1500+", label: "avg word estimate" },
  ],
  featurePoints: [
    { icon: "🏗️", title: "Full content structure", desc: "H2s, H3s, and section briefs laid out in a ready-to-write format." },
    { icon: "🏷️", title: "Semantic keywords", desc: "LSI and semantic keyword recommendations embedded throughout the outline." },
    { icon: "❓", title: "FAQ suggestions", desc: "Auto-generated FAQ questions based on your topic for structured data markup." },
    { icon: "📤", title: "Export as markdown", desc: "Copy as Markdown, plain text, or download as JSON for your content team." },
  ],
};

export const AI_VISIBILITY_HERO = {
  badge: "AI Citation Tracking",
  accentColor: "#ec4899",
  headline: "Find Out If AI Platforms Are Citing Your Brand",
  subheadline:
      "Analyze your domain across GPT and Gemini responses. See which queries trigger citations, compare against competitors, and track your AI share of voice.",
  ctaLabel: "Analyze Citations",
  inputPlaceholder: "https://yourdomain.com",
  exampleValue: "https://hubspot.com",
  exampleLabel: "See HubSpot's AI presence",
  tips: ["Analysis takes ~2 min", "10 queries checked per run", "GPT + Gemini both tested"],
  stats: [
    { value: "10", label: "queries analyzed" },
    { value: "2", label: "AI platforms checked" },
    { value: "~2min", label: "avg analysis time" },
  ],
  featurePoints: [
    { icon: "🤖", title: "GPT & Gemini tested", desc: "Your domain is checked against real AI-generated answers from both major platforms." },
    { icon: "📊", title: "Citation score", desc: "Get a % score showing how often your domain appears in AI responses." },
    { icon: "🏆", title: "Competitor comparison", desc: "See which competitor domains get cited instead of yours — and why." },
    { icon: "🔁", title: "Retry failed queries", desc: "One-click retry for any queries that failed during the analysis run." },
  ],
};

export const CLUSTERING_HERO = {
  badge: "Keyword Clustering",
  accentColor: "#14b8a6",
  headline: "Map Your Entire Keyword Universe in One View",
  subheadline:
      "Enter any seed keyword and get a full hierarchical topic tree — organized by intent, ready to drive your content architecture and internal linking strategy.",
  ctaLabel: "Build Cluster",
  inputPlaceholder: "Enter a seed keyword...",
  exampleValue: "content marketing",
  exampleLabel: "Try content marketing",
  tips: ["Cached results are instant and free", "Tree is interactive — click to expand branches"],
  stats: [
    { value: "100+", label: "nodes per cluster" },
    { value: "4", label: "intent categories" },
    { value: "< 60s", label: "generation time" },
  ],
  featurePoints: [
    { icon: "🌳", title: "Interactive tree", desc: "Visualize your keyword cluster as a draggable, zoomable tree — click to expand branches." },
    { icon: "🎯", title: "Intent labels", desc: "Every node is tagged: informational, commercial, transactional, or navigational." },
    { icon: "📁", title: "CSV export", desc: "Download the full cluster as CSV with depth, intent, and child count for your team." },
    { icon: "⚡", title: "Cached results", desc: "Re-running the same keyword returns instantly from cache at no extra cost." },
  ],
};

export const PBN_DETECTOR_HERO = {
  badge: "Backlink Risk Analysis",
  accentColor: "#ef4444",
  headline: "Detect PBN Links Before They Hurt Your Rankings",
  subheadline:
      "Analyze your backlink profile for private blog network footprints, spam signals, and high-risk referring domains — before Google does.",
  ctaLabel: "Analyze Domain",
  inputPlaceholder: "example.com",
  exampleValue: "example.com",
  exampleLabel: "Run a demo analysis",
  tips: ["Analysis takes ~3 min", "No credit card needed for demo", "Exports a disavow-ready list"],
  stats: [
    { value: "3", label: "risk categories" },
    { value: "10+", label: "detection signals" },
    { value: "~3min", label: "avg analysis time" },
  ],
  featurePoints: [
    { icon: "🚨", title: "Risk scoring", desc: "Every backlink scored as Low, Medium, or High risk with PBN probability percentage." },
    { icon: "🔎", title: "10+ detection signals", desc: "Domain age, registrar, spam score, safe browsing status, and more analyzed per link." },
    { icon: "🛡️", title: "Disavow-ready output", desc: "Export a filtered list of harmful backlinks to submit directly to Google Search Console." },
    { icon: "📋", title: "Full audit trail", desc: "Registrar info, domain age, and reason codes for every flagged backlink." },
  ],
};

export const DASHBOARD_HERO = {
  badge: "Overview",
  accentColor: "#6366f1",
  headline: "Your AI Search Optimization Command Center",
  subheadline:
      "Monitor credit usage, feature activity, and recent transactions in one place. Use the sidebar to jump into research, content, and visibility tools.",
  stats: [
    { value: "8+", label: "power tools" },
    { value: "24/7", label: "dashboard access" },
    { value: "100%", label: "credit transparency" },
  ],
  featurePoints: [
    { icon: "📊", title: "Usage at a glance", desc: "See how credits map to each feature so you can plan campaigns confidently." },
    { icon: "🧾", title: "Transaction history", desc: "Every purchase and deduction is listed with clear labels and timestamps." },
    { icon: "⚡", title: "Fast navigation", desc: "Move from overview to any tool without losing context." },
    { icon: "🔐", title: "Account-aware", desc: "Everything reflects your workspace, billing state, and entitlements." },
  ],
};

export const SETTINGS_HERO = {
  badge: "Account",
  accentColor: "#64748b",
  headline: "Tune Your Profile and Security",
  subheadline:
      "Update your identity, manage passwords, and control how we notify you about jobs, billing, and product updates.",
  stats: [
    { value: "3", label: "settings areas" },
    { value: "TLS", label: "encrypted sessions" },
    { value: "You", label: "own your data" },
  ],
  featurePoints: [
    { icon: "👤", title: "Profile", desc: "Keep name and email current for receipts and collaboration." },
    { icon: "🔒", title: "Security", desc: "Rotate passwords on a cadence that matches your policy." },
    { icon: "🔔", title: "Notifications", desc: "Decide which product emails you want to receive." },
    { icon: "✅", title: "Saved preferences", desc: "Changes apply immediately across the app." },
  ],
};

export const BILLING_HERO = {
  badge: "Credits",
  accentColor: "#f59e0b",
  headline: "Buy and Track Credits in One Place",
  subheadline:
      "Top up when you need more analyses, exports, or AI runs. Your balance updates after checkout so you can keep shipping.",
  stats: [
    { value: "1:1", label: "credits to usage" },
    { value: "Stripe", label: "secure checkout" },
    { value: "Instant", label: "balance refresh" },
  ],
  featurePoints: [
    { icon: "💳", title: "Simple checkout", desc: "Pick a bundle, pay once, and credits land on your account." },
    { icon: "📈", title: "Transparent pricing", desc: "See per-feature costs before you run heavy jobs." },
    { icon: "🧾", title: "History", desc: "Audit purchases alongside usage deductions." },
    { icon: "↩️", title: "Support-friendly", desc: "Everything you need if finance asks for a paper trail." },
  ],
};

export const PROJECTS_HERO = {
  badge: "Workspace",
  accentColor: "#0ea5e9",
  headline: "Organize Sites and Campaigns",
  subheadline:
      "Group domains and initiatives so your team can align on what is being optimized for AI search and traditional discovery.",
  stats: [
    { value: "∞", label: "projects" },
    { value: "1", label: "click overview" },
    { value: "Team", label: "ready layout" },
  ],
  featurePoints: [
    { icon: "🗂️", title: "Structured workspaces", desc: "Keep domains, notes, and priorities together per initiative." },
    { icon: "🌐", title: "Domain-first", desc: "See each property's footprint at a glance." },
    { icon: "📅", title: "Activity signals", desc: "Track last updates so nothing goes stale." },
    { icon: "➕", title: "Quick create", desc: "Spin up a new project when you onboard a site." },
  ],
};

export const BILLING_SUCCESS_HERO = {
  badge: "Payment",
  accentColor: "#10b981",
  headline: "Thanks — We're Confirming Your Credits",
  subheadline:
      "Stripe told us the payment succeeded. We finalize the ledger in the background; your balance updates automatically when processing completes.",
  stats: [
    { value: "✓", label: "payment received" },
    { value: "Auto", label: "balance sync" },
    { value: "Secure", label: "Stripe-backed" },
  ],
  featurePoints: [
    { icon: "🎯", title: "What's next", desc: "Head back to billing or jump straight into a tool while we finish syncing." },
    { icon: "📬", title: "Receipt", desc: "Check your email for Stripe's receipt and invoice details." },
    { icon: "💬", title: "Need help?", desc: "If the balance looks off after a few minutes, refresh or contact support." },
  ],
};

export const BILLING_CANCEL_HERO = {
  badge: "Checkout",
  accentColor: "#94a3b8",
  headline: "Checkout Was Canceled",
  subheadline:
      "No charges were made. You can adjust your bundle or try again whenever you are ready — your existing balance stays untouched.",
  stats: [
    { value: "$0", label: "charged" },
    { value: "Safe", label: "no changes" },
    { value: "Retry", label: "anytime" },
  ],
  featurePoints: [
    { icon: "🛒", title: "Pick another bundle", desc: "Different credit amounts are available on the billing page." },
    { icon: "🔁", title: "Instant retry", desc: "Restart checkout with the same or a new card." },
    { icon: "📊", title: "Keep working", desc: "Use remaining credits while you decide on a top-up." },
  ],
};