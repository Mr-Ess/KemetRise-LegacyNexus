import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Star, ChevronDown, X, CheckCircle, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// -----------------------------------------------------------------
//  TYPES
// -----------------------------------------------------------------
type TypeId = "all" | "digital" | "physical" | "virtual" | "service" | "subscription";

interface CatalogItem {
  id: string;
  type: TypeId;
  category: string;
  category_ar: string;
  sub_category?: string;
  sub_category_ar?: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price_cents?: number;
  compare_price_cents?: number;
  pricing_model?: string;
  icon: string;
  color: string;
  rating: number;
  reviews_count: number;
  is_featured?: boolean;
  is_new?: boolean;
  features?: string[];
  features_ar?: string[];
}

// -----------------------------------------------------------------
//  TYPE CONFIG
// -----------------------------------------------------------------
const TYPE_CONFIG: Record<TypeId, { label_ar: string; label_en: string; icon: string; color: string }> = {
  all:          { label_ar: "\u0627\u0644\u0643\u0644",           label_en: "All",           icon: "\uD83C\uDFDB\uFE0F", color: "#94a3b8" },
  digital:      { label_ar: "\u0631\u0642\u0645\u064a\u0629",          label_en: "Digital",       icon: "\uD83D\uDCBB", color: "#06b6d4" },
  physical:     { label_ar: "\u0645\u0644\u0645\u0648\u0633\u0629",         label_en: "Physical",      icon: "\uD83D\uDCE6", color: "#f59e0b" },
  virtual:      { label_ar: "\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629",       label_en: "Virtual",       icon: "\u2728", color: "#8b5cf6" },
  service:      { label_ar: "\u062e\u062f\u0645\u0627\u062a",          label_en: "Services",      icon: "\u2699\uFE0F", color: "#10b981" },
  subscription: { label_ar: "\u0627\u0634\u062a\u0631\u0627\u0643\u0627\u062a",       label_en: "Subscriptions", icon: "\uD83C\uDFC6", color: "#f43f5e" },
};

