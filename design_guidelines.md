# LUMINI AEO Design Guidelines

## Design Philosophy
Professional SaaS platform comparable to Ahrefs/Semrush/AnswerThePublic. Premium, organized, data-driven aesthetic. Strict adherence to HCI principles: visibility, consistency, feedback, error prevention, aesthetic minimalism, user control, and accessibility.

## Visual Identity

### Brand
**LUMINI AEO** - Answer Engine Optimization Platform for Generative AI

**Critical Rule:** No emojis anywhere. Icons only (professional, minimal).

### Color System
- **Primary:** #2563EB (Royal Blue)
- **Primary Hover:** #1E40AF
- **Accent:** #10B981 (Emerald)
- **Neutral 900:** #0F172A (Slate 900)
- **Neutral 700:** #334155
- **Neutral 500:** #64748B
- **Surface:** #FFFFFF
- **Surface Alt:** #F8FAFC
- **Border:** #E2E8F0

**Dark Mode:** Optional toggle; maintain contrast ratios in both modes.

### Typography
- **Headings:** Inter, weights 600/700
- **Body:** Inter, weights 400/500
- **Line-height:** Generous spacing for readability
- **Hierarchy:** Clear H1/H2/H3 progression, distinct body and small text sizes

### Layout System
- **Spacing:** 8-point system throughout (8px, 16px, 24px, 32px, etc.)
- **Whitespace:** Generous and intentional
- **Cards:** Primary container pattern for content sections
- **Grid:** Consistent alignment across all pages

### Motion & Interaction
- **Micro-interactions:** 200-250ms with easing
- **No flashy animations:** Subtle, purposeful only
- **Loading states:** Smooth skeleton loaders
- **Transitions:** Tasteful, never distracting

## Component Design Standards

### Navigation
**Sidebar (Critical - Full Professional Treatment):**
- Grouped sections with clear hierarchy
- Collapsible groups with smooth transitions
- Icon for every menu item (Lucide)
- Active state highlighting
- Hover states with subtle background change
- Stable width on desktop, responsive collapse on mobile
- Groups: Overview, Research, Content Intelligence, AI Visibility, Optimization, Project/Settings

**Topbar:**
- Product logo (left)
- Search bar (center/left-center)
- Help, Notifications, User menu (right)
- Consistent height, subtle shadow/border

### Cards & Data Display
- **Shadow:** Tasteful, not heavy
- **Borders:** Subtle, using Border color
- **Padding:** Generous internal spacing
- **Status Chips:** Color-coded (Green/Yellow/Red for risk levels)
- **Tables:** Sticky headers, zebra rows, sortable columns, search filters
- **Empty States:** Helpful copy with clear next actions

### Charts (Restrained Use)
**Dashboard:** Four compact cards only:
- Queries Analyzed (mini line chart)
- Avg. Semantic Score (circular gauge)
- AI Citation Share (mini donut)
- Meta Health (stacked bar, small)

**Other Pages:** Charts only where they communicate better than tables. Never full-width unless absolutely necessary. Prefer compact, grid-aligned visualizations.

### Forms
- Clear labels above inputs
- Helper text where needed
- Inline validation with error messages
- Disabled submit until valid
- Password strength meter for signup
- Professional spacing between fields

### Data Tables
- Sticky column headers
- Zebra striping for readability
- Sort indicators in headers
- Search/filter bar above table
- Action buttons: Export CSV, Add to Cluster, etc.
- Tooltips for additional context

## Page-Specific Design Requirements

### Public Pages (Home/About/Contact)
**Home:**
- Hero: Bold headline, compelling subheading, prominent CTA "Start Free Demo"
- Large hero image showcasing the platform interface or data visualization concept
- Three feature cards with clean Lucide icons (Keyword Research, Semantic Score, AI Visibility)
- "How it works" 3-step visual strip
- Trust strip with dummy partner logos
- Testimonial slider with professional cards
- Comprehensive footer with navigation groups

**About:**
- Mission statement section
- Three team member cards (photo, title, bio)
- Timeline component showing progress milestones

**Contact:**
- Two-column layout: Form + Contact info/map placeholder
- Form fields: Name, Email, Subject, Message
- Success toast on submission

### Authentication Pages
- Centered card layout on neutral background
- Professional form design
- Clear CTAs
- "Remember me" and "Forgot password" for Login
- Password strength indicator for Signup
- Terms & Conditions checkbox

### Dashboard (Post-Login)
- **NOT chart-heavy:** Four compact stat cards with mini visualizations
- "Recent Activity" list (clean, scannable)
- "Pinned Reports" section with quick links
- Smooth skeleton loaders during data fetch
- Balanced whitespace, never cramped

### Module Pages
**Keyword Research:**
- Search bar prominent at top
- Filters: locale, language, intent (clean dropdowns/selects)
- Results table with columns: Keyword, Volume, CPC, Competition, Intent
- Top toolbar: Export CSV, Add to Cluster, Generate FAQs
- One compact bar chart (top 10 keywords by volume)

**Semantic Score Checker:**
- URL input with prominent "Analyze" button
- Score displayed as large circular gauge (0-100)
- Cards: Meta Title/Desc status, Key Entities, Topics Found
- One pie chart for coverage breakdown
- Table of Missing Topics with actionable suggestions

**AI Visibility:**
- Input section: Domain + Model selection (ChatGPT, Gemini, Perplexity)
- Summary cards: Queries Checked, Pages Cited, Competitors Count
- Two balanced charts: Citation Share (pie), Competitor Comparison (bar)
- Professional table: Query | Cited? | Cited By | Top Competitors
- Compact, grid-aligned layout

**Keyword Clustering (Tree):**
- Input: "Enter main keyword"
- D3 hierarchical collapsible tree visualization (primary focus)
- Tree levels: Root → Primary Cluster → Secondary → Sub-Secondary
- Accompanying data table
- Export CSV button

**PBN Detector:**
- Domain input
- Table: Referring Domain | IP | DA | Spam | Risk
- Risk chips color-coded (Green/Yellow/Red)
- Summary cards: Total Backlinks, High-Risk Domains, Disavow Candidates
- Export disavow.txt button

**Meta Tag Optimizer:**
- URL input
- Current meta display with status indicators (✅ OK / ⚠️ Long / ❌ Missing)
- Suggested replacements (editable fields)
- Live Google snippet preview
- Copy & Download actions

## Responsive Breakpoints
- **≥1440px (Desktop):** Comfortable spacing, 4-column card grids
- **≥1024px (Laptop):** 3-column grids
- **≥768px (Tablet):** 2-column grids, collapsed sidebar
- **<768px (Mobile):** Single column, off-canvas sidebar

## Accessibility & HCI
- **Keyboard Navigation:** Full support with visible focus rings
- **ARIA Attributes:** Proper labels and roles
- **Color Contrast:** WCAG AA minimum
- **System Status:** Always visible (loaders, progress bars)
- **Feedback:** Toasts for actions, disabled states for unavailable actions
- **Error Prevention:** Client-side validation, confirmation dialogs
- **Consistency:** Uniform component behavior across all pages

## Images
**Hero Section (Home page):** Large, high-quality hero image showcasing a sleek dashboard interface or abstract data visualization. Image should span full width with overlay gradient for text readability. Buttons on hero should have blurred backgrounds (backdrop-blur).

**About Page:** Professional headshots for team members (circular or rounded square).

**Other Pages:** Minimal decorative imagery; focus on data visualization and UI clarity.