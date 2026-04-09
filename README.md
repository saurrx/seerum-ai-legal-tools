# Seerum AI Legal Tools

**Your new client onboarding workflow — inside Claude.**

Type a sentence about your new client. Get back a complete intake analysis, compliance document checklist, and agreement outline. In seconds, not hours.

---

## What This Does

This tool connects to Claude Desktop and gives it knowledge about healthcare law — state-by-state med spa regulations, entity structures, medical director requirements, consent form mappings, and compliance documents.

Instead of your team spending hours researching state rules and assembling documents for each new member, Claude does the heavy lifting:

```
You type:
  "New Premium member: Maria, nurse practitioner, wants to open
   a med spa in Texas offering Botox, fillers, and IV therapy.
   No entity formed, no medical director yet."

Claude returns:
  ✓ Texas requires MSO structure (non-physician cannot own directly)
  ✓ Needs PLLC + LLC, Medical Director Agreement, MSA
  ✓ 14 consent forms + HIPAA + OSHA docs identified for her services
  ✓ Agreement outline with TX-specific clauses
  ✓ Welcome email draft with personalized next steps
```

**Your team reviews, edits, and sends. Claude prepares — humans decide.**

---

## How It Works

```
┌──────────────────────────────┐
│  Paralegal / Attorney types  │
│  new client details into     │
│  Claude Desktop (Cowork)     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Claude calls 3 tools:       │
│                              │
│  1. Analyze client situation │
│     → State rules, entity    │
│       structure, MSO need    │
│                              │
│  2. Build compliance package │
│     → Consent forms, HIPAA,  │
│       OSHA docs mapped to    │
│       their specific services│
│                              │
│  3. Draft agreement outline  │
│     → MDA, MSA, employment   │
│       agreements with state- │
│       specific sections      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Attorney reviews output,   │
│  makes edits, sends to      │
│  client. Nothing goes out    │
│  automatically.             │
└──────────────────────────────┘
```

---

## Install

### Option A: One-Click Install (Recommended)

1. Download the [`seerum-ai-legal-tools.mcpb`](https://github.com/saurrx/seerum-ai-legal-tools/releases) file
2. Double-click it
3. Claude Desktop will prompt you to install — click **Install**
4. Done. Open Cowork and start using it.

### Option B: Manual Setup

Add this to your Claude Desktop config (`Settings → Developer → Edit Config`):

```json
{
  "mcpServers": {
    "seerum-ai-legal-tools": {
      "command": "npx",
      "args": ["-y", "seerum-ai-legal-tools"]
    }
  }
}
```

Restart Claude Desktop. The tools will appear automatically.

> **npm package:** [`seerum-ai-legal-tools`](https://www.npmjs.com/package/seerum-ai-legal-tools)

---

## Try It

Open Claude Desktop → switch to **Cowork** → type any of these:

**New client onboarding:**
> New Premium member: Dr. Patel, non-physician investor, wants to open a med spa in California offering Botox, fillers, laser treatments, and microneedling. No entity formed. No medical director. 2 locations planned.

**Compliance package:**
> What consent forms and compliance documents does a Texas med spa need if they offer Botox, dermal fillers, IV therapy, and weight loss (semaglutide)?

**Agreement outline:**
> Draft a Medical Director Agreement outline for a med spa in New York. The medical director is Dr. James Wilson, board certified in dermatology, compensation $4,000/month.

**State comparison:**
> Compare the entity structure requirements for opening a med spa in Florida vs. California for a non-physician owner.

---

## What's In the Demo Database

| Category | Coverage |
|----------|----------|
| **States** | Texas, California, Florida, New York, Illinois |
| **Services** | Botox/neurotoxins, dermal fillers, IV therapy, microneedling, laser treatments, weight loss (GLP-1), chemical peels, PRP, hormone therapy, body contouring |
| **Agreement Types** | MSA, Medical Director Agreement, Employment Agreement, Independent Contractor Agreement, Membership Agreement, NDA |
| **Compliance Docs** | HIPAA (9 documents), OSHA (6 documents), General Operations (8 documents), Website Compliance (5 documents) |
| **Total Documents Mapped** | 114 |

Each state includes: ownership rules, CPOM doctrine analysis, medical director requirements, scope of practice for 5 provider types (MD/DO, NP, PA, RN, Aesthetician), key statute citations, entity formation steps, estimated timelines, and recent regulatory developments through 2026.

---

## What This Is — and What It Isn't

**This is a working proof-of-concept** built with sample data for 5 states and 10 services. It demonstrates the architecture and workflow.

**In production, this would include:**
- Full 50-state regulatory database
- Your complete 170+ template library with actual clause language
- Clio CRM integration (create matters, pull client data, assign tasks)
- Your proprietary compliance checklists and onboarding sequences
- Ongoing updates as regulations change

The sample data is accurate and well-researched but is not a substitute for attorney review. All outputs include a disclaimer noting this.

---

## The Three Tools

### 1. `analyze_new_client`
**Input:** State, owner type, business type, services planned, entity status, medical director status

**Output:** Complete intake analysis including CPOM doctrine assessment, entity structure recommendation, MSO requirement, medical director requirements with state-specific supervision rules, scope of practice for all provider types, key regulations with statute citations, estimated formation timeline, and membership tier recommendation

### 2. `build_compliance_package`
**Input:** State, services offered, membership tier

**Output:** Categorized checklist of every document the client needs — service-specific consent forms, clinical protocols, HIPAA compliance package, OSHA compliance package, operational documents, and website compliance items. Includes document count summary.

### 3. `draft_agreement_outline`
**Input:** Agreement type, client name, state, entity names, medical director info, compensation, services

**Output:** Structured agreement outline with section headers, populated key terms, and state-specific regulatory considerations. Covers Medical Director Agreements, Management Services Agreements, Employment Agreements, IC Agreements, Membership Agreements, and NDAs.

---

## Requirements

- Claude Desktop (macOS or Windows) — [download here](https://claude.ai/download)
- Claude Pro, Max, Team, or Enterprise subscription
- For the `.mcpb` install: nothing else needed
- For the npx install: Node.js 18+ installed

---

## Built By

**seerum.ai** — AI-native transformation for professional services firms.

We embed with teams, map workflows, and deploy AI systems that run in production.

[seerum.ai](https://seerum.ai) · [cal.com/seerumai](https://cal.com/seerumai)

---

*This tool is a demonstration. All legal analysis outputs are generated from sample data and are not legal advice. Outputs should always be reviewed by a licensed attorney before use.*