// -----------------------------------------------------------------
//  CATALOG DATA
// -----------------------------------------------------------------
const ALL_ITEMS: CatalogItem[] = [
  // DIGITAL - Software
  { id:"d1",  type:"digital",  category:"Software",         category_ar:"\u0628\u0631\u0645\u062c\u064a\u0627\u062a",    sub_category:"ERP",       sub_category_ar:"ERP \u0648\u0627\u0644\u0645\u0627\u0644\u064a\u0629",   name:"Enterprise ERP License",            name_ar:"\u0631\u062e\u0635\u0629 ERP \u0627\u0644\u0645\u0624\u0633\u0633\u064a",         description:"Full ERP: finance, HR, inventory, CRM & analytics.",               description_ar:"ERP \u0643\u0627\u0645\u0644: \u0645\u0627\u0644\u064a\u0629\u060c \u0645\u0648\u0627\u0631\u062f \u0628\u0634\u0631\u064a\u0629\u060c \u0645\u062e\u0632\u0648\u0646\u060c CRM \u0648\u062a\u062d\u0644\u064a\u0644\u0627\u062a.",  price_cents:99900,  pricing_model:"annual",    icon:"\u26A1", color:"#f59e0b", rating:4.9, reviews_count:128, is_featured:true,  features:["Finance Module","HR & Payroll","Inventory & WMS","CRM Pipeline","Advanced Reports","Multi-branch"],                 features_ar:["\u0648\u062d\u062f\u0629 \u0627\u0644\u0645\u0627\u0644\u064a\u0629","\u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629 \u0648\u0627\u0644\u0631\u0648\u0627\u062a\u0628","\u0627\u0644\u0645\u062e\u0632\u0648\u0646 \u0648\u0627\u0644\u0645\u0633\u062a\u0648\u062f\u0639\u0627\u062a","\u062e\u0637 CRM","\u062a\u0642\u0627\u0631\u064a\u0631 \u0645\u062a\u0642\u062f\u0645\u0629","\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0641\u0631\u0648\u0639"] },
  { id:"d3",  type:"digital",  category:"Software",         category_ar:"\u0628\u0631\u0645\u062c\u064a\u0627\u062a",    sub_category:"HR",        sub_category_ar:"\u0645\u0648\u0627\u0631\u062f \u0628\u0634\u0631\u064a\u0629",    name:"HR & Attendance Module",            name_ar:"\u0648\u062d\u062f\u0629 \u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629 \u0648\u0627\u0644\u062d\u0636\u0648\u0631",  description:"QR biometric attendance, payroll, leave & shifts.",                description_ar:"\u062d\u0636\u0648\u0631 QR \u0627\u0644\u0628\u064a\u0648\u0645\u062a\u0631\u064a\u060c \u0631\u0648\u0627\u062a\u0628\u060c \u0625\u062c\u0627\u0632\u0627\u062a \u0648\u0648\u0631\u062f\u064a\u0627\u062a.",  price_cents:29900,  compare_price_cents:39900, pricing_model:"annual",    icon:"\uD83D\uDC65", color:"#8b5cf6", rating:4.7, reviews_count:74,  features:["QR Attendance","Payroll Processing","Leave Management","Shift Scheduling","Employee Portal","Payslips"],              features_ar:["\u062d\u0636\u0648\u0631 QR","\u0645\u0639\u0627\u0644\u062c\u0629 \u0627\u0644\u0631\u0648\u0627\u062a\u0628","\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0625\u062c\u0627\u0632\u0627\u062a","\u062c\u062f\u0648\u0644\u0629 \u0627\u0644\u0648\u0631\u062f\u064a\u0627\u062a","\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646","\u0642\u0633\u0627\u0626\u0645 \u0627\u0644\u0631\u0648\u0627\u062a\u0628"] },
  { id:"d9",  type:"digital",  category:"Software",         category_ar:"\u0628\u0631\u0645\u062c\u064a\u0627\u062a",    sub_category:"Inventory", sub_category_ar:"\u0645\u062e\u0632\u0648\u0646 \u0648\u0645\u0633\u062a\u0648\u062f\u0639\u0627\u062a",  name:"Inventory & Warehouse Module",      name_ar:"\u0648\u062d\u062f\u0629 \u0627\u0644\u0645\u062e\u0632\u0648\u0646 \u0648\u0627\u0644\u0645\u0633\u062a\u0648\u062f\u0639",   description:"SKU management, barcode, low-stock alerts & multi-location.",       description_ar:"\u0625\u062f\u0627\u0631\u0629 SKU\u060c \u0628\u0627\u0631\u0643\u0648\u062f\u060c \u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0648\u062a\u062a\u0628\u0639 \u0645\u062a\u0639\u062f\u062f.",  price_cents:34900,  pricing_model:"annual",    icon:"\uD83D\uDCE6", color:"#6366f1", rating:4.5, reviews_count:57,  features:["SKU Management","Barcode Scanning","Low-stock Alerts","Multi-location","Transfer Orders","Inventory Reports"],      features_ar:["\u0625\u062f\u0627\u0631\u0629 SKU","\u0645\u0633\u062d \u0627\u0644\u0628\u0627\u0631\u0643\u0648\u062f","\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0645\u062e\u0632\u0648\u0646","\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0645\u0648\u0627\u0642\u0639","\u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u062a\u062d\u0648\u064a\u0644","\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0645\u062e\u0632\u0648\u0646"] },
  { id:"d12", type:"digital",  category:"Software",         category_ar:"\u0628\u0631\u0645\u062c\u064a\u0627\u062a",    sub_category:"E-Commerce",sub_category_ar:"\u062a\u062c\u0627\u0631\u0629 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0629",  name:"E-commerce Storefront",             name_ar:"\u0648\u0627\u062c\u0647\u0629 \u0627\u0644\u0645\u062a\u062c\u0631 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",   description:"Full online store: catalog, payment, orders & shipping.",           description_ar:"\u0645\u062a\u062c\u0631 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0643\u0627\u0645\u0644: \u0643\u062a\u0627\u0644\u0648\u062c\u060c \u062f\u0641\u0639\u060c \u0637\u0644\u0628\u0627\u062a \u0648\u0634\u062d\u0646.",  price_cents:44900,  pricing_model:"annual",    icon:"\uD83D\uDED2", color:"#22c55e", rating:4.7, reviews_count:94,  features:["Product Catalog","Payment Gateway","Order Management","Shipping Integration","Coupon System","Analytics"],          features_ar:["\u0643\u062a\u0627\u0644\u0648\u062c \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a","\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u062f\u0641\u0639","\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a","\u062a\u0643\u0627\u0645\u0644 \u0627\u0644\u0634\u062d\u0646","\u0646\u0638\u0627\u0645 \u0627\u0644\u0643\u0648\u0628\u0648\u0646\u0627\u062a","\u0627\u0644\u062a\u062d\u0644\u064a\u0644\u0627\u062a"] },
  // DIGITAL - AI
  { id:"d2",  type:"digital",  category:"AI",               category_ar:"\u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a",    sub_category:"Agents",    sub_category_ar:"\u0648\u0643\u0644\u0627\u0621 AI",   name:"AI Agent Pack - 10 Agents",         name_ar:"\u062d\u0632\u0645\u0629 \u0648\u0643\u0644\u0627\u0621 AI \u2014 10 \u0648\u0643\u0644\u0627\u0621",   description:"Deploy 10 custom AI agents powered by GPT-4.",                     description_ar:"\u0646\u0634\u0631 10 \u0648\u0643\u0644\u0627\u0621 AI \u0645\u062e\u0635\u0635\u064a\u0646 \u0645\u062f\u0639\u0648\u0645\u064a\u0646 \u0628\u0640 GPT-4.",  price_cents:49900,  pricing_model:"annual",    icon:"\uD83E\uDD16", color:"#06b6d4", rating:4.8, reviews_count:89,  is_new:true,  features:["10 AI Agents","Custom Training","Arabic + English","Chat & Voice","Analytics Dashboard","API Integration"],       features_ar:["10 \u0648\u0643\u064a\u0644 AI","\u062a\u062f\u0631\u064a\u0628 \u0645\u062e\u0635\u0635","\u0639\u0631\u0628\u064a \u0648\u0625\u0646\u062c\u0644\u064a\u0632\u064a","\u062f\u0631\u062f\u0634\u0629 \u0648\u0635\u0648\u062a","\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0644\u064a\u0644\u0627\u062a","\u062a\u0643\u0627\u0645\u0644 API"] },
  // DIGITAL - Marketing
  { id:"d4",  type:"digital",  category:"Marketing",        category_ar:"\u062a\u0633\u0648\u064a\u0642",    sub_category:"CRM",       sub_category_ar:"CRM \u0648\u0627\u0644\u0639\u0645\u0644\u0627\u0621",   name:"Marketing Suite",                   name_ar:"\u062d\u0632\u0645\u0629 \u0627\u0644\u062a\u0633\u0648\u064a\u0642",       description:"CRM + campaign manager + lead pipeline + ROI analytics.",          description_ar:"CRM + \u0645\u062f\u064a\u0631 \u062d\u0645\u0644\u0627\u062a + \u062e\u0637 \u0639\u0645\u0644\u0627\u0621 + \u062a\u062d\u0644\u064a\u0644\u0627\u062a ROI.",  price_cents:14900,  pricing_model:"monthly",   icon:"\uD83D\uDCE3", color:"#ec4899", rating:4.6, reviews_count:52,  is_featured:true, features:["CRM System","Email Campaigns","Lead Pipeline","ROI Tracking","Social Scheduling","Automation Rules"],            features_ar:["\u0646\u0638\u0627\u0645 CRM","\u062d\u0645\u0644\u0627\u062a \u0627\u0644\u0628\u0631\u064a\u062f","\u062e\u0637 \u0627\u0644\u0639\u0645\u0644\u0627\u0621","\u062a\u062a\u0628\u0639 ROI","\u062c\u062f\u0648\u0644\u0629 \u0627\u0644\u0633\u0648\u0634\u064a\u0627\u0644","\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0623\u062a\u0645\u062a\u0629"] },
  { id:"d10", type:"digital",  category:"Marketing",        category_ar:"\u062a\u0633\u0648\u064a\u0642",    sub_category:"Support",   sub_category_ar:"\u062f\u0639\u0645 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",   name:"Live Chat & Support Hub",           name_ar:"\u062d\u0632\u0645\u0629 \u0627\u0644\u062f\u0639\u0645 \u0648\u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629",  description:"Multi-channel chat, tickets, SLA tracking.",                       description_ar:"\u062f\u0631\u062f\u0634\u0629 \u0645\u062a\u0639\u062f\u062f\u0629 \u0627\u0644\u0642\u0646\u0648\u0627\u062a\u060c \u062a\u0630\u0627\u0643\u0631 \u0648\u062a\u062a\u0628\u0639 SLA.",  price_cents:12900,  pricing_model:"monthly",   icon:"\uD83D\uDCAC", color:"#14b8a6", rating:4.6, reviews_count:65,  is_new:true,  features:["Live Chat","Ticket System","SLA Tracking","Multi-channel","Customer Surveys","Reporting"],                        features_ar:["\u062f\u0631\u062f\u0634\u0629 \u0645\u0628\u0627\u0634\u0631\u0629","\u0646\u0638\u0627\u0645 \u0627\u0644\u062a\u0630\u0627\u0643\u0631","\u062a\u062a\u0628\u0639 SLA","\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0642\u0646\u0648\u0627\u062a","\u0627\u0633\u062a\u0637\u0644\u0627\u0639\u0627\u062a \u0627\u0644\u0639\u0645\u0644\u0627\u0621","\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631"] },
  // DIGITAL - Platform
  { id:"d5",  type:"digital",  category:"Platform",         category_ar:"\u0627\u0644\u0645\u0646\u0635\u0629",    sub_category:"Sectors",   sub_category_ar:"\u062d\u0632\u0645 \u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a",   name:"Sector Activation Bundle",          name_ar:"\u062d\u0632\u0645\u0629 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a",   description:"Unlock any 5 business sectors.",                                   description_ar:"\u0627\u0641\u062a\u062d 5 \u0642\u0637\u0627\u0639\u0627\u062a \u0623\u0639\u0645\u0627\u0644 \u0645\u062e\u0635\u0635\u0629.",  price_cents:19900,  pricing_model:"one_time",  icon:"\uD83C\uDFD7\uFE0F", color:"#f97316", rating:4.5, reviews_count:210, is_featured:true, features:["5 Sectors Choice","Custom Modules","Sector Templates","Multi-location","Analytics","Priority Onboarding"],          features_ar:["\u0627\u062e\u062a\u064a\u0627\u0631 5 \u0642\u0637\u0627\u0639\u0627\u062a","\u0648\u062d\u062f\u0627\u062a \u0645\u062e\u0635\u0635\u0629","\u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a","\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0645\u0648\u0627\u0642\u0639","\u0627\u0644\u062a\u062d\u0644\u064a\u0644\u0627\u062a","\u0625\u0639\u062f\u0627\u062f \u0623\u0648\u0644\u0648\u064a\u0629"] },
  { id:"d8",  type:"digital",  category:"Platform",         category_ar:"\u0627\u0644\u0645\u0646\u0635\u0629",    sub_category:"Partner",   sub_category_ar:"\u0628\u064a\u0626\u0629 \u0639\u0645\u0644 \u0627\u0644\u0634\u0631\u064a\u0643",   name:"Partner Workspace Licence",         name_ar:"\u0631\u062e\u0635\u0629 \u0628\u064a\u0626\u0629 \u0639\u0645\u0644 \u0627\u0644\u0634\u0631\u064a\u0643",   description:"Isolated multi-tenant workspace with revenue sharing.",             description_ar:"\u0628\u064a\u0626\u0629 \u0639\u0645\u0644 \u0645\u0639\u0632\u0648\u0644\u0629 \u0645\u0639 \u062a\u0634\u0627\u0631\u0643 \u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a.",  price_cents:59900,  compare_price_cents:79900, pricing_model:"annual",    icon:"\uD83E\uDD1D", color:"#10b981", rating:4.7, reviews_count:33,  is_featured:true, features:["Isolated Workspace","Team Management","Revenue Sharing","Custom Branding","Multi-brand","Partner Reports"],        features_ar:["\u0628\u064a\u0626\u0629 \u0639\u0645\u0644 \u0645\u0639\u0632\u0648\u0644\u0629","\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0641\u0631\u064a\u0642","\u062a\u0634\u0627\u0631\u0643 \u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a","\u0639\u0644\u0627\u0645\u0629 \u062a\u062c\u0627\u0631\u064a\u0629 \u0645\u062e\u0635\u0635\u0629","\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062a","\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631"] },
  { id:"d11", type:"digital",  category:"Platform",         category_ar:"\u0627\u0644\u0645\u0646\u0635\u0629",    sub_category:"Branding",  sub_category_ar:"\u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u0628\u064a\u0636\u0627\u0621",   name:"White Label Platform",              name_ar:"\u0645\u0646\u0635\u0629 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u0628\u064a\u0636\u0627\u0621",   description:"Your own branded SaaS with custom domain and colors.",              description_ar:"\u0645\u0646\u0635\u0629 SaaS \u0628\u0639\u0644\u0627\u0645\u062a\u0643 \u0645\u0639 \u062f\u0648\u0645\u064a\u0646 \u0645\u062e\u0635\u0635.",  price_cents:149900, pricing_model:"annual",    icon:"\uD83C\uDFA8", color:"#a855f7", rating:4.9, reviews_count:22,  is_featured:true, features:["Custom Domain","Full Branding","Logo & Colors","Email Branding","Custom Login","White Label Reports"],            features_ar:["\u062f\u0648\u0645\u064a\u0646 \u0645\u062e\u0635\u0635","\u0639\u0644\u0627\u0645\u0629 \u062a\u062c\u0627\u0631\u064a\u0629 \u0643\u0627\u0645\u0644\u0629","\u0634\u0639\u0627\u0631 \u0648\u0623\u0644\u0648\u0627\u0646","\u0628\u0631\u064a\u062f \u0630\u0648 \u0639\u0644\u0627\u0645\u0629","\u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644 \u0645\u062e\u0635\u0635","\u062a\u0642\u0627\u0631\u064a\u0631 \u0628\u0639\u0644\u0627\u0645\u062a\u0643"] },
  // DIGITAL - Tech
  { id:"d6",  type:"digital",  category:"Tech",             category_ar:"\u062a\u0642\u0646\u064a\u0629",    sub_category:"API",       sub_category_ar:"API \u0648\u0645\u0637\u0648\u0631\u064a\u0646",   name:"API Access Token - Unlimited",      name_ar:"\u0631\u0645\u0632 \u0648\u0635\u0648\u0644 API \u2014 \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f",   description:"Unlimited REST API, webhooks, sandbox & developer portal.",         description_ar:"REST API \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f\u060c Webhooks\u060c Sandbox.",  price_cents:9900,   pricing_model:"annual",    icon:"\uD83D\uDD11", color:"#3b82f6", rating:4.4, reviews_count:38,  is_new:true,  features:["Unlimited API Calls","Webhooks","Sandbox Environment","Developer Portal","SDK Libraries","No Rate Limit"],        features_ar:["\u0637\u0644\u0628\u0627\u062a API \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f\u0629","Webhooks","\u0628\u064a\u0626\u0629 Sandbox","\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0645\u0637\u0648\u0631\u064a\u0646","\u0645\u0643\u062a\u0628\u0627\u062a SDK","\u0628\u062f\u0648\u0646 \u062d\u062f"] },
  { id:"d7",  type:"digital",  category:"Tech",             category_ar:"\u062a\u0642\u0646\u064a\u0629",    sub_category:"Security",  sub_category_ar:"\u0623\u0645\u0627\u0646 \u0648\u0627\u0645\u062a\u062b\u0627\u0644",   name:"Security & Compliance Pack",        name_ar:"\u062d\u0632\u0645\u0629 \u0627\u0644\u0623\u0645\u0627\u0646 \u0648\u0627\u0644\u0627\u0645\u062a\u062b\u0627\u0644",   description:"RLS, audit logs, IP whitelist, SSO + 2FA.",                         description_ar:"RLS\u060c \u0633\u062c\u0644\u0627\u062a \u062a\u062f\u0642\u064a\u0642\u060c \u0642\u0627\u0626\u0645\u0629 IP\u060c SSO + 2FA.",  price_cents:24900,  pricing_model:"annual",    icon:"\uD83D\uDEE1\uFE0F", color:"#ef4444", rating:4.8, reviews_count:41,  features:["Row Level Security","Audit Logs","IP Whitelisting","SSO Integration","2FA Enforcement","Compliance Reports"],      features_ar:["\u0623\u0645\u0627\u0646 RLS","\u0633\u062c\u0644\u0627\u062a \u0627\u0644\u062a\u062f\u0642\u064a\u0642","\u0642\u0627\u0626\u0645\u0629 IP \u0627\u0644\u0628\u064a\u0636\u0627\u0621","\u062a\u0643\u0627\u0645\u0644 SSO","\u0641\u0631\u0636 2FA","\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0627\u0645\u062a\u062b\u0627\u0644"] },
  // PHYSICAL
  { id:"ph1", type:"physical", category:"Electronics",      category_ar:"\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u062a",    sub_category:"Tablets",   sub_category_ar:"\u0623\u062c\u0647\u0632\u0629 \u0644\u0648\u062d\u064a\u0629",   name:"Smart Tablet 10.5 Pro",             name_ar:"\u062a\u0627\u0628\u0644\u062a \u0630\u0643\u064a 10.5 \u0628\u0648\u0635\u0629 Pro",   description:"Octa-core, 6GB RAM, 128GB storage, stylus pen.",                   description_ar:"\u062b\u0645\u0627\u0646\u064a \u0627\u0644\u0646\u0648\u0627\u0629\u060c 6 \u062c\u064a\u062c\u0627\u060c 128 \u062c\u064a\u062c\u0627\u060c \u0642\u0644\u0645.",  price_cents:29900,  pricing_model:"one_time",  icon:"\uD83D\uDCF1", color:"#3b82f6", rating:4.7, reviews_count:156, is_featured:true, features:["Octa-core Chip","6 GB RAM","128 GB Storage","Stylus Pen","10.5 Inch Screen","Fast Charge"],                       features_ar:["\u0634\u0631\u064a\u062d\u0629 \u062b\u0645\u0627\u0646\u064a \u0627\u0644\u0646\u0648\u0627\u0629","6 \u062c\u064a\u062c\u0627 RAM","128 \u062c\u064a\u062c\u0627 \u062a\u062e\u0632\u064a\u0646","\u0642\u0644\u0645 \u062a\u062d\u0631\u064a\u0631\u064a","\u0634\u0627\u0634\u0629 10.5 \u0628\u0648\u0635\u0629","\u0634\u062d\u0646 \u0633\u0631\u064a\u0639"] },
  { id:"ph2", type:"physical", category:"Electronics",      category_ar:"\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u062a",    sub_category:"Audio",     sub_category_ar:"\u0635\u0648\u062a\u064a\u0627\u062a",   name:"Wireless Noise-Cancel Headphones",  name_ar:"\u0633\u0645\u0627\u0639\u0627\u062a \u0644\u0627\u0633\u0644\u0643\u064a\u0629 \u0639\u0627\u0632\u0644\u0629 \u0644\u0644\u0636\u0648\u0636\u0627\u0621",   description:"40-hour battery, ANC, premium audio, USB-C.",                      description_ar:"\u0628\u0637\u0627\u0631\u064a\u0629 40 \u0633\u0627\u0639\u0629\u060c \u0625\u0644\u063a\u0627\u0621 \u0636\u0648\u0636\u0627\u0621\u060c \u062c\u0648\u062f\u0629 \u0645\u0645\u062a\u0627\u0632\u0629.",  price_cents:8900,   pricing_model:"one_time",  icon:"\uD83C\uDFA7", color:"#8b5cf6", rating:4.6, reviews_count:89,  features:["40-Hour Battery","Active Noise Cancel","Premium Audio","USB-C Charging","Multi-device Pair","Foldable"],          features_ar:["\u0628\u0637\u0627\u0631\u064a\u0629 40 \u0633\u0627\u0639\u0629","\u0625\u0644\u063a\u0627\u0621 \u0636\u0648\u0636\u0627\u0621 \u0646\u0634\u0637","\u0635\u0648\u062a \u0645\u0645\u062a\u0627\u0632","\u0634\u062d\u0646 USB-C","\u0631\u0628\u0637 \u0645\u062a\u0639\u062f\u062f","\u062a\u0635\u0645\u064a\u0645 \u0642\u0627\u0628\u0644 \u0644\u0644\u0637\u064a"] },
  { id:"ph4", type:"physical", category:"Electronics",      category_ar:"\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u062a",    sub_category:"Peripherals",sub_category_ar:"\u0645\u0644\u062d\u0642\u0627\u062a",  name:"Wireless Keyboard & Mouse Set",     name_ar:"\u0644\u0648\u062d\u0629 \u0645\u0641\u0627\u062a\u064a\u062d \u0648\u0641\u0623\u0631\u0629 \u0644\u0627\u0633\u0644\u0643\u064a\u0629",   description:"Multi-device, backlit keys, silent clicks.",                        description_ar:"\u0631\u0628\u0637 \u0645\u062a\u0639\u062f\u062f\u060c \u0645\u0641\u0627\u062a\u064a\u062d \u0645\u0636\u064a\u0626\u0629\u060c \u0646\u0642\u0631 \u0635\u0627\u0645\u062a.",  price_cents:4900,   pricing_model:"one_time",  icon:"\u2328\uFE0F", color:"#06b6d4", rating:4.5, reviews_count:312, is_new:true,  features:["Multi-device Pair","Backlit Keys","Silent Clicks","Bluetooth","18-Month Battery","USB Receiver"],                features_ar:["\u0631\u0628\u0637 \u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0623\u062c\u0647\u0632\u0629","\u0645\u0641\u0627\u062a\u064a\u062d \u0645\u0636\u064a\u0626\u0629","\u0646\u0642\u0631 \u0635\u0627\u0645\u062a","\u0628\u0644\u0648\u062a\u0648\u062b","\u0628\u0637\u0627\u0631\u064a\u0629 18 \u0634\u0647\u0631","\u0645\u0633\u062a\u0642\u0628\u0644 USB"] },
  { id:"ph3", type:"physical", category:"Furniture",        category_ar:"\u0623\u062b\u0627\u062b",          sub_category:"Chairs",    sub_category_ar:"\u0643\u0631\u0627\u0633\u064a",   name:"Ergonomic Office Chair",            name_ar:"\u0643\u0631\u0633\u064a \u0645\u0643\u062a\u0628\u064a \u0645\u0631\u064a\u062d",   description:"Lumbar support, adjustable, breathable mesh, 5yr warranty.",        description_ar:"\u062f\u0639\u0645 \u0642\u0637\u0646\u064a\u060c \u0627\u0631\u062a\u0641\u0627\u0639 \u0642\u0627\u0628\u0644 \u0644\u0644\u062a\u0639\u062f\u064a\u0644\u060c \u0634\u0628\u0643\u0629 \u062a\u0646\u0641\u0633.",  price_cents:19900,  pricing_model:"one_time",  icon:"\uD83E\uDE91", color:"#f59e0b", rating:4.8, reviews_count:203, features:["Lumbar Support","Height Adjustable","Breathable Mesh","Armrests","5-Year Warranty","BIFMA Certified"],              features_ar:["\u062f\u0639\u0645 \u0642\u0637\u0646\u064a","\u0627\u0631\u062a\u0641\u0627\u0639 \u0642\u0627\u0628\u0644 \u0644\u0644\u062a\u0639\u062f\u064a\u0644","\u0634\u0628\u0643\u0629 \u062a\u0646\u0641\u0633","\u0645\u0633\u0646\u062f\u0627 \u0627\u0644\u0630\u0631\u0627\u0639\u064a\u0646","\u0636\u0645\u0627\u0646 5 \u0633\u0646\u0648\u0627\u062a","\u0634\u0647\u0627\u062f\u0629 BIFMA"] },
  { id:"ph5", type:"physical", category:"Merchandise",      category_ar:"\u0645\u0633\u062a\u0644\u0632\u0645\u0627\u062a \u062a\u0631\u0648\u064a\u062c\u064a\u0629",  sub_category:"Bundles",   sub_category_ar:"\u062d\u0632\u0645",   name:"Branded Merchandise Bundle",        name_ar:"\u062d\u0632\u0645\u0629 \u0627\u0644\u0645\u0633\u062a\u0644\u0632\u0645\u0627\u062a \u0627\u0644\u062a\u0631\u0648\u064a\u062c\u064a\u0629",   description:"50 T-shirts, 50 caps, 100 pens + 2 banners.",                      description_ar:"50 \u062a\u064a\u0634\u064a\u0631\u062a + 50 \u0642\u0628\u0639\u0629 + 100 \u0642\u0644\u0645 + 2 \u0644\u0627\u0641\u062a\u0629.",  price_cents:12900,  pricing_model:"one_time",  icon:"\uD83D\uDC55", color:"#10b981", rating:4.7, reviews_count:44,  is_featured:true, features:["50 Custom T-shirts","50 Caps","100 Branded Pens","2 Roll-up Banners","Brand Colors","Fast Delivery"],             features_ar:["50 \u062a\u064a\u0634\u064a\u0631\u062a \u0645\u062e\u0635\u0635","50 \u0642\u0628\u0639\u0629","100 \u0642\u0644\u0645 \u0628\u0639\u0644\u0627\u0645\u062a\u0643","2 \u0644\u0627\u0641\u062a\u0629 \u0631\u0648\u0644 \u0622\u0628","\u0623\u0644\u0648\u0627\u0646 \u0627\u0644\u0639\u0644\u0627\u0645\u0629","\u062a\u0648\u0635\u064a\u0644 \u0633\u0631\u064a\u0639"] },
  { id:"ph6", type:"physical", category:"Equipment",        category_ar:"\u0645\u0639\u062f\u0627\u062a",    sub_category:"POS",       sub_category_ar:"\u0646\u0642\u0627\u0637 \u0627\u0644\u0628\u064a\u0639",   name:"Barcode Label Printer",             name_ar:"\u0637\u0627\u0628\u0639\u0629 \u0645\u0644\u0635\u0642\u0627\u062a \u0628\u0627\u0631\u0643\u0648\u062f \u0635\u0646\u0627\u0639\u064a\u0629",   description:"300 DPI, 150mm/s, USB+Ethernet, ERP-compatible.",                  description_ar:"300 DPI\u060c \u0633\u0631\u0639\u0629 150mm/\u062b\u060c \u0645\u062a\u0648\u0627\u0641\u0642 \u0645\u0639 ERP.",  price_cents:14900,  pricing_model:"one_time",  icon:"\uD83D\uDDA8\uFE0F", color:"#64748b", rating:4.6, reviews_count:65,  features:["300 DPI Resolution","150 mm/s Speed","USB + Ethernet","ERP Compatible","Auto-cutter","1-Year Warranty"],          features_ar:["\u062f\u0642\u0629 300 DPI","\u0633\u0631\u0639\u0629 150mm/\u062b","USB \u0648Ethernet","\u0645\u062a\u0648\u0627\u0641\u0642 \u0645\u0639 ERP","\u0642\u0627\u0637\u0639 \u062a\u0644\u0642\u0627\u0626\u064a","\u0636\u0645\u0627\u0646 \u0633\u0646\u0629"] },
  { id:"ph7", type:"physical", category:"Security Hardware",category_ar:"\u0623\u062c\u0647\u0632\u0629 \u0623\u0645\u0627\u0646",  sub_category:"Cameras",   sub_category_ar:"\u0643\u0627\u0645\u064a\u0631\u0627\u062a",   name:"Security Camera Kit (4 Cams)",      name_ar:"\u0637\u0642\u0645 \u0643\u0627\u0645\u064a\u0631\u0627\u062a \u0645\u0631\u0627\u0642\u0628\u0629 (4 \u0643\u0627\u0645\u064a\u0631\u0627\u062a)",   description:"4MP IP, night vision, motion detection, PoE, 2TB HDD.",             description_ar:"4 \u0645\u064a\u062c\u0627\u0628\u0643\u0633\u0644\u060c \u0631\u0624\u064a\u0629 \u0644\u064a\u0644\u064a\u0629\u060c \u0643\u0634\u0641 \u062d\u0631\u0643\u0629\u060c 2 \u062a\u064a\u0631\u0627\u0628\u0627\u064a\u062a.",  price_cents:15900,  pricing_model:"one_time",  icon:"\uD83D\uDCF7", color:"#374151", rating:4.8, reviews_count:112, is_new:true,  features:["4MP Resolution","Night Vision","Motion Detection","PoE Powered","2TB HDD Included","Remote Viewing"],             features_ar:["\u062f\u0642\u0629 4 \u0645\u064a\u062c\u0627\u0628\u0643\u0633\u0644","\u0631\u0624\u064a\u0629 \u0644\u064a\u0644\u064a\u0629","\u0643\u0634\u0641 \u0627\u0644\u062d\u0631\u0643\u0629","\u064a\u0639\u0645\u0644 \u0628\u0640 PoE","2 \u062a\u064a\u0631\u0627\u0628\u0627\u064a\u062a \u0645\u0636\u0645\u0646\u0629","\u0645\u0634\u0627\u0647\u062f\u0629 \u0639\u0646 \u0628\u0639\u062f"] },
  // VIRTUAL
  { id:"v1",  type:"virtual",  category:"NFT",              category_ar:"NFT",           sub_category:"Founder",   sub_category_ar:"\u0645\u0624\u0633\u0633\u0648\u0646",   name:"KemetRise Founder Pass (NFT)",      name_ar:"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0645\u0624\u0633\u0633 \u0643\u064a\u0645\u062a \u0631\u0627\u064a\u0632 (NFT)",   description:"Lifetime priority access, governance voting, profit sharing.",      description_ar:"\u0648\u0635\u0648\u0644 \u0623\u0648\u0644\u0648\u064a\u0629 \u0645\u062f\u0649 \u0627\u0644\u062d\u064a\u0627\u0629\u060c \u062a\u0635\u0648\u064a\u062a\u060c \u0645\u0634\u0627\u0631\u0643\u0629 \u0623\u0631\u0628\u0627\u062d.",  price_cents:49900,  pricing_model:"one_time",  icon:"\uD83C\uDFDB\uFE0F", color:"#d97706", rating:4.9, reviews_count:37,  is_featured:true, features:["Lifetime Access","Governance Voting","Profit Sharing","Exclusive Events","Early Features","NFT Certificate"],     features_ar:["\u0648\u0635\u0648\u0644 \u0645\u062f\u0649 \u0627\u0644\u062d\u064a\u0627\u0629","\u062a\u0635\u0648\u064a\u062a \u0627\u0644\u062d\u0648\u0643\u0645\u0629","\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0623\u0631\u0628\u0627\u062d","\u0641\u0639\u0627\u0644\u064a\u0627\u062a \u062d\u0635\u0631\u064a\u0629","\u0645\u064a\u0632\u0627\u062a \u0645\u0628\u0643\u0631\u0629","\u0634\u0647\u0627\u062f\u0629 NFT"] },
  { id:"v2",  type:"virtual",  category:"Gift Card",        category_ar:"\u0628\u0637\u0627\u0642\u0629 \u0647\u062f\u064a\u0629",    sub_category:"$50",       sub_category_ar:"50 \u062f\u0648\u0644\u0627\u0631",   name:"Gift Card - $50",                   name_ar:"\u0628\u0637\u0627\u0642\u0629 \u0647\u062f\u064a\u0629 \u2014 50 \u062f\u0648\u0644\u0627\u0631",   description:"Redeemable on any product, service, or subscription.",              description_ar:"\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f \u0639\u0644\u0649 \u0623\u064a \u0645\u0646\u062a\u062c \u0623\u0648 \u062e\u062f\u0645\u0629.",  price_cents:5000,   pricing_model:"one_time",  icon:"\uD83C\uDF81", color:"#f43f5e", rating:4.8, reviews_count:290, is_new:true,  features:["$50 Value","Valid 2 Years","All Products","Instant Delivery","Transferable","No Expiry Fees"],                    features_ar:["\u0642\u064a\u0645\u0629 50 \u062f\u0648\u0644\u0627\u0631","\u0635\u0627\u0644\u062d\u0629 \u0633\u0646\u062a\u064a\u0646","\u0643\u0644 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a","\u062a\u0648\u0635\u064a\u0644 \u0641\u0648\u0631\u064a","\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062a\u062d\u0648\u064a\u0644","\u0628\u062f\u0648\u0646 \u0631\u0633\u0648\u0645 \u0627\u0646\u062a\u0647\u0627\u0621"] },
  { id:"v3",  type:"virtual",  category:"Gift Card",        category_ar:"\u0628\u0637\u0627\u0642\u0629 \u0647\u062f\u064a\u0629",    sub_category:"$100",      sub_category_ar:"100 \u062f\u0648\u0644\u0627\u0631",  name:"Gift Card - $100",                  name_ar:"\u0628\u0637\u0627\u0642\u0629 \u0647\u062f\u064a\u0629 \u2014 100 \u062f\u0648\u0644\u0627\u0631",  description:"Redeemable on any product or service.",                             description_ar:"\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f \u0639\u0644\u0649 \u0623\u064a \u0645\u0646\u062a\u062c \u0623\u0648 \u062e\u062f\u0645\u0629.",  price_cents:10000,  pricing_model:"one_time",  icon:"\uD83C\uDF81", color:"#ef4444", rating:4.8, reviews_count:145, features:["$100 Value","Valid 2 Years","All Products","Instant Delivery","Transferable","Priority Support"],                 features_ar:["\u0642\u064a\u0645\u0629 100 \u062f\u0648\u0644\u0627\u0631","\u0635\u0627\u0644\u062d\u0629 \u0633\u0646\u062a\u064a\u0646","\u0643\u0644 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a","\u062a\u0648\u0635\u064a\u0644 \u0641\u0648\u0631\u064a","\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062a\u062d\u0648\u064a\u0644","\u062f\u0639\u0645 \u0623\u0648\u0644\u0648\u064a\u0629"] },
  { id:"v4",  type:"virtual",  category:"License Key",      category_ar:"\u0645\u0641\u062a\u0627\u062d \u062a\u0631\u062e\u064a\u0635",  sub_category:"Enterprise",sub_category_ar:"\u0645\u0624\u0633\u0633\u064a",   name:"Enterprise License Key (1 Year)",   name_ar:"\u0645\u0641\u062a\u0627\u062d \u062a\u0631\u062e\u064a\u0635 \u0645\u0624\u0633\u0633\u064a (\u0633\u0646\u0629)",   description:"Activate any enterprise module for 12 months.",                    description_ar:"\u062a\u0641\u0639\u064a\u0644 \u0623\u064a \u0648\u062d\u062f\u0629 \u0645\u0624\u0633\u0633\u064a\u0629 \u0644\u0645\u062f\u0629 12 \u0634\u0647\u0631\u0627\u064b.",  price_cents:19900,  pricing_model:"annual",    icon:"\uD83D\uDD11", color:"#3b82f6", rating:4.7, reviews_count:88,  features:["12-Month Access","Any Module","Instant Activation","Transfer Once","API Enabled","Email Delivery"],               features_ar:["\u0648\u0635\u0648\u0644 12 \u0634\u0647\u0631","\u0623\u064a \u0648\u062d\u062f\u0629","\u062a\u0641\u0639\u064a\u0644 \u0641\u0648\u0631\u064a","\u062a\u062d\u0648\u064a\u0644 \u0645\u0631\u0629","API \u0645\u0641\u0639\u064f\u0651\u0644","\u062a\u0648\u0635\u064a\u0644 \u0628\u0627\u0644\u0628\u0631\u064a\u062f"] },
  { id:"v5",  type:"virtual",  category:"Digital Art",      category_ar:"\u0641\u0646 \u0631\u0642\u0645\u064a",    sub_category:"Collection",sub_category_ar:"\u0645\u062c\u0645\u0648\u0639\u0629",   name:"Digital Art Collection (10 Pieces)",name_ar:"\u0645\u062c\u0645\u0648\u0639\u0629 \u0641\u0646\u0648\u0646 \u0631\u0642\u0645\u064a\u0629 (10 \u0642\u0637\u0639)",   description:"Exclusive Egyptian-themed digital artworks.",                       description_ar:"\u0623\u0639\u0645\u0627\u0644 \u0641\u0646\u064a\u0629 \u0631\u0642\u0645\u064a\u0629 \u0645\u0635\u0631\u064a\u0629 \u062d\u0635\u0631\u064a\u0629.",  price_cents:14900,  pricing_model:"one_time",  icon:"\uD83C\uDFA8", color:"#8b5cf6", rating:4.6, reviews_count:43,  is_new:true,  features:["10 Original Artworks","High-res Files","Print License","Egyptian Theme","Artist Signed","Certificate"],          features_ar:["10 \u0623\u0639\u0645\u0627\u0644 \u0623\u0635\u0644\u064a\u0629","\u0645\u0644\u0641\u0627\u062a \u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u062f\u0642\u0629","\u0631\u062e\u0635\u0629 \u0637\u0628\u0627\u0639\u0629","\u0645\u0648\u0636\u0648\u0639 \u0645\u0635\u0631\u064a","\u062a\u0648\u0642\u064a\u0639 \u0627\u0644\u0641\u0646\u0627\u0646","\u0634\u0647\u0627\u062f\u0629 \u0623\u0635\u0627\u0644\u0629"] },
  { id:"v6",  type:"virtual",  category:"Virtual Real Estate",category_ar:"\u0639\u0642\u0627\u0631\u0627\u062a \u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629",  sub_category:"Platform Slot",sub_category_ar:"\u0645\u0648\u0642\u0639 \u0627\u0644\u0645\u0646\u0635\u0629",  name:"Virtual Real Estate - Platform Slot",name_ar:"\u0639\u0642\u0627\u0631 \u0627\u0641\u062a\u0631\u0627\u0636\u064a \u2014 \u0645\u0648\u0642\u0639 \u0641\u064a \u0627\u0644\u0645\u0646\u0635\u0629",   description:"Own a prime slot in the KemetRise marketplace.",                    description_ar:"\u0627\u0645\u062a\u0644\u0643 \u0645\u0648\u0642\u0639\u0627\u064b \u0631\u0626\u064a\u0633\u064a\u0627\u064b \u0641\u064a \u0633\u0648\u0642 \u0643\u064a\u0645\u062a \u0631\u0627\u064a\u0632.",  price_cents:29900,  pricing_model:"annual",    icon:"\uD83C\uDFD9\uFE0F", color:"#10b981", rating:4.8, reviews_count:19,  is_featured:true, features:["Prime Location","1-Year Slot","High Visibility","Featured Badge","Analytics Access","Renewable"],                 features_ar:["\u0645\u0648\u0642\u0639 \u0631\u0626\u064a\u0633\u064a","\u0645\u0643\u0627\u0646 \u0644\u0645\u062f\u0629 \u0633\u0646\u0629","\u0638\u0647\u0648\u0631 \u0645\u0631\u062a\u0641\u0639","\u0634\u0627\u0631\u0629 \u0645\u0645\u064a\u0632\u0629","\u0648\u0635\u0648\u0644 \u0627\u0644\u062a\u062d\u0644\u064a\u0644\u0627\u062a","\u0642\u0627\u0628\u0644 \u0644\u0644\u062a\u062c\u062f\u064a\u062f"] },
  // SERVICES
  { id:"s1",  type:"service",  category:"Technology",       category_ar:"\u062a\u0642\u0646\u064a\u0629",    sub_category:"ERP Systems",sub_category_ar:"\u0623\u0646\u0638\u0645\u0629 ERP",   name:"ERP Implementation",                name_ar:"\u062a\u0637\u0628\u064a\u0642 \u0646\u0638\u0627\u0645 ERP",   description:"Full ERP setup, customization, training and go-live support.",      description_ar:"\u062a\u0637\u0628\u064a\u0642 ERP \u0643\u0627\u0645\u0644\u060c \u062a\u062e\u0635\u064a\u0635\u060c \u062a\u062f\u0631\u064a\u0628 \u0648\u062f\u0639\u0645 \u0627\u0644\u0625\u0637\u0644\u0627\u0642.",  icon:"\u26A1", color:"#f59e0b", rating:4.9, reviews_count:64,  features:["Needs Analysis","System Config","Data Migration","Staff Training","Go-live Support","3-Month Post Support"],     features_ar:["\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u062c\u0627\u062a","\u0636\u0628\u0637 \u0627\u0644\u0646\u0638\u0627\u0645","\u062a\u0631\u062d\u064a\u0644 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a","\u062a\u062f\u0631\u064a\u0628 \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646","\u062f\u0639\u0645 \u0627\u0644\u0625\u0637\u0644\u0627\u0642","\u062f\u0639\u0645 3 \u0623\u0634\u0647\u0631 \u0628\u0639\u062f"] },
  { id:"s2",  type:"service",  category:"Technology",       category_ar:"\u062a\u0642\u0646\u064a\u0629",    sub_category:"Software Dev",sub_category_ar:"\u062a\u0637\u0648\u064a\u0631 \u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a",  name:"Mobile App Development",            name_ar:"\u062a\u0637\u0648\u064a\u0631 \u062a\u0637\u0628\u064a\u0642 \u0645\u0648\u0628\u0627\u064a\u0644",   description:"iOS & Android custom apps tailored to your brand.",                 description_ar:"\u062a\u0637\u0628\u064a\u0642\u0627\u062a iOS \u0648Android \u0645\u062e\u0635\u0635\u0629 \u0644\u0639\u0644\u0627\u0645\u062a\u0643.",  icon:"\uD83D\uDCF1", color:"#8b5cf6", rating:4.8, reviews_count:55,  features:["iOS + Android","Custom UI/UX","Backend API","Push Notifications","App Store Publish","3-Month Support"],          features_ar:["iOS \u0648Android","\u0648\u0627\u062c\u0647\u0629 \u0645\u062e\u0635\u0635\u0629","Backend API","\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a","\u0646\u0634\u0631 \u0641\u064a \u0627\u0644\u0645\u062a\u0627\u062c\u0631","\u062f\u0639\u0645 3 \u0623\u0634\u0647\u0631"] },
  { id:"s3",  type:"service",  category:"Technology",       category_ar:"\u062a\u0642\u0646\u064a\u0629",    sub_category:"Software Dev",sub_category_ar:"\u062a\u0637\u0648\u064a\u0631 \u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a",  name:"Web & PWA Development",             name_ar:"\u062a\u0637\u0648\u064a\u0631 \u0645\u0648\u0627\u0642\u0639 \u0648\u062a\u0637\u0628\u064a\u0642\u0627\u062a PWA",   description:"Fast, SEO-ready websites and progressive web apps.",                description_ar:"\u0645\u0648\u0627\u0642\u0639 \u0633\u0631\u064a\u0639\u0629 \u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0640 SEO \u0648\u062a\u0637\u0628\u064a\u0642\u0627\u062a PWA.",  icon:"\uD83C\uDF10", color:"#06b6d4", rating:4.7, reviews_count:78,  features:["Custom Design","SEO Optimized","PWA Ready","CMS Integration","Multi-language","Performance 95+"],                features_ar:["\u062a\u0635\u0645\u064a\u0645 \u0645\u062e\u0635\u0635","\u0645\u062d\u0633\u0646 \u0644\u0644\u0640 SEO","\u062c\u0627\u0647\u0632 \u0643\u0640 PWA","\u062a\u0643\u0627\u0645\u0644 CMS","\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0644\u063a\u0627\u062a","\u0623\u062f\u0627\u0621 95+"] },
  { id:"s4",  type:"service",  category:"Technology",       category_ar:"\u062a\u0642\u0646\u064a\u0629",    sub_category:"AI Services",sub_category_ar:"\u062e\u062f\u0645\u0627\u062a AI",  name:"AI Chatbot & Agent Setup",          name_ar:"\u0625\u0639\u062f\u0627\u062f \u0631\u0648\u0628\u0648\u062a \u0645\u062d\u0627\u062f\u062b\u0629 AI",   description:"Custom AI chatbot trained on your data and products.",              description_ar:"\u0648\u0643\u064a\u0644 AI \u0645\u062f\u0631\u0628 \u0639\u0644\u0649 \u0628\u064a\u0627\u0646\u0627\u062a\u0643 \u0648\u0645\u0646\u062a\u062c\u0627\u062a\u0643.",  icon:"\uD83E\uDD16", color:"#06b6d4", rating:4.8, reviews_count:43,  is_new:true,  features:["Custom Training","Arabic + English","WhatsApp Integration","Website Widget","Analytics","Monthly Updates"],       features_ar:["\u062a\u062f\u0631\u064a\u0628 \u0645\u062e\u0635\u0635","\u0639\u0631\u0628\u064a \u0648\u0625\u0646\u062c\u0644\u064a\u0632\u064a","\u062a\u0643\u0627\u0645\u0644 \u0648\u0627\u062a\u0633\u0627\u0628","\u0648\u062f\u062c\u062a \u0627\u0644\u0645\u0648\u0642\u0639","\u0627\u0644\u062a\u062d\u0644\u064a\u0644\u0627\u062a","\u062a\u062d\u062f\u064a\u062b\u0627\u062a \u0634\u0647\u0631\u064a\u0629"] },
  { id:"s5",  type:"service",  category:"Technology",       category_ar:"\u062a\u0642\u0646\u064a\u0629",    sub_category:"Networks",  sub_category_ar:"\u0627\u0644\u0634\u0628\u0643\u0627\u062a",   name:"Network Design & Installation",     name_ar:"\u062a\u0635\u0645\u064a\u0645 \u0648\u062a\u0631\u0643\u064a\u0628 \u0627\u0644\u0634\u0628\u0643\u0627\u062a",   description:"Professional wired & wireless network infrastructure.",             description_ar:"\u0628\u0646\u064a\u0629 \u062a\u062d\u062a\u064a\u0629 \u0633\u0644\u0643\u064a\u0629 \u0648\u0644\u0627\u0633\u0644\u0643\u064a\u0629 \u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629.",  icon:"\uD83C\uDF10", color:"#14b8a6", rating:4.7, reviews_count:39,  features:["Site Survey","Network Design","Equipment Supply","Installation","Configuration","Documentation"],                features_ar:["\u0645\u0633\u062d \u0627\u0644\u0645\u0648\u0642\u0639","\u062a\u0635\u0645\u064a\u0645 \u0627\u0644\u0634\u0628\u0643\u0629","\u062a\u0648\u0631\u064a\u062f \u0627\u0644\u0645\u0639\u062f\u0627\u062a","\u0627\u0644\u062a\u0631\u0643\u064a\u0628","\u0627\u0644\u0636\u0628\u0637","\u0627\u0644\u062a\u0648\u062b\u064a\u0642"] },
  { id:"s6",  type:"service",  category:"Technology",       category_ar:"\u062a\u0642\u0646\u064a\u0629",    sub_category:"Cybersecurity",sub_category_ar:"\u0623\u0645\u0627\u0646 \u0633\u064a\u0628\u0631\u0627\u0646\u064a",  name:"Cybersecurity Assessment",          name_ar:"\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0623\u0645\u0627\u0646 \u0627\u0644\u0633\u064a\u0628\u0631\u0627\u0646\u064a",   description:"Penetration testing, vulnerability assessment & remediation.",      description_ar:"\u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u062e\u062a\u0631\u0627\u0642\u060c \u062a\u0642\u064a\u064a\u0645 \u062b\u063a\u0631\u0627\u062a \u0648\u0645\u0639\u0627\u0644\u062c\u0629.",  icon:"\uD83D\uDEE1\uFE0F", color:"#ef4444", rating:4.9, reviews_count:28,  features:["Pen Testing","Vulnerability Scan","Risk Assessment","Remediation Plan","Compliance Check","Executive Report"],      features_ar:["\u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u062e\u062a\u0631\u0627\u0642","\u0645\u0633\u062d \u0627\u0644\u062b\u063a\u0631\u0627\u062a","\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0645\u062e\u0627\u0637\u0631","\u062e\u0637\u0629 \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629","\u0641\u062d\u0635 \u0627\u0644\u0627\u0645\u062a\u062b\u0627\u0644","\u062a\u0642\u0631\u064a\u0631 \u062a\u0646\u0641\u064a\u0630\u064a"] },
  { id:"s7",  type:"service",  category:"Marketing",        category_ar:"\u062a\u0633\u0648\u064a\u0642",    sub_category:"Digital Ads",sub_category_ar:"\u0625\u0639\u0644\u0627\u0646\u0627\u062a \u0631\u0642\u0645\u064a\u0629",  name:"Digital Advertising Campaigns",     name_ar:"\u0627\u0644\u062d\u0645\u0644\u0627\u062a \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u064a\u0629 \u0627\u0644\u0631\u0642\u0645\u064a\u0629",   description:"Facebook, Google, TikTok & Instagram ads management.",              description_ar:"\u0625\u062f\u0627\u0631\u0629 \u0625\u0639\u0644\u0627\u0646\u0627\u062a \u0641\u064a\u0633\u0628\u0648\u0643\u060c \u062c\u0648\u062c\u0644\u060c \u062a\u064a\u0643 \u062a\u0648\u0643 \u0648\u0625\u0646\u0633\u062a\u0642\u0631\u0627\u0645.",  icon:"\uD83D\uDCE3", color:"#ec4899", rating:4.7, reviews_count:92,  is_featured:true, features:["Multi-Platform Ads","Audience Targeting","Creative Design","A/B Testing","ROI Reporting","Monthly Optimization"],  features_ar:["\u0625\u0639\u0644\u0627\u0646\u0627\u062a \u0645\u062a\u0639\u062f\u062f\u0629 \u0627\u0644\u0645\u0646\u0635\u0627\u062a","\u0627\u0633\u062a\u0647\u062f\u0627\u0641 \u0627\u0644\u062c\u0645\u0647\u0648\u0631","\u062a\u0635\u0645\u064a\u0645 \u0625\u0628\u062f\u0627\u0639\u064a","\u0627\u062e\u062a\u0628\u0627\u0631 A/B","\u062a\u0642\u0627\u0631\u064a\u0631 ROI","\u062a\u062d\u0633\u064a\u0646 \u0634\u0647\u0631\u064a"] },
  { id:"s8",  type:"service",  category:"Marketing",        category_ar:"\u062a\u0633\u0648\u064a\u0642",    sub_category:"Content",   sub_category_ar:"\u0625\u0646\u062a\u0627\u062c \u0645\u062d\u062a\u0648\u0649",   name:"Social Media Content Production",   name_ar:"\u0625\u0646\u062a\u0627\u062c \u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0633\u0648\u0634\u064a\u0627\u0644 \u0645\u064a\u062f\u064a\u0627",   description:"30 posts/month: photography, copywriting & scheduling.",            description_ar:"30 \u0645\u0646\u0634\u0648\u0631 \u0634\u0647\u0631\u064a\u0627\u064b: \u062a\u0635\u0648\u064a\u0631\u060c \u0643\u062a\u0627\u0628\u0629 \u0648\u062c\u062f\u0648\u0644\u0629.",  icon:"\uD83D\uDCF8", color:"#f43f5e", rating:4.6, reviews_count:67,  features:["30 Posts/Month","Professional Photos","Copywriting","Hashtag Strategy","Scheduling","Performance Report"],        features_ar:["30 \u0645\u0646\u0634\u0648\u0631 \u0634\u0647\u0631\u064a\u0627\u064b","\u062a\u0635\u0648\u064a\u0631 \u0627\u062d\u062a\u0631\u0627\u0641\u064a","\u0643\u062a\u0627\u0628\u0629 \u0627\u0644\u0645\u062d\u062a\u0648\u0649","\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629 \u0627\u0644\u0647\u0627\u0634\u062a\u0627\u062c","\u0627\u0644\u062c\u062f\u0648\u0644\u0629","\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0623\u062f\u0627\u0621"] },
  { id:"s9",  type:"service",  category:"Marketing",        category_ar:"\u062a\u0633\u0648\u064a\u0642",    sub_category:"SEO",       sub_category_ar:"\u062a\u062d\u0633\u064a\u0646 \u0645\u062d\u0631\u0643\u0627\u062a \u0627\u0644\u0628\u062d\u062b",   name:"SEO & Search Optimization",         name_ar:"\u062a\u062d\u0633\u064a\u0646 \u0645\u062d\u0631\u0643\u0627\u062a \u0627\u0644\u0628\u062d\u062b SEO",   description:"On-page & off-page SEO + content strategy.",                        description_ar:"SEO \u062f\u0627\u062e\u0644\u064a \u0648\u062e\u0627\u0631\u062c\u064a + \u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629 \u0645\u062d\u062a\u0648\u0649.",  icon:"\uD83D\uDD0D", color:"#3b82f6", rating:4.8, reviews_count:51,  features:["Technical SEO Audit","Keyword Research","On-page Optimization","Link Building","Local SEO","Monthly Reports"],   features_ar:["\u0645\u0631\u0627\u062c\u0639\u0629 SEO \u0627\u0644\u062a\u0642\u0646\u064a","\u0628\u062d\u062b \u0627\u0644\u0643\u0644\u0645\u0627\u062a \u0627\u0644\u0645\u0641\u062a\u0627\u062d\u064a\u0629","\u062a\u062d\u0633\u064a\u0646 \u062f\u0627\u062e\u0644\u064a","\u0628\u0646\u0627\u0621 \u0627\u0644\u0631\u0648\u0627\u0628\u0637","SEO \u0627\u0644\u0645\u062d\u0644\u064a","\u062a\u0642\u0627\u0631\u064a\u0631 \u0634\u0647\u0631\u064a\u0629"] },
  { id:"s10", type:"service",  category:"Business",         category_ar:"\u0623\u0639\u0645\u0627\u0644",    sub_category:"Trade Agency",sub_category_ar:"\u062a\u0648\u0643\u064a\u0644\u0627\u062a \u062a\u062c\u0627\u0631\u064a\u0629",  name:"Commercial Agency Representation",  name_ar:"\u0627\u0644\u062a\u0645\u062b\u064a\u0644 \u0627\u0644\u062a\u062c\u0627\u0631\u064a \u0648\u0627\u0644\u062a\u0648\u0643\u064a\u0644\u0627\u062a",   description:"Exclusive distribution & representation contracts in Egypt.",       description_ar:"\u0639\u0642\u0648\u062f \u062a\u0648\u0632\u064a\u0639 \u0648\u062a\u0645\u062b\u064a\u0644 \u062d\u0635\u0631\u064a\u0629 \u0641\u064a \u0645\u0635\u0631.",  icon:"\uD83E\uDD1D", color:"#10b981", rating:4.8, reviews_count:34,  is_featured:true, features:["Market Research","Legal Contracts","Distribution Network","Import Licensing","After-sale Support","Reports"],     features_ar:["\u0628\u062d\u062b \u0627\u0644\u0633\u0648\u0642","\u0627\u0644\u0639\u0642\u0648\u062f \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629","\u0634\u0628\u0643\u0629 \u0627\u0644\u062a\u0648\u0632\u064a\u0639","\u062a\u0631\u062e\u064a\u0635 \u0627\u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f","\u062f\u0639\u0645 \u0645\u0627 \u0628\u0639\u062f \u0627\u0644\u0628\u064a\u0639","\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631"] },
  { id:"s11", type:"service",  category:"Business",         category_ar:"\u0623\u0639\u0645\u0627\u0644",    sub_category:"Logistics", sub_category_ar:"\u0644\u0648\u062c\u0633\u062a\u064a\u0643",   name:"Import & Export Logistics",         name_ar:"\u0644\u0648\u062c\u0633\u062a\u064a\u0643 \u0627\u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0648\u0627\u0644\u062a\u0635\u062f\u064a\u0631",   description:"Full logistics: customs clearance, freight & last-mile.",           description_ar:"\u0644\u0648\u062c\u0633\u062a\u064a\u0643 \u0643\u0627\u0645\u0644: \u062a\u062e\u0644\u064a\u0635 \u062c\u0645\u0631\u0643\u064a\u060c \u0634\u062d\u0646 \u0648\u062a\u0648\u0635\u064a\u0644.",  icon:"\uD83D\uDEA2", color:"#0ea5e9", rating:4.7, reviews_count:48,  features:["Customs Clearance","Sea & Air Freight","Warehouse Storage","Last-mile Delivery","Documentation","Insurance"],       features_ar:["\u062a\u062e\u0644\u064a\u0635 \u062c\u0645\u0631\u0643\u064a","\u0634\u062d\u0646 \u0628\u062d\u0631\u064a \u0648\u062c\u0648\u064a","\u062a\u062e\u0632\u064a\u0646","\u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0627\u0644\u0623\u062e\u064a\u0631","\u0627\u0644\u0648\u062b\u0627\u0626\u0642","\u0627\u0644\u062a\u0623\u0645\u064a\u0646"] },
  { id:"s12", type:"service",  category:"Business",         category_ar:"\u0623\u0639\u0645\u0627\u0644",    sub_category:"Finance",   sub_category_ar:"\u062e\u062f\u0645\u0627\u062a \u0645\u0627\u0644\u064a\u0629",   name:"Financial Consulting & Reporting",  name_ar:"\u0627\u0644\u0627\u0633\u062a\u0634\u0627\u0631\u0627\u062a \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0645\u0627\u0644\u064a\u0629",   description:"Financial analysis, reports, tax & compliance advisory.",           description_ar:"\u062a\u062d\u0644\u064a\u0644 \u0645\u0627\u0644\u064a\u060c \u062a\u0642\u0627\u0631\u064a\u0631\u060c \u0636\u0631\u0627\u0626\u0628 \u0648\u0627\u0633\u062a\u0634\u0627\u0631\u0627\u062a.",  icon:"\uD83D\uDCCA", color:"#6366f1", rating:4.9, reviews_count:57,  features:["Financial Analysis","P&L Reporting","Tax Advisory","Budget Planning","Audit Prep","Cash Flow Mgmt"],               features_ar:["\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u0627\u0644\u064a","\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0631\u0628\u062d \u0648\u0627\u0644\u062e\u0633\u0627\u0631\u0629","\u0627\u0633\u062a\u0634\u0627\u0631\u0627\u062a \u0636\u0631\u064a\u0628\u064a\u0629","\u062a\u062e\u0637\u064a\u0637 \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629","\u0625\u0639\u062f\u0627\u062f \u0627\u0644\u062a\u062f\u0642\u064a\u0642","\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u062f\u0641\u0642"] },
  { id:"s13", type:"service",  category:"Media",            category_ar:"\u0625\u0646\u062a\u0627\u062c \u0625\u0639\u0644\u0627\u0645\u064a",    sub_category:"Video",     sub_category_ar:"\u0625\u0646\u062a\u0627\u062c \u0641\u064a\u062f\u064a\u0648",   name:"Video Production & TV Commercials", name_ar:"\u0625\u0646\u062a\u0627\u062c \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0648\u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0644\u0641\u0632\u064a\u0648\u0646\u064a\u0629",   description:"Professional video for ads, corporate & social.",                   description_ar:"\u0625\u0646\u062a\u0627\u062c \u0641\u064a\u062f\u064a\u0648 \u0627\u062d\u062a\u0631\u0627\u0641\u064a \u0644\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062a \u0648\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a.",  icon:"\uD83C\uDFAC", color:"#ec4899", rating:4.8, reviews_count:43,  features:["Script Writing","Professional Filming","Motion Graphics","Voice Over","Color Grading","4K Output"],                features_ar:["\u0643\u062a\u0627\u0628\u0629 \u0627\u0644\u0633\u064a\u0646\u0627\u0631\u064a\u0648","\u062a\u0635\u0648\u064a\u0631 \u0627\u062d\u062a\u0631\u0627\u0641\u064a","\u0631\u0633\u0648\u0645\u0627\u062a \u0645\u062a\u062d\u0631\u0643\u0629","\u062a\u0639\u0644\u064a\u0642 \u0635\u0648\u062a\u064a","\u062a\u062f\u0631\u062c \u0627\u0644\u0623\u0644\u0648\u0627\u0646","\u0625\u062e\u0631\u0627\u062c 4K"] },
  { id:"s14", type:"service",  category:"Media",            category_ar:"\u0625\u0646\u062a\u0627\u062c \u0625\u0639\u0644\u0627\u0645\u064a",    sub_category:"Design",    sub_category_ar:"\u062a\u0635\u0645\u064a\u0645",   name:"Visual Identity & Branding",        name_ar:"\u0627\u0644\u0647\u0648\u064a\u0629 \u0627\u0644\u0628\u0635\u0631\u064a\u0629 \u0648\u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629",   description:"Complete brand identity: logo, colors, fonts & guidelines.",        description_ar:"\u0647\u0648\u064a\u0629 \u062a\u062c\u0627\u0631\u064a\u0629 \u0643\u0627\u0645\u0644\u0629: \u0634\u0639\u0627\u0631\u060c \u0623\u0644\u0648\u0627\u0646\u060c \u062e\u0637\u0648\u0637 \u0648\u062f\u0644\u064a\u0644.",  icon:"\uD83C\uDFA8", color:"#a855f7", rating:4.9, reviews_count:85,  is_featured:true, features:["Logo Design","Color Palette","Typography","Brand Guidelines","Business Cards","Social Templates"],               features_ar:["\u062a\u0635\u0645\u064a\u0645 \u0627\u0644\u0634\u0639\u0627\u0631","\u0644\u0648\u062d\u0629 \u0627\u0644\u0623\u0644\u0648\u0627\u0646","\u0627\u0644\u062e\u0637\u0648\u0637","\u062f\u0644\u064a\u0644 \u0627\u0644\u0639\u0644\u0627\u0645\u0629","\u0628\u0637\u0627\u0642\u0627\u062a \u0627\u0644\u0623\u0639\u0645\u0627\u0644","\u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0633\u0648\u0634\u064a\u0627\u0644"] },
  { id:"s15", type:"service",  category:"Training",         category_ar:"\u062a\u062f\u0631\u064a\u0628",    sub_category:"Tech Training",sub_category_ar:"\u062a\u062f\u0631\u064a\u0628 \u062a\u0642\u0646\u064a",  name:"Certified Technical Training",      name_ar:"\u0627\u0644\u062a\u062f\u0631\u064a\u0628 \u0627\u0644\u062a\u0642\u0646\u064a \u0627\u0644\u0645\u0639\u062a\u0645\u062f",   description:"Certified courses: programming, security, networking, cloud.",      description_ar:"\u062f\u0648\u0631\u0627\u062a \u0645\u0639\u062a\u0645\u062f\u0629: \u0628\u0631\u0645\u062c\u0629\u060c \u0623\u0645\u0627\u0646\u060c \u0634\u0628\u0643\u0627\u062a \u0648\u0633\u062d\u0627\u0628.",  icon:"\uD83C\uDF93", color:"#22c55e", rating:4.8, reviews_count:120, features:["Certified Courses","Hands-on Labs","Expert Instructors","On-site or Online","Group Discounts","Post Support"],       features_ar:["\u062f\u0648\u0631\u0627\u062a \u0645\u0639\u062a\u0645\u062f\u0629","\u0645\u062e\u062a\u0628\u0631\u0627\u062a \u0639\u0645\u0644\u064a\u0629","\u0645\u062f\u0631\u0628\u0648\u0646 \u062e\u0628\u0631\u0627\u0621","\u062d\u0636\u0648\u0631\u064a \u0623\u0648 \u0623\u0648\u0646\u0644\u0627\u064a\u0646","\u062e\u0635\u0648\u0645\u0627\u062a \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0627\u062a","\u062f\u0639\u0645 \u0628\u0639\u062f \u0627\u0644\u062a\u062f\u0631\u064a\u0628"] },
  // SUBSCRIPTIONS
  { id:"sub1",type:"subscription",category:"Plans",         category_ar:"\u0627\u0644\u0628\u0627\u0642\u0627\u062a",  sub_category:"Starter",   sub_category_ar:"\u0623\u0633\u0627\u0633\u064a\u0629",   name:"Starter Plan",                      name_ar:"\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629",   description:"Perfect for small businesses just getting started.",                description_ar:"\u0645\u062b\u0627\u0644\u064a\u0629 \u0644\u0644\u0634\u0631\u0643\u0627\u062a \u0627\u0644\u0635\u063a\u064a\u0631\u0629 \u0627\u0644\u062a\u064a \u062a\u0628\u062f\u0623 \u0631\u062d\u0644\u062a\u0647\u0627.",  price_cents:1900,   pricing_model:"monthly",   icon:"\uD83C\uDF31", color:"#10b981", rating:4.5, reviews_count:234, features:["1 User Account","3 Business Sectors","Basic ERP Modules","Email Support","2 GB Storage","Standard Reports"],     features_ar:["\u062d\u0633\u0627\u0628 \u0645\u0633\u062a\u062e\u062f\u0645 \u0648\u0627\u062d\u062f","3 \u0642\u0637\u0627\u0639\u0627\u062a \u0623\u0639\u0645\u0627\u0644","\u0648\u062d\u062f\u0627\u062a ERP \u0623\u0633\u0627\u0633\u064a\u0629","\u062f\u0639\u0645 \u0628\u0627\u0644\u0628\u0631\u064a\u062f","2 \u062c\u064a\u062c\u0627 \u062a\u062e\u0632\u064a\u0646","\u062a\u0642\u0627\u0631\u064a\u0631 \u0642\u064a\u0627\u0633\u064a\u0629"] },
  { id:"sub2",type:"subscription",category:"Plans",         category_ar:"\u0627\u0644\u0628\u0627\u0642\u0627\u062a",  sub_category:"Business",  sub_category_ar:"\u0623\u0639\u0645\u0627\u0644",   name:"Business Plan",                     name_ar:"\u0628\u0627\u0642\u0629 \u0627\u0644\u0623\u0639\u0645\u0627\u0644",   description:"Everything you need to grow and scale your business.",              description_ar:"\u0643\u0644 \u0645\u0627 \u062a\u062d\u062a\u0627\u062c\u0647 \u0644\u0646\u0645\u0648 \u0648\u062a\u0648\u0633\u064a\u0639 \u0623\u0639\u0645\u0627\u0644\u0643.",  price_cents:7900,   pricing_model:"monthly",   icon:"\uD83D\uDE80", color:"#6366f1", rating:4.8, reviews_count:445, is_featured:true, features:["10 User Accounts","10 Business Sectors","Full ERP Suite","AI Assistant","Priority Support","50 GB Storage","Advanced Analytics","API Access"], features_ar:["10 \u062d\u0633\u0627\u0628\u0627\u062a \u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646","10 \u0642\u0637\u0627\u0639\u0627\u062a \u0623\u0639\u0645\u0627\u0644","\u0645\u062c\u0645\u0648\u0639\u0629 ERP \u0643\u0627\u0645\u0644\u0629","\u0645\u0633\u0627\u0639\u062f AI","\u062f\u0639\u0645 \u0623\u0648\u0644\u0648\u064a\u0629","50 \u062c\u064a\u062c\u0627 \u062a\u062e\u0632\u064a\u0646","\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0645\u062a\u0642\u062f\u0645\u0629","\u0648\u0635\u0648\u0644 API"] },
  { id:"sub3",type:"subscription",category:"Plans",         category_ar:"\u0627\u0644\u0628\u0627\u0642\u0627\u062a",  sub_category:"Enterprise",sub_category_ar:"\u0645\u0624\u0633\u0633\u0627\u062a",   name:"Enterprise Plan",                   name_ar:"\u0628\u0627\u0642\u0629 \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a",   description:"Unlimited power for large organizations.",                          description_ar:"\u0642\u062f\u0631\u0629 \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f\u0629 \u0644\u0644\u0645\u0646\u0638\u0645\u0627\u062a \u0627\u0644\u0643\u0628\u064a\u0631\u0629.",  price_cents:24900,  pricing_model:"monthly",   icon:"\uD83C\uDFDB\uFE0F", color:"#f59e0b", rating:4.9, reviews_count:188, features:["Unlimited Users","All Sectors","Custom ERP","Dedicated AI Agents","24/7 Phone Support","Unlimited Storage","Custom BI","Full API","White Label"], features_ar:["\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646 \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f\u0648\u0646","\u0643\u0644 \u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a","ERP \u0645\u062e\u0635\u0635","\u0648\u0643\u0644\u0627\u0621 AI \u0645\u062e\u0635\u0635\u0648\u0646","\u062f\u0639\u0645 \u0647\u0627\u062a\u0641\u064a 24/7","\u062a\u062e\u0632\u064a\u0646 \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f","BI \u0645\u062e\u0635\u0635","API \u0643\u0627\u0645\u0644","\u0639\u0644\u0627\u0645\u0629 \u0628\u064a\u0636\u0627\u0621"] },
  // INFRASTRUCTURE — Cloud, Hosting, Security
  { id:"infra1", type:"subscription", category:"Cloud & Hosting", category_ar:"\u0633\u062d\u0627\u0628\u0629 \u0648\u0627\u0633\u062a\u0636\u0627\u0641\u0629", sub_category:"Shared Hosting", sub_category_ar:"\u0627\u0633\u062a\u0636\u0627\u0641\u0629 \u0645\u0634\u062a\u0631\u0643\u0629", name:"Smart Shared Hosting", name_ar:"\u0627\u0644\u0627\u0633\u062a\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0634\u062a\u0631\u0643\u0629 \u0627\u0644\u0630\u0643\u064a\u0629", description:"Feature-rich hosting for websites and emerging systems with flexible control panels, pre-wired for direct integration and rapid automation.", description_ar:"\u0627\u0633\u062a\u0636\u0627\u0641\u0629 \u0645\u062a\u0643\u0627\u0645\u0644\u0629 \u0644\u0644\u0645\u0648\u0627\u0642\u0639 \u0648\u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0646\u0627\u0634\u0626\u0629 \u0645\u0639 \u0644\u0648\u062d\u0627\u062a \u062a\u062d\u0643\u0645 \u0645\u0631\u0646\u0629\u060c \u0645\u0647\u064a\u0623\u0629 \u0644\u0644\u0631\u0628\u0637 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0648\u0627\u0644\u0623\u062a\u0645\u062a\u0629 \u0627\u0644\u0633\u0631\u064a\u0639\u0629.", price_cents:1500, pricing_model:"monthly", icon:"\uD83C\uDF10", color:"#06b6d4", rating:4.6, reviews_count:87, is_new:true, features:["cPanel/DirectAdmin","Free SSL","Unlimited Email","1-Click WordPress","Daily Backup","99.9% Uptime SLA"], features_ar:["\u0644\u0648\u062d\u0629 \u062a\u062d\u0643\u0645 \u0645\u0631\u0646\u0629","SSL \u0645\u062c\u0627\u0646\u064a","\u0628\u0631\u064a\u062f \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f","\u062a\u062b\u0628\u064a\u062a WordPress \u0628\u0646\u0642\u0631\u0629","\u0646\u0633\u062e \u0627\u062d\u062a\u064a\u0627\u0637\u064a \u064a\u0648\u0645\u064a","\u0636\u0645\u0627\u0646 99.9% \u062a\u0634\u063a\u064a\u0644"] },
  { id:"infra2", type:"virtual",       category:"Cloud & Hosting", category_ar:"\u0633\u062d\u0627\u0628\u0629 \u0648\u0627\u0633\u062a\u0636\u0627\u0641\u0629", sub_category:"VPS",            sub_category_ar:"\u062e\u0648\u0627\u062f\u0645 \u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629",   name:"Managed Cloud VPS",   name_ar:"\u062e\u0648\u0627\u062f\u0645 \u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629 \u0633\u062d\u0627\u0628\u064a\u0629 \u0645\u062f\u0627\u0631\u0629",   description:"Fully isolated virtual servers with dedicated resources and full root access, optimized for running digital workforce empires and enterprise-grade systems.", description_ar:"\u062e\u0648\u0627\u062f\u0645 \u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629 \u0645\u0639\u0632\u0648\u0644\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0645\u0648\u0627\u0631\u062f \u0645\u062e\u0635\u0635\u0629 \u0648\u0635\u0644\u0627\u062d\u064a\u0627\u062a root \u0643\u0627\u0645\u0644\u0629\u060c \u0645\u0647\u064a\u0623\u0629 \u0644\u062a\u0634\u063a\u064a\u0644 \u0625\u0645\u0628\u0631\u0627\u0637\u0648\u0631\u064a\u0629 \u0627\u0644\u0639\u0645\u0627\u0644\u0629 \u0627\u0644\u0631\u0642\u0645\u064a\u0629 \u0648\u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064a\u0629.", price_cents:2900, pricing_model:"monthly", icon:"\u26A1", color:"#8b5cf6", rating:4.7, reviews_count:112, is_featured:true, features:["Dedicated vCPU & RAM","Full Root Access","SSD NVMe Storage","Managed Firewall","Auto-scaling","24/7 Monitoring"], features_ar:["\u0645\u0648\u0627\u0631\u062f vCPU & RAM \u0645\u062e\u0635\u0635\u0629","\u0635\u0644\u0627\u062d\u064a\u0627\u062a root \u0643\u0627\u0645\u0644\u0629","\u062a\u062e\u0632\u064a\u0646 SSD NVMe","\u062c\u062f\u0627\u0631 \u062d\u0645\u0627\u064a\u0629 \u0645\u064f\u062f\u0627\u0631","\u062a\u0648\u0633\u0639 \u062a\u0644\u0642\u0627\u0626\u064a","\u0645\u0631\u0627\u0642\u0628\u0629 24/7"] },
  { id:"infra3", type:"physical",      category:"Cloud & Hosting", category_ar:"\u0633\u062d\u0627\u0628\u0629 \u0648\u0627\u0633\u062a\u0636\u0627\u0641\u0629", sub_category:"Dedicated Servers", sub_category_ar:"\u062e\u0648\u0627\u062f\u0645 \u0645\u062e\u0635\u0635\u0629", name:"Dedicated Enterprise Servers", name_ar:"\u0627\u0644\u062e\u0648\u0627\u062f\u0645 \u0627\u0644\u0641\u064a\u0632\u064a\u0627\u0626\u064a\u0629 \u0627\u0644\u0645\u062e\u0635\u0635\u0629", description:"Rent complete bare-metal servers inside data centers for maximum performance and privacy for large enterprises and business conglomerates.", description_ar:"\u062a\u0623\u062c\u064a\u0631 \u062e\u0648\u0627\u062f\u0645 \u062d\u0642\u064a\u0642\u064a\u0629 \u0643\u0627\u0645\u0644\u0629 \u062f\u0627\u062e\u0644 \u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0644\u0636\u0645\u0627\u0646 \u0623\u0639\u0644\u0649 \u0645\u0633\u062a\u0648\u064a\u0627\u062a \u0627\u0644\u0623\u062f\u0627\u0621 \u0648\u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629 \u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0634\u0631\u0643\u0627\u062a \u0627\u0644\u0643\u0628\u0631\u0649 \u0648\u0627\u0644\u062a\u0643\u062a\u0644\u0627\u062a \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629.", price_cents:19900, pricing_model:"monthly", icon:"\uD83D\uDDA5\uFE0F", color:"#f59e0b", rating:4.8, reviews_count:45, is_featured:true, features:["Bare Metal Hardware","Dedicated Bandwidth","RAID Storage","Hardware Firewall","Remote KVM Access","99.99% SLA"], features_ar:["\u0639\u062a\u0627\u062f \u062e\u0627\u0635 \u0628\u0627\u0644\u0643\u0627\u0645\u0644","\u0628\u0627\u0646\u062f\u0648\u064a\u062f\u062b \u0645\u062e\u0635\u0635","\u062a\u062e\u0632\u064a\u0646 RAID","\u062c\u062f\u0627\u0631 \u062d\u0645\u0627\u064a\u0629 \u0639\u062a\u0627\u062f\u064a","\u0648\u0635\u0648\u0644 KVM \u0639\u0646 \u0628\u064f\u0639\u062f","\u0636\u0645\u0627\u0646 99.99%"] },
  { id:"infra4", type:"subscription",  category:"Domains",         category_ar:"\u0627\u0644\u0646\u0637\u0627\u0642\u0627\u062a",               sub_category:"Domain Names",     sub_category_ar:"\u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0646\u0637\u0627\u0642\u0627\u062a",  name:"Domain Name Hub",       name_ar:"\u062d\u062c\u0632 \u0648\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0646\u0637\u0627\u0642\u0627\u062a \u0627\u0644\u0631\u0642\u0645\u064a\u0629", description:"Register and secure domain names (international & local) with instant automated DNS server records binding.", description_ar:"\u062d\u062c\u0632 \u0648\u062a\u0623\u0645\u064a\u0646 \u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0646\u0637\u0627\u0642\u0627\u062a \u0648\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0627\u0644\u0631\u0633\u0645\u064a\u0629 (\u0627\u0644\u062f\u0648\u0644\u064a\u0629 \u0648\u0627\u0644\u0645\u062d\u0644\u064a\u0629) \u0645\u0639 \u0631\u0628\u0637 \u0641\u0648\u0631\u064a \u0648\u0645\u0624\u062a\u0645\u062a \u0628\u0633\u062c\u0644\u0627\u062a \u062e\u0648\u0627\u062f\u0645 \u0627\u0644\u0623\u0633\u0645\u0627\u0621.", price_cents:1200, pricing_model:"annual", icon:"\uD83C\uDF0D", color:"#22c55e", rating:4.5, reviews_count:210, is_new:true, features:[".com / .net / .org",".eg Local Domains","Free DNS Management","WHOIS Privacy","Auto-renewal","Domain Transfer In"], features_ar:[".com / .net / .org","\u0646\u0637\u0627\u0642\u0627\u062a .eg \u0627\u0644\u0645\u062d\u0644\u064a\u0629","\u0625\u062f\u0627\u0631\u0629 DNS \u0645\u062c\u0627\u0646\u064a\u0629","\u062e\u0635\u0648\u0635\u064a\u0629 WHOIS","\u062a\u062c\u062f\u064a\u062f \u062a\u0644\u0642\u0627\u0626\u064a","\u0646\u0642\u0644 \u0646\u0637\u0627\u0642 \u0633\u0647\u0644"] },
  { id:"infra5", type:"subscription",  category:"Email",           category_ar:"\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",  sub_category:"Business Email",   sub_category_ar:"\u0628\u0631\u064a\u062f \u0627\u0644\u0623\u0639\u0645\u0627\u0644",  name:"Business Email Suites", name_ar:"\u0627\u0633\u062a\u0636\u0627\u0641\u0629 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a", description:"Dedicated, secure mail servers under your company name to boost credibility and enable automated messaging campaigns.", description_ar:"\u0633\u064a\u0631\u0641\u0631\u0627\u062a \u0628\u0631\u064a\u062f \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0645\u0633\u062a\u0642\u0644\u0629 \u0648\u0645\u062d\u0645\u064a\u0629 \u0628\u0627\u0633\u0645 \u0634\u0631\u0643\u062a\u0643 \u0644\u062a\u0639\u0632\u064a\u0632 \u0627\u0644\u0645\u0648\u062b\u0648\u0642\u064a\u0629 \u0648\u062a\u0633\u0647\u064a\u0644 \u062d\u0645\u0644\u0627\u062a \u0627\u0644\u0645\u0631\u0627\u0633\u0644\u0629 \u0627\u0644\u0645\u0624\u062a\u0645\u062a\u0629.", price_cents:800, pricing_model:"monthly", icon:"\uD83D\uDCE7", color:"#3b82f6", rating:4.6, reviews_count:178, features:["Custom Domain Email","Anti-spam & Anti-virus","50 GB Mailbox","Email Forwarding","Webmail Access","SMTP/IMAP/POP3"], features_ar:["\u0628\u0631\u064a\u062f \u0628\u0646\u0637\u0627\u0642\u0643 \u0627\u0644\u062e\u0627\u0635","\u062d\u0645\u0627\u064a\u0629 \u0645\u0646 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0645\u0632\u0639\u062c","\u0635\u0646\u062f\u0648\u0642 \u0628\u0631\u064a\u062f 50 \u062c\u064a\u062c\u0627","\u0625\u0639\u0627\u062f\u0629 \u062a\u0648\u062c\u064a\u0647 \u0627\u0644\u0628\u0631\u064a\u062f","Webmail \u0645\u062a\u0627\u062d","\u062f\u0639\u0645 SMTP/IMAP/POP3"] },
  { id:"infra6", type:"service",       category:"Technology",      category_ar:"\u062a\u0642\u0646\u064a\u0629",                                 sub_category:"SOC",              sub_category_ar:"\u0645\u0631\u0643\u0632 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a \u0627\u0644\u0623\u0645\u0646\u064a\u0629", name:"Cyber Security & SOC Center", name_ar:"\u0645\u0631\u0643\u0632 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a \u0627\u0644\u0623\u0645\u0646\u064a\u0629 \u0648\u0627\u0644\u062f\u0631\u0639 \u0627\u0644\u0633\u064a\u0628\u0631\u0627\u0646\u064a", description:"Round-the-clock vulnerability monitoring and scanning to protect software and defend against DDoS attacks for complete digital sovereignty.", description_ar:"\u0645\u0631\u0627\u0642\u0628\u0629 \u0648\u0641\u062d\u0635 \u0627\u0644\u062b\u063a\u0631\u0627\u062a \u0639\u0644\u0649 \u0645\u062f\u0627\u0631 \u0627\u0644\u0633\u0627\u0639\u0629 \u0644\u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a \u0648\u0635\u062f \u0647\u062c\u0645\u0627\u062a \u062d\u062c\u0628 \u0627\u0644\u062e\u062f\u0645\u0629 DDoS \u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u0633\u064a\u0627\u062f\u0629 \u0627\u0644\u0631\u0642\u0645\u064a\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629.", icon:"\uD83D\uDEE1\uFE0F", color:"#ef4444", rating:4.9, reviews_count:33, is_new:true, features:["24/7 SOC Monitoring","DDoS Protection","Vulnerability Scanning","Incident Response","Threat Intelligence","Compliance Reports"], features_ar:["\u0645\u0631\u0627\u0642\u0628\u0629 SOC 24/7","\u062d\u0645\u0627\u064a\u0629 DDoS","\u0641\u062d\u0635 \u0627\u0644\u062b\u063a\u0631\u0627\u062a","\u0627\u0644\u0627\u0633\u062a\u062c\u0627\u0628\u0629 \u0644\u0644\u062d\u0648\u0627\u062f\u062b","\u0627\u0633\u062a\u062e\u0628\u0627\u0631\u0627\u062a \u0627\u0644\u062a\u0647\u062f\u064a\u062f\u0627\u062a","\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0627\u0645\u062a\u062b\u0627\u0644"] },
  { id:"infra7", type:"subscription",  category:"Cloud & Hosting", category_ar:"\u0633\u062d\u0627\u0628\u0629 \u0648\u0627\u0633\u062a\u0636\u0627\u0641\u0629", sub_category:"Backup & DR",     sub_category_ar:"\u0646\u0633\u062e \u0627\u062d\u062a\u064a\u0627\u0637\u064a \u0648\u062a\u0639\u0627\u0641\u064d",   name:"Disaster Recovery & Backup", name_ar:"\u0627\u0644\u0646\u0633\u062e \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0637\u064a \u0648\u0627\u0633\u062a\u0645\u0631\u0627\u0631\u064a\u0629 \u0627\u0644\u0623\u0639\u0645\u0627\u0644", description:"Periodic encrypted backup systems ensuring instant data recovery in emergencies without any system downtime.", description_ar:"\u0623\u0646\u0638\u0645\u0629 \u062a\u0623\u0645\u064a\u0646 \u0648\u062d\u0641\u0638 \u0646\u0633\u062e \u0627\u062d\u062a\u064a\u0627\u0637\u064a\u0629 \u062f\u0648\u0631\u064a\u0629 \u0645\u0634\u0641\u0631\u0629 \u0644\u0636\u0645\u0627\u0646 \u0627\u0633\u062a\u0631\u062c\u0627\u0639 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0641\u0648\u0631\u064a \u0641\u064a \u062d\u0627\u0644\u0627\u062a \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u062f\u0648\u0646 \u062a\u0648\u0642\u0641 \u0627\u0644\u0646\u0638\u0627\u0645.", price_cents:2900, pricing_model:"monthly", icon:"\uD83D\uDD10", color:"#14b8a6", rating:4.8, reviews_count:64, features:["Encrypted Backups","Point-in-time Recovery","Automated Schedules","Cross-region Replication","Instant Failover","99.99% RPO SLA"], features_ar:["\u0646\u0633\u062e \u0645\u0634\u0641\u0631\u0629","\u0627\u0633\u062a\u0631\u062c\u0627\u0639 \u0644\u062d\u0638\u064a","\u062c\u062f\u0627\u0648\u0644 \u062a\u0644\u0642\u0627\u0626\u064a\u0629","\u0646\u0633\u062e \u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0645\u0646\u0627\u0637\u0642","\u062a\u062d\u0648\u064a\u0644 \u0641\u0648\u0631\u064a","\u0636\u0645\u0627\u0646 RPO 99.99%"] },
];

