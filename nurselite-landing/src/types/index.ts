import { LucideIcon } from "lucide-react";

export type Audience = "patient" | "nurse";

export interface NavLink {
  label: string;
  href: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

export interface Service {
  name: string;
  description: string;
  duration: string;
  price: string;
}

export type ServicesByCategory = {
  [key: string]: Service[];
};

export interface Testimonial {
  id: number;
  name: string;
  location: string;
  avatar: string;
  rating: number;
  text: string;
  service: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Step {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Benefit {
  icon: LucideIcon;
  text: string;
}

export interface HeroContent {
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  secondaryCta?: string;
  benefits: Benefit[];
}

export interface Segment {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  services: string[];
  cta: string;
  ctaLink: string;
}

export interface SecurityFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}
