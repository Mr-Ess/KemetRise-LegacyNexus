import { readFileSync, writeFileSync } from 'fs';

// ─── PublicProjects.tsx ──────────────────────────────────────────
let c = readFileSync('src/pages/public/PublicProjects.tsx', 'utf8');

// 1. Extend Project interface with bilingual fields
c = c.replace(
`interface Project {
  id: string;
  title: string;
  brand_name: string;
  sector: string | null;
  execution_type: string | null;
  description: string;
  image_url: string | null;
  project_order: number;
  is_active?: boolean;
}`,
`interface Project {
  id: string;
  title: string;
  title_en?: string;
  brand_name: string;
  sector: string | null;
  sector_en?: string;
  execution_type: string | null;
  description: string;
  description_en?: string;
  image_url: string | null;
  project_order: number;
  is_active?: boolean;
}`
);

// 2. Add English translations to STATIC_PROJECTS
// Replace each project entry with bilingual version
const projectTranslations = {
  'fh-001': {
    title_en: 'Modest Fashion Collections Management System',
    sector_en: 'Fashion & Modest Styling',
    description_en: 'A complete system for managing modest fashion collections including size/color inventory management, artistic piece classification, and automated catalog publishing across multiple sales channels with real-time stock alerts.'
  },
  'fh-002': {
    title_en: 'AI Fashion Styling Assistant',
    sector_en: 'AI Styling',
    description_en: 'A custom AI agent providing outfit coordination recommendations based on client preferences, occasion, and modest dress requirements. Operates via interactive chat in Arabic and English around the clock.'
  },
  'fh-003': {
    title_en: 'Smart Dynamic Size Guide',
    sector_en: 'Fashion & Modest Styling',
    description_en: 'An intelligent interactive tool guiding customers to the best fit based on their actual measurements, reducing return rates by up to 60% and improving satisfaction through accurate, continuously updated recommendations.'
  },
  'jcs-001': {
    title_en: 'Multi-Vendor Retail Platform',
    sector_en: 'E-commerce & Smart Logistics',
    description_en: 'A centralized retail store aggregating multiple suppliers in a unified display with real-time inventory management, competitive pricing, and full synchronization with POS systems and payment gateways.'
  },
  'jcs-002': {
    title_en: 'Automated Shipping & Delivery Engine',
    sector_en: 'E-commerce & Smart Logistics',
    description_en: 'An automated integration system with shipping companies via Webhooks, generating shipping labels upon order confirmation and tracking shipments in real time with automatic SMS and email notifications to customers.'
  },
  'jcs-003': {
    title_en: 'Supplier Network Management Portal',
    sector_en: 'Supply Chain',
    description_en: 'An integrated supplier portal for uploading products and invoices, tracking orders and managing contracts with performance evaluation mechanisms, quality assurance, and direct communication channels with the purchasing team.'
  },
  'yc-001': {
    title_en: 'Integrated Startup Accelerator',
    sector_en: 'Business Incubators & Marketing Hub',
    description_en: 'A comprehensive startup acceleration program including initial assessment, strategic mentoring, connecting projects with investors, along with legal and accounting support through a qualified expert network.'
  },
  'yc-002': {
    title_en: 'HR Hub Invitation Tracking System',
    sector_en: 'HR Management',
    description_en: 'An integrated digital system for managing and tracking HR portal join invitations, including custom invitation codes, interactive tracking dashboards, and invitation acceptance reports with full ERP integration.'
  },
  'yc-003': {
    title_en: 'Smart Marketing Methodologies Hub',
    sector_en: 'Marketing Hub',
    description_en: 'An educational and practical platform for modern marketing methodologies integrating customized marketing plans, performance analytics, content creation tools, and ROI tracking in a collaborative workspace.'
  },
  'gv-001': {
    title_en: 'Media Production Workflow Platform',
    sector_en: 'Media, Production & Arts Distribution',
    description_en: 'A media production project management system from concept to distribution, including shooting schedules, production team management, review and approval stages, completed project archiving, and operational cost tracking.'
  },
  'gv-002': {
    title_en: 'Media Licensing & Rights Management System',
    sector_en: 'Media Licensing',
    description_en: 'An integrated system for managing intellectual property rights and media licenses, including work registration, distribution contracts, usage tracking, and collecting royalties from various digital platforms.'
  },
  'gv-003': {
    title_en: 'Video & Audio Content Production Pipeline',
    sector_en: 'Production Pipeline',
    description_en: 'An integrated digital production pipeline connecting the creative team with editing tools, visual effects, and distribution, with an intelligent review system using AI to suggest content improvements before publication.'
  },
  'ag-001': {
    title_en: 'Custom AI Agents Network',
    sector_en: 'AI Operations & Digital Labor System',
    description_en: 'Building and operating an integrated network of custom AI agents to automate operational processes, including customer service agents, smart scheduling, data analytics, and order management without human intervention.'
  },
  'ag-002': {
    title_en: 'Interactive Workflow Map Editor',
    sector_en: 'Workflow Automation',
    description_en: 'An advanced drag-and-drop visual tool for designing automated workflows supporting advanced logical conditions (condition_expr), full n8n integration, and real-time debugging in production environments.'
  },
  'ag-003': {
    title_en: 'Enterprise n8n Network Orchestration & Management',
    sector_en: 'Digital Infrastructure',
    description_en: 'Designing, operating, and monitoring complete enterprise n8n automation networks including system integrations, big data processing, and running complex multi-step processes with high reliability and security.'
  },
  'ca-001': {
    title_en: 'Commercial Agency Contract Governance System',
    sector_en: 'Contract Governance',
    description_en: 'An integrated legal-tech system for managing multi-tenant commercial agency contracts, including digital contract creation, electronic signatures, clause validity tracking, and automatic alerts before contract expiry.'
  },
  'ca-002': {
    title_en: 'International Supplier Network Platform',
    sector_en: 'International Trade',
    description_en: 'A professional platform connecting international suppliers with the local market, including digital customs clearance procedures, international invoice management, cross-border shipment tracking, and import/export compliance.'
  },
  'ca-003': {
    title_en: 'Global Logistics Distribution System',
    sector_en: 'Global Logistics',
    description_en: 'An integrated global distribution network supporting advanced logistics planning, distributed warehouse management, shipping route optimization, and integration with international distribution partners for efficient market access.'
  },
};