// -----------------------------------------------------------------
//  HELPERS
// -----------------------------------------------------------------
function formatPrice(cents: number, model?: string, isAr = false): string {
  const usd = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  const suffix =
    model === "monthly" ? (isAr ? "/\u0634\u0647\u0631" : "/mo") :
    model === "annual"  ? (isAr ? "/\u0633\u0646\u0629" : "/yr") : "";
  return `$${usd}${suffix}`;
}

// -----------------------------------------------------------------
//  REQUEST DIALOG
// -----------------------------------------------------------------
interface ReqForm { name: string; email: string; phone: string; company: string; message: string }

function RequestDialog({
  item, open, onClose, isAr,
}: { item: CatalogItem | null; open: boolean; onClose: () => void; isAr: boolean }) {
  const [form, setForm] = useState<ReqForm>({ name: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!item) return null;
  const set = (k: keyof ReqForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error(isAr ? "الاسم والبريد الإلكتروني مطلوبان" : "Name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      const { error: insertError } = await (supabase as any).from("service_requests").insert({
        service_name: item.name, service_name_ar: item.name_ar,
        customer_name: form.name, customer_email: form.email,
        customer_phone: form.phone || null, company: form.company || null,
        message: form.message || null, status: "pending",
      });
      if (insertError) throw insertError;

      // Send notification + confirmation emails
      const { data: emailResult, error: emailInvokeError } = await supabase.functions.invoke("send-contact-email", {
        body: {
          section_en: `Products & Services — ${item.name}`,
          section_ar: `المنتجات والخدمات — ${item.name_ar}`,
          data: {
            name:    form.name,
            email:   form.email,
            phone:   form.phone,
            company: form.company,
            product: `${item.name} / ${item.name_ar}`,
            message: form.message,
          },
        },
      });
      if (emailInvokeError) throw emailInvokeError;
      if (emailResult && typeof emailResult === "object" && "success" in emailResult && !emailResult.success) {
        throw new Error("Email provider rejected the request");
      }

      setSuccess(true);
      toast.success(isAr ? "تم إرسال طلبك بنجاح!" : "Request submitted successfully!");
      setTimeout(() => {
        setSuccess(false); onClose();
        setForm({ name: "", email: "", phone: "", company: "", message: "" });
      }, 2000);
    } catch {
      toast.error(isAr ? "حدث خطأ، يرجى المحاولة لاحقاً" : "Something went wrong, please try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md" dir={isAr ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span style={{ color: item.color }}>{item.icon}</span>
            <span>{isAr ? item.name_ar : item.name}</span>
          </DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
            <p className="text-emerald-300 text-lg font-medium">{isAr ? "\u062a\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0628\u0646\u062c\u0627\u062d!" : "Request Sent!"}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">{isAr ? "\u0627\u0644\u0627\u0633\u0645 *" : "Name *"}</Label>
                <Input value={form.name} onChange={set("name")} className="bg-slate-800 border-slate-600 text-white text-sm h-9" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">{isAr ? "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a *" : "Email *"}</Label>
                <Input type="email" value={form.email} onChange={set("email")} className="bg-slate-800 border-slate-600 text-white text-sm h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">{isAr ? "\u0627\u0644\u0647\u0627\u062a\u0641" : "Phone"}</Label>
                <Input value={form.phone} onChange={set("phone")} className="bg-slate-800 border-slate-600 text-white text-sm h-9" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">{isAr ? "\u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629" : "Company"}</Label>
                <Input value={form.company} onChange={set("company")} className="bg-slate-800 border-slate-600 text-white text-sm h-9" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">{isAr ? "\u0631\u0633\u0627\u0644\u062a\u0643" : "Message"}</Label>
              <Textarea value={form.message} onChange={set("message")} rows={3} className="bg-slate-800 border-slate-600 text-white text-sm resize-none" />
            </div>
          </div>
        )}
        {!success && (
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white" disabled={submitting}>
              {isAr ? "\u0625\u0644\u063a\u0627\u0621" : "Cancel"}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} style={{ background: item.color }} className="text-white font-medium">
              {submitting ? (isAr ? "\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0631\u0633\u0627\u0644..." : "Sending\u2026") : (isAr ? "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628" : "Submit Request")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------------------------------
//  ITEM CARD
// -----------------------------------------------------------------
function ItemCard({ item, isAr, onRequest }: {
  item: CatalogItem; isAr: boolean;
  onRequest: (item: CatalogItem) => void;
}) {
  const [showFeatures, setShowFeatures] = useState(false);
  const features = isAr ? item.features_ar : item.features;

  return (
    <div className="relative bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-500/70 transition-all"
      style={{ borderTop: `2px solid ${item.color}25` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${item.color}20` }}>
          {item.icon}
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {item.is_featured && (
            <Badge className="text-[10px] px-1.5 py-0" style={{ background: `${item.color}30`, color: item.color, border: `1px solid ${item.color}40` }}>
              {isAr ? "\u0645\u0645\u064a\u0632" : "Featured"}
            </Badge>
          )}
          {item.is_new && (
            <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {isAr ? "\u062c\u062f\u064a\u062f" : "New"}
            </Badge>
          )}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1 flex-wrap">
          <span>{isAr ? TYPE_CONFIG[item.type].label_ar : TYPE_CONFIG[item.type].label_en}</span>
          <ChevronRight className="w-2.5 h-2.5 shrink-0" />
          <span>{isAr ? item.category_ar : item.category}</span>
          {item.sub_category && (
            <>
              <ChevronRight className="w-2.5 h-2.5 shrink-0" />
              <span>{isAr ? item.sub_category_ar : item.sub_category}</span>
            </>
          )}
        </div>
        <h3 className="text-white font-semibold text-sm leading-snug">{isAr ? item.name_ar : item.name}</h3>
      </div>
      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{isAr ? item.description_ar : item.description}</p>
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={cn("w-3 h-3", i <= Math.round(item.rating) ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />
        ))}
        <span className="text-slate-400 text-[10px] ml-1">({item.reviews_count})</span>
      </div>
      {features && features.length > 0 && (
        <div>
          <button onClick={() => setShowFeatures(s => !s)} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors">
            <ChevronDown className={cn("w-3 h-3 transition-transform", showFeatures && "rotate-180")} />
            {isAr ? (showFeatures ? "\u0625\u062e\u0641\u0627\u0621 \u0627\u0644\u0645\u064a\u0632\u0627\u062a" : "\u0639\u0631\u0636 \u0627\u0644\u0645\u064a\u0632\u0627\u062a") : (showFeatures ? "Hide features" : "Show features")}
          </button>
          {showFeatures && (
            <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: item.color }} />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="mt-auto pt-2 border-t border-slate-700/40">
        <Button size="sm" onClick={() => onRequest(item)} className="w-full h-8 text-[11px] font-semibold text-white" style={{ background: item.color }}>
          {isAr ? "\u062a\u0642\u062f\u064a\u0645 \u0637\u0644\u0628" : "Submit Request"}
        </Button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
//  MAIN PAGE
// -----------------------------------------------------------------
export default function PublicProducts() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();

  // safe cart access removed — no cart needed (all items use Submit Request)
  const [typeFilter, setTypeFilter] = useState<TypeId>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [subFilter, setSubFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [reqItem, setReqItem] = useState<CatalogItem | null>(null);

  // Load catalog from Supabase; fall back to ALL_ITEMS if DB not ready
  const [items, setItems] = useState<CatalogItem[]>(ALL_ITEMS);
  useEffect(() => {
    (supabase as any)
      .from("website_products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }: { data: any; error: any }) => {
        if (!error && data && data.length > 0) {
          setItems(data as CatalogItem[]);
        }
      });
  }, []);

  const categories = useMemo(() => {
    const src = typeFilter === "all" ? items : items.filter(i => i.type === typeFilter);
    const seen = new Set<string>();
    const out: { key: string; label: string }[] = [];
    for (const item of src) {
      if (!seen.has(item.category)) { seen.add(item.category); out.push({ key: item.category, label: isAr ? item.category_ar : item.category }); }
    }
    return out;
  }, [typeFilter, isAr]);

  const subCategories = useMemo(() => {
    if (catFilter === "all") return [];
    const src = items.filter(i => (typeFilter === "all" || i.type === typeFilter) && i.category === catFilter && i.sub_category);
    const seen = new Set<string>();
    const out: { key: string; label: string }[] = [];
    for (const item of src) {
      if (item.sub_category && !seen.has(item.sub_category)) {
        seen.add(item.sub_category);
        out.push({ key: item.sub_category, label: isAr ? (item.sub_category_ar ?? item.sub_category) : item.sub_category });
      }
    }
    return out;
  }, [typeFilter, catFilter, isAr]);

  const handleTypeChange = (t: TypeId) => { setTypeFilter(t); setCatFilter("all"); setSubFilter("all"); };
  const handleCatChange  = (c: string) => { setCatFilter(c); setSubFilter("all"); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(item => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (catFilter !== "all" && item.category !== catFilter) return false;
      if (subFilter !== "all" && item.sub_category !== subFilter) return false;
      if (q) {
        const hay = `${item.name} ${item.name_ar} ${item.description} ${item.description_ar} ${item.category} ${item.category_ar}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [typeFilter, catFilter, subFilter, search]);

  const grouped = useMemo(() => {
    const types: TypeId[] = ["digital", "physical", "virtual", "service", "subscription"];
    return types.map(t => ({ type: t, items: filtered.filter(i => i.type === t) })).filter(g => g.items.length > 0);
  }, [filtered]);

  const typeKeys: TypeId[] = ["all", "digital", "physical", "virtual", "service", "subscription"];
  const activeColor = typeFilter === "all" ? "#94a3b8" : TYPE_CONFIG[typeFilter].color;

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900" dir={isAr ? "rtl" : "ltr"}>
        {/* HERO */}
        <div className="text-center py-14 px-4 bg-gradient-to-b from-slate-900 to-transparent">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isAr ? "\u0643\u062a\u0627\u0644\u0648\u062c \u0643\u064a\u0645\u062a \u0631\u0627\u064a\u0632 \u0627\u0644\u0643\u0627\u0645\u0644" : "KemetRise Complete Catalog"}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3">
            {isAr ? "\u0645\u0646\u062a\u062c\u0627\u062a\u0646\u0627 \u0648\u062e\u062f\u0645\u0627\u062a\u0646\u0627" : "Our Products & Services"}
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
            {isAr
              ? "\u0627\u0643\u062a\u0634\u0641 \u0623\u0643\u062b\u0631 \u0645\u0646 50 \u0645\u0646\u062a\u062c\u0627\u064b \u0648\u062e\u062f\u0645\u0629\u064b \u0641\u064a \u0645\u0643\u0627\u0646 \u0648\u0627\u062d\u062f"
              : "Explore 50+ products & services in one place"}
          </p>
        </div>

        {/* STICKY FILTER BAR */}
        <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 px-4 py-3">
          <div className="max-w-7xl mx-auto space-y-2.5">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 ps-9 pe-4 py-2 focus:outline-none focus:border-slate-500"
                placeholder={isAr ? "\u0627\u0628\u062d\u062b \u0639\u0646 \u0645\u0646\u062a\u062c \u0623\u0648 \u062e\u062f\u0645\u0629..." : "Search products & services..."}
                value={search} onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Level 1 - Type */}
            <div className="flex flex-wrap gap-1.5">
              {typeKeys.map(t => {
                const cfg = TYPE_CONFIG[t];
                const active = typeFilter === t;
                return (
                  <button key={t} onClick={() => handleTypeChange(t)}
                    className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
                      active ? "text-white shadow-md" : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white hover:bg-slate-700/60")}
                    style={active ? { background: cfg.color, boxShadow: `0 0 12px ${cfg.color}60` } : {}}>
                    <span>{cfg.icon}</span>{isAr ? cfg.label_ar : cfg.label_en}
                  </button>
                );
              })}
            </div>
            {/* Level 2 - Category */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <button onClick={() => handleCatChange("all")}
                  className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all border",
                    catFilter === "all" ? "text-white border-transparent" : "bg-slate-800/40 text-slate-500 border-slate-700/40 hover:text-white")}
                  style={catFilter === "all" ? { background: `${activeColor}30`, borderColor: `${activeColor}50`, color: activeColor } : {}}>
                  {isAr ? "\u0627\u0644\u0643\u0644" : "All"}
                </button>
                {categories.map(c => (
                  <button key={c.key} onClick={() => handleCatChange(c.key)}
                    className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all border",
                      catFilter === c.key ? "text-white border-transparent" : "bg-slate-800/40 text-slate-500 border-slate-700/40 hover:text-white")}
                    style={catFilter === c.key ? { background: `${activeColor}30`, borderColor: `${activeColor}50`, color: activeColor } : {}}>
                    {c.label}
                  </button>
                ))}
              </div>
            )}
            {/* Level 3 - Sub-category */}
            {subCategories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <button onClick={() => setSubFilter("all")}
                  className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border",
                    subFilter === "all" ? "text-white border-transparent" : "bg-slate-800/30 text-slate-600 border-slate-700/30 hover:text-white")}
                  style={subFilter === "all" ? { background: `${activeColor}20`, borderColor: `${activeColor}40`, color: activeColor } : {}}>
                  {isAr ? "\u0627\u0644\u0643\u0644" : "All"}
                </button>
                {subCategories.map(s => (
                  <button key={s.key} onClick={() => setSubFilter(s.key)}
                    className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border",
                      subFilter === s.key ? "text-white border-transparent" : "bg-slate-800/30 text-slate-600 border-slate-700/30 hover:text-white")}
                    style={subFilter === s.key ? { background: `${activeColor}20`, borderColor: `${activeColor}40`, color: activeColor } : {}}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-slate-500 text-xs mb-6">
            {isAr ? `${filtered.length} \u0646\u062a\u064a\u062c\u0629` : `${filtered.length} results`}
          </p>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <p className="text-4xl mb-3">\uD83D\uDD0D</p>
              <p>{isAr ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c \u0645\u0637\u0627\u0628\u0642\u0629" : "No results found"}</p>
            </div>
          ) : typeFilter === "all" && catFilter === "all" && subFilter === "all" ? (
            <div className="space-y-12">
              {grouped.map(group => {
                const cfg = TYPE_CONFIG[group.type];
                const SHOW = 4;
                const visible = group.items.slice(0, SHOW);
                const extra = group.items.length - SHOW;
                return (
                  <section key={group.type}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{cfg.icon}</span>
                        <div>
                          <h2 className="text-white font-bold text-lg">{isAr ? cfg.label_ar : cfg.label_en}</h2>
                          <p className="text-slate-500 text-xs">{group.items.length} {isAr ? "\u0639\u0646\u0635\u0631" : "items"}</p>
                        </div>
                      </div>
                      {group.items.length > SHOW && (
                        <button onClick={() => handleTypeChange(group.type)}
                          className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-colors" style={{ color: cfg.color }}>
                          {isAr ? `+ ${extra} \u0623\u062e\u0631\u0649` : `+ ${extra} more`}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {visible.map(item => (
                        <ItemCard key={item.id} item={item} isAr={isAr} onRequest={setReqItem} />
                      ))}
                    </div>
                    {group.items.length > SHOW && (
                      <div className="mt-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => handleTypeChange(group.type)} className="text-slate-400 hover:text-white text-xs">
                          {isAr ? `\u0639\u0631\u0636 \u062c\u0645\u064a\u0639 ${group.items.length} \u0639\u0646\u0635\u0631` : `View all ${group.items.length} items`}
                          <ChevronRight className="w-3.5 h-3.5 ms-1" />
                        </Button>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(item => (
                <ItemCard key={item.id} item={item} isAr={isAr} onRequest={setReqItem} />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center py-14 px-4 border-t border-slate-800/40">
          <h2 className="text-xl font-bold text-white mb-2">
            {isAr ? "\u0644\u0645 \u062a\u062c\u062f \u0645\u0627 \u062a\u0628\u062d\u062b \u0639\u0646\u0647\u061f" : "Didn't find what you're looking for?"}
          </h2>
          <p className="text-slate-400 text-sm mb-5">
            {isAr ? "\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0648\u0633\u0646\u0633\u0627\u0639\u062f\u0643" : "Contact us and we'll help you find the right solution"}
          </p>
          <Button onClick={() => navigate("/contact")} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6">
            {isAr ? "\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627" : "Contact Us"}
          </Button>
        </div>
      </div>
      <RequestDialog item={reqItem} open={!!reqItem} onClose={() => setReqItem(null)} isAr={isAr} />
    </PublicLayout>
  );
}
