import { z } from "zod";

// User types (for API responses)
export const insertUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  name: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  name?: string;
  createdAt: string;
};

// Keyword data type
export interface KeywordData {
  id: string;
  keyword: string;
  volume: number;
  cpc: number;
  competition: string;
  intent: string;
}

// FAQ data type
export interface FAQData {
  id: string;
  question: string;
  answer: string;
  status: "pending" | "ready";
}

// Semantic score data type
export interface SemanticScoreData {
  url: string;
  score: number;
  metaTitle: string;
  metaDescription: string;
  entities: string[];
  topics: { name: string; coverage: number }[];
  missingTopics: { name: string; suggestion: string }[];
}

// AI visibility data type
export interface AIVisibilityData {
  query: string;
  cited: boolean;
  citedBy: string[];
  topCompetitors: string[];
}

// Content section type
export interface ContentSection {
  title: string;
  content: string;
}

// Generated content type
export interface GeneratedContent {
  title: string;
  intro: string;
  sections: ContentSection[];
  cta: string;
}

// Cluster node type
export interface ClusterNode {
  name: string;
  children?: ClusterNode[];
}

// PBN data type
export interface PBNData {
  id: string;
  referringDomain: string;
  ip: string;
  da: number;
  spam: number;
  risk: "low" | "medium" | "high";
}

// Meta tag data type
export interface MetaTagData {
  url: string;
  currentTitle: string;
  currentDescription: string;
  titleStatus: "ok" | "long" | "missing";
  descriptionStatus: "ok" | "long" | "missing";
  suggestedTitle: string;
  suggestedDescription: string;
}

// Project type
export interface Project {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  lastUpdated: string;
}

// Activity type
export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

// Dashboard metrics type
export interface DashboardMetrics {
  queriesAnalyzed: { value: number; trend: number[]; };
  avgSemanticScore: { value: number; change: number; };
  aiCitationShare: { value: number; breakdown: { name: string; value: number }[]; };
  metaHealth: { value: number; breakdown: { name: string; value: number }[]; };
}