// Insert bilingual fields into each STATIC_PROJECT entry
for (const [id, trans] of Object.entries(projectTranslations)) {
  c = c.replace(
    new RegExp(`(\\{ id:"${id}", title:"[^"]+", brand_name:"[^"]+")`),
    `$1, title_en:"${trans.title_en}"`
  );
  // Add sector_en after sector
  c = c.replace(
    new RegExp(`(id:"${id}"[^}]+sector:"${escapeRegex(trans.sector_en || '')}")`),
    `$1, sector_en:"${trans.sector_en}"`
  );
  // Add description_en after description
  const shortId = id;
  c = c.replace(
    new RegExp(`(id:"${shortId}"[\\s\\S]*?description:")((?:[^"\\\\]|\\\\.)*)(")`),
    `$1$2$3, description_en:"${trans.description_en.replace(/"/g, '\\"')}"`
  );
}

// 3. Update ProjectCard to use bilingual title and description
c = c.replace(
`        <h3 className="text-white font-bold text-sm leading-snug tracking-tight">
          {project.title}
        </h3>`,
`        <h3 className="text-white font-bold text-sm leading-snug tracking-tight">
          {isAr ? project.title : (project.title_en || project.title)}
        </h3>`
);

c = c.replace(
`              {project.description}
            </p>`,
`              {isAr ? project.description : (project.description_en || project.description)}
            </p>`
);

// 4. Update sector badge to use bilingual sector
c = c.replace(
`              <Layers className="w-2.5 h-2.5 shrink-0" />
              {project.sector}`,
`              <Layers className="w-2.5 h-2.5 shrink-0" />
              {isAr ? project.sector : (project.sector_en || project.sector)}`
);

writeFileSync('src/pages/public/PublicProjects.tsx', c, 'utf8');
console.log('PublicProjects.tsx updated');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
