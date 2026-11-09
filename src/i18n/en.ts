// English version of the portfolio (compact: no 3D intro). Same facts as pt-BR.ts and data/projetos.ts.
import { ptBR } from './pt-BR';

export const en = {
  lang: 'en',
  meta: {
    title: 'Vitor Tosti · AI Builder',
    description:
      'Vitor Tosti, Computer Science student at UFABC (Brazil). Read-only MCP server, LLM evaluation on real data, and internal tools running in production.',
  },
  nav: [
    { href: '#projects', rotulo: 'Projects' },
    { href: '#stack', rotulo: 'Stack' },
    { href: '#about', rotulo: 'About' },
    { href: '#experience', rotulo: 'Experience' },
    { href: '#contact', rotulo: 'Contact' },
  ],
  subtitle: 'AI Builder · São Bernardo do Campo, SP, Brazil',
  h1: 'I build AI-powered systems and apps that solve real problems.',
  intro:
    'Computer Science student at UFABC. From public sites to internal operations, I turn day-to-day problems into software that works.',
  cta: { projects: 'See projects', city: 'Explore Entre vias', contact: 'Get in touch', cv: 'Résumé (PDF, Portuguese)' },
  numbers: [
    { v: '~300', r: 'machines and orders per month on InfoCAIJ' },
    { v: '15', r: 'users across 4 roles' },
    { v: '60–90 → 5 min', r: 'OS install time per machine, automated with FOG' },
    { v: '93 of 135', r: 'machines skipped a step, found by the MCP on real data' },
  ],
  projectsTitle: 'Projects',
  projectsNote: 'Project detail pages are in Portuguese. The summaries below cover the essentials.',
  details: 'Details (in Portuguese)',
  projects: [
    {
      slug: 'infocaij-mcp',
      nome: 'InfoCAIJ MCP',
      status: 'featured',
      problem: 'Management at CAIJ Informática had to open screens and build spreadsheets to find where the machine queue got stuck.',
      solution:
        'A read-only MCP (Model Context Protocol) server that connects the internal InfoCAIJ system to Claude. 8 tools, 3 ready-made prompts and 56 tests. Every tool also returns schema-described structured output, and times can be measured in business hours. Reads SQLite or PostgreSQL, always read-only. No required dependencies: the protocol is implemented directly in TypeScript and the PostgreSQL driver is optional.',
      results: [
        'Found that 93 of 135 machines skipped the "Ready" stage',
        'Bottleneck was picked by median (0.8 h); real problem was a long tail in "Awaiting pickup" (p90 77.8 h). Now picked by total hours, with a long-tail regression test',
        'No tool returns customer data, and a test with planted fake data proves nothing leaks',
      ],
      link: { rotulo: 'GitHub', href: 'https://github.com/VitorTosti/infocaij-mcp' },
    },
    {
      slug: 'kairo',
      nome: 'Kairo',
      status: 'AI agent team',
      problem: 'A barbershop owner works all day with busy hands and needs to see the day, close the schedule and fill open slots without stopping work.',
      solution:
        'An online scheduler for small beauty businesses, built by a team of AI agents: one orchestrator and five specialists, each owning an area of the code, with type contracts, one branch per agent, tests before every merge and independent review. Clients book from their phone without creating a password.',
      results: [
        '471 unit tests; 191 on the scheduling engine with 99.3% coverage',
        '22 tables isolated per business with RLS and 146 pgTAP assertions',
        'Pilot with a barbershop in São Bernardo do Campo. Next: a copilot where the model proposes and the person confirms',
      ],
      link: { rotulo: 'GitHub', href: 'https://github.com/VitorTosti/sistema-agenda' },
    },
    {
      slug: 'cardapio-em-1-minuto',
      nome: 'Menu in 1 minute',
      status: 'in progress',
      problem: 'Putting a small restaurant on a delivery app means typing the whole menu, and many only have a paper one.',
      solution:
        'A photo of the menu becomes a structured digital menu: items, prices per size, add-ons and notes, with anything needing human review flagged. Model: Gemini, with JSON output validated by a schema.',
      results: [
        'Evaluation set: 60 synthetic menus with ground truth, 991 items, 172 traps',
        'Key metric: silent price error (wrong price, not flagged for review)',
        'Preliminary run, 5 menus: 100% publish-ready on clean, ordinary photos. Hard photo: two prices misread without a review flag',
      ],
      link: null,
    },
    {
      slug: 'infocaij',
      nome: 'InfoCAIJ',
      status: 'in production',
      problem: 'Selling and preparing notebooks at CAIJ Informática happened over WhatsApp.',
      solution:
        'Internal web platform. Each machine sold gets its own identity and goes through an 8-stage queue with a 10-item technical checklist, ERP integration, invoicing, packing, QR-code warranty and history by serial number. Built with Claude Code. Private code.',
      results: [
        '~300 machines and orders per month, 15 users in 4 roles',
        'Over 13 thousand history events and 8,207 stock movements reconciled with the ERP',
        '95 test files; migration to a VPS with a rollback plan',
      ],
      link: { rotulo: 'Case study', href: 'https://github.com/VitorTosti/infocaij-case-study' },
    },
    {
      slug: 'infomachine',
      nome: 'InfoMachine',
      status: 'in use at the bench',
      problem: 'Triage every notebook that arrives at the repair bench.',
      solution:
        'A portable bench app that runs from a USB drive on Windows and macOS: reads the hardware, checks the serial-number history, runs 5 hardware tests and prints a thermal label. Updates are verified by SHA-256. Built with Codex.',
      results: ['About 100 machines per week', '5 hardware tests', 'Windows and macOS'],
      link: { rotulo: 'GitHub', href: 'https://github.com/VitorTosti/infomachine' },
    },
    {
      slug: 'coreufabc',
      nome: 'CoreUFABC',
      status: 'prototype',
      problem: 'Planning the next term at UFABC from the academic transcript.',
      solution: 'Reads the SIGAA transcript, computes CR, CA and CPk and simulates next term’s schedule.',
      results: ['66 tests', 'CI on GitHub Actions'],
      link: { rotulo: 'GitHub', href: 'https://github.com/VitorTosti/CoreUFABC' },
    },
  ],
  cityTitle: 'Entre vias, a mobility lab',
  cityText:
    'An interactive urban mobility simulator: experiment with demand, buses and traffic lights. Educational and local, with no real traffic data.',
  aboutTitle: 'About',
  about:
    'I am a Computer Science student at UFABC focused on applied AI: agents that use tools, structured data extraction from documents and, above all, evaluating models on real data to find where they fail before anyone depends on their answers. I aim to deliver reliable solutions that work in production and create value for the people who use them, while continuing to grow technically and contribute to teams that treat AI with rigor.',
  experienceTitle: 'Experience',
  experience: [
    { onde: 'CAIJ Informática', papel: 'Technology Technician', quando: 'Feb 2026 → present', texto: 'InfoCAIJ, InfoMachine and FOG-based installation automation.' },
    {
      onde: 'Genesis Development & Equipment',
      papel: 'Engineering intern',
      quando: 'Sep 2025 → Feb 2026',
      texto:
        'Automated test platform for automotive lighting (Python, Raspberry Pi and PostgreSQL), a Streamlit dashboard used by management, and remote access to the stations (Tailscale and VNC) so the São Paulo plant could support the one in Bahia.',
    },
    { onde: 'Mercedes-Benz do Brasil', papel: 'Apprentice', quando: 'Jan 2025 → Aug 2025', texto: 'CNC machine programming and operation.' },
  ],
  education: [
    { onde: 'UFABC', texto: 'B.Sc. in Science and Technology', quando: 'expected Jul 2028' },
    { onde: 'UFABC', texto: 'Computer Science', quando: 'expected Jul 2029' },
    { onde: 'ETEC Lauro Gomes', texto: 'Electronics technician', quando: '2024' },
  ],
  languages: 'English B2 (Cambridge PET, Grade A)',
  contactTitle: "Let's talk",
  contact: 'Have a project or a real problem to solve? Let’s talk about technology, AI and solutions that work in practice.',
  form: { titulo: 'Or write here', nome: 'Name', email: 'Email', mensagem: 'Message', enviar: 'Send message' },
  links: ptBR.links,
};
