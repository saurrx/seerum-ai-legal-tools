#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load knowledge base
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB = JSON.parse(readFileSync(join(__dirname, "../data/knowledge-base.json"), "utf-8"));

// Create MCP server
const server = new McpServer({
  name: "seerum-ai-legal-tools",
  version: "1.0.0",
});

// Helper: list valid service keys for error messages
function validServiceKeys() {
  return Object.entries(DB.services_to_documents)
    .map(([key, val]) => `  - ${key} → ${val.display_name}`)
    .join("\n");
}

// --- TOOL 0: list_available_options ---
server.tool(
  "list_available_options",
  "List all valid states, service types, and template types available in the knowledge base. Call this first to understand what options are available before using other tools.",
  {},
  async () => {
    const states = Object.entries(DB.states)
      .map(([key, val]) => `  - ${key} → ${val.name}`)
      .join("\n");

    const services = validServiceKeys();

    const templates = Object.entries(DB.template_types)
      .map(([key, val]) => `  - ${key} → ${val.display_name}`)
      .join("\n");

    const ownerTypes = [
      "  - physician_md_do → Physician (MD/DO)",
      "  - nurse_practitioner_np → Nurse Practitioner (NP)",
      "  - physician_assistant_pa → Physician Assistant (PA)",
      "  - registered_nurse_rn → Registered Nurse (RN)",
      "  - non_medical_entrepreneur → Non-Medical Entrepreneur"
    ].join("\n");

    const businessTypes = [
      "  - med_spa → Medical Spa",
      "  - iv_hydration → IV Hydration Bar",
      "  - wellness_clinic → Wellness Clinic",
      "  - mental_health → Mental Health Practice",
      "  - trt_clinic → TRT / Hormone Clinic"
    ].join("\n");

    const output = `## Available Options in Lengea Knowledge Base

### States (${Object.keys(DB.states).length})
${states}

### Services (${Object.keys(DB.services_to_documents).length})
${services}

### Template Types (${Object.keys(DB.template_types).length})
${templates}

### Owner Types
${ownerTypes}

### Business Types
${businessTypes}

### Membership Tiers
  - basic → Basic ($399/mo)
  - premium → Premium ($499/mo)
  - growth_accelerator → Growth Accelerator ($999/mo)`;

    return { content: [{ type: "text", text: output }] };
  }
);

// --- TOOL 1: analyze_new_client ---
server.tool(
  "analyze_new_client",
  "Analyze a new med spa client's situation and provide state-specific entity structure recommendations, MSO requirements, medical director guidance, scope of practice rules, and an onboarding roadmap.",
  {
    state: z.enum(["texas", "california", "florida", "new_york", "illinois"])
      .describe("State where the med spa will operate"),
    owner_type: z.enum(["physician_md_do", "nurse_practitioner_np", "physician_assistant_pa", "registered_nurse_rn", "non_medical_entrepreneur"])
      .describe("Professional background of the owner"),
    business_type: z.enum(["med_spa", "iv_hydration", "wellness_clinic", "mental_health", "trt_clinic"])
      .describe("Type of healthcare practice"),
    services: z.array(z.string())
      .describe("Planned services (e.g., ['neurotoxins_botox', 'dermal_fillers', 'iv_therapy']). Call list_available_options to see valid service keys."),
    has_entity_formed: z.boolean().describe("Whether the client already has a business entity"),
    has_medical_director: z.boolean().describe("Whether the client already has a medical director"),
    num_locations: z.number().describe("Number of planned locations"),
    has_partners: z.boolean().describe("Whether there are partners or investors"),
    target_open_date: z.string().optional().describe("Target date to open (e.g., '90 days')")
  },
  async (input) => {
    const stateData = DB.states[input.state];
    if (!stateData) {
      return { content: [{ type: "text", text: `State "${input.state}" not found in database.` }] };
    }

    // Validate services and collect unknown ones
    const unknownServices = [];
    for (const svc of input.services) {
      if (!DB.services_to_documents[svc]) {
        unknownServices.push(svc);
      }
    }

    // Determine if MSO is needed
    const needsMSO = stateData.cpom_doctrine &&
      !["physician_md_do"].includes(input.owner_type);

    // Build entity recommendation
    let entityRec;
    if (input.owner_type === "physician_md_do") {
      entityRec = `Direct ownership via ${stateData.ownership.physician_entity_types.join(" or ")}`;
    } else if (needsMSO) {
      entityRec = stateData.ownership.non_physician_path;
    } else {
      entityRec = `Direct ownership via LLC. MSO structure not required by ${stateData.name} but may be advisable for liability protection.`;
    }

    // Count services to recommend membership tier
    let membershipRec;
    if (input.num_locations >= 3 || input.has_partners) {
      membershipRec = "Growth Accelerator ($999/mo) — multi-location or M&A needs, $12K prepaid hours, 150 templates";
    } else if (input.services.length >= 3 || needsMSO) {
      membershipRec = "Premium ($499/mo) — MSO/MSA formation + comprehensive compliance package, $6K prepaid hours, 100 templates";
    } else {
      membershipRec = "Basic ($399/mo) — single-owner, simpler formation, $5K prepaid hours, 20 templates";
    }

    // Build the full analysis text
    let analysis = `
## New Client Intake Analysis

### Client Profile
- **State:** ${stateData.name}
- **Owner Type:** ${input.owner_type.replace(/_/g, " ").toUpperCase()}
- **Business Type:** ${input.business_type.replace(/_/g, " ")}
- **Planned Services:** ${input.services.map(s => DB.services_to_documents[s]?.display_name || s).join(", ")}
- **Locations:** ${input.num_locations}
- **Entity Formed:** ${input.has_entity_formed ? "Yes" : "No"}
- **Medical Director:** ${input.has_medical_director ? "Yes" : "No"}

### Corporate Practice of Medicine Analysis
- **CPOM Doctrine in ${stateData.name}:** ${stateData.cpom_doctrine ? "YES — enforced" : "NO — not strictly enforced"}
- ${stateData.cpom_description}

### Entity Structure Recommendation
- **MSO Required:** ${needsMSO ? "YES" : "NO"}
- **Recommended Structure:** ${entityRec}

### Medical Director Requirements
- **Required:** ${stateData.medical_director.required ? "YES" : "NO"}
- **Who Qualifies:** ${stateData.medical_director.who_qualifies}
- **Supervision Level:** ${stateData.medical_director.supervision_level}
- **Geographic Restriction:** ${stateData.medical_director.geographic_restriction}

### Scope of Practice Summary (${stateData.name})
${Object.entries(stateData.scope_of_practice).map(([role, data]) =>
  `**${role.replace(/_/g, " ").toUpperCase()}:**\n- Can perform: ${data.can_perform.join("; ")}\n- Supervision: ${data.supervision_required}\n${data.notes ? `- Note: ${data.notes}` : ""}`
).join("\n\n")}

### Key Regulations to Flag
${stateData.key_regulations.map(r => `- ${r}`).join("\n")}

### Estimated Timeline
- **Entity Formation:** ${stateData.entity_formation.estimated_timeline}
- **Key Filings Required:** ${stateData.entity_formation.key_filings.join(", ")}

### Membership Recommendation
${membershipRec}

### Recommended Next Steps
1. ${!input.has_entity_formed ? `Form ${needsMSO ? "two entities: MSO (LLC) + Professional Entity" : "business entity"} in ${stateData.name}` : "Review existing entity structure for compliance"}
2. ${!input.has_medical_director ? "Identify and onboard a qualified medical director" : "Review existing medical director agreement for compliance"}
3. Execute Management Services Agreement ${needsMSO ? "(required for MSO structure)" : "(if applicable)"}
4. Assemble compliance package — consent forms, HIPAA, OSHA
5. Draft staff contracts for all clinical hires
6. Complete website compliance review

### Recent Developments in ${stateData.name}
${stateData.recent_developments.map(r => `- ${r}`).join("\n")}

---
*This analysis is generated from sample data for demonstration purposes. Production analysis would use Lengea's proprietary state-by-state compliance database reviewed by licensed attorneys.*`.trim();

    // Append unknown service warning if any
    if (unknownServices.length > 0) {
      analysis += `\n\n---\n**Note:** The following service keys were not recognized: ${unknownServices.join(", ")}\n\nValid service keys are:\n${validServiceKeys()}`;
    }

    return { content: [{ type: "text", text: analysis }] };
  }
);

// --- TOOL 2: build_compliance_package ---
server.tool(
  "build_compliance_package",
  "Build a complete compliance document package for a med spa based on services offered. Returns categorized lists of consent forms, HIPAA docs, OSHA docs, and operational documents needed.",
  {
    state: z.enum(["texas", "california", "florida", "new_york", "illinois"])
      .describe("State where the med spa operates"),
    services: z.array(z.string())
      .describe("Services offered (e.g., ['neurotoxins_botox', 'dermal_fillers', 'iv_therapy']). Call list_available_options to see valid service keys."),
    membership_tier: z.enum(["basic", "premium", "growth_accelerator"])
      .describe("Client's membership tier")
  },
  async (input) => {
    // Collect all service-specific documents
    const consentForms = [];
    const complianceDocs = [];
    const staffReqs = [];
    const unknownServices = [];

    for (const svc of input.services) {
      const svcData = DB.services_to_documents[svc];
      if (svcData) {
        consentForms.push({
          service: svcData.display_name,
          documents: svcData.required_documents
        });
        complianceDocs.push({
          service: svcData.display_name,
          documents: svcData.compliance_documents
        });
        staffReqs.push({
          service: svcData.display_name,
          requirement: svcData.staff_requirements
        });
      } else {
        unknownServices.push(svc);
      }
    }

    // Build output text
    let output = `
## Compliance Document Package — ${DB.states[input.state]?.name || input.state}

### Service-Specific Consent Forms Required

${consentForms.map(cf => `**${cf.service}:**\n${cf.documents.map(d => `- [ ] ${d}`).join("\n")}`).join("\n\n")}

### Service-Specific Clinical Protocols & Compliance

${complianceDocs.map(cd => `**${cd.service}:**\n${cd.documents.map(d => `- [ ] ${d}`).join("\n")}`).join("\n\n")}

### Standard HIPAA Compliance Package
${DB.standard_compliance_package.hipaa.documents.map(d => `- [ ] ${d}`).join("\n")}

### Standard OSHA Compliance Package
${DB.standard_compliance_package.osha.documents.map(d => `- [ ] ${d}`).join("\n")}

### General Operations Documents
${DB.standard_compliance_package.general_operations.documents.map(d => `- [ ] ${d}`).join("\n")}

### Website Compliance
${DB.standard_compliance_package.website.documents.map(d => `- [ ] ${d}`).join("\n")}

### Staffing Requirements by Service
${staffReqs.map(sr => `- **${sr.service}:** ${sr.requirement}`).join("\n")}

### Document Count Summary
- Consent Forms: ${consentForms.reduce((acc, cf) => acc + cf.documents.length, 0)}
- Clinical Protocols: ${complianceDocs.reduce((acc, cd) => acc + cd.documents.length, 0)}
- HIPAA Documents: ${DB.standard_compliance_package.hipaa.documents.length}
- OSHA Documents: ${DB.standard_compliance_package.osha.documents.length}
- Operational Documents: ${DB.standard_compliance_package.general_operations.documents.length}
- Website Compliance: ${DB.standard_compliance_package.website.documents.length}
- **TOTAL: ${consentForms.reduce((acc, cf) => acc + cf.documents.length, 0) + complianceDocs.reduce((acc, cd) => acc + cd.documents.length, 0) + DB.standard_compliance_package.hipaa.documents.length + DB.standard_compliance_package.osha.documents.length + DB.standard_compliance_package.general_operations.documents.length + DB.standard_compliance_package.website.documents.length} documents**

---
*Sample compliance package for demonstration. Production packages would include Lengea's proprietary templates customized for ${DB.states[input.state]?.name || input.state} regulations.*`.trim();

    // Append unknown service warning if any
    if (unknownServices.length > 0) {
      output += `\n\n---\n**Note:** The following service keys were not recognized and were skipped: ${unknownServices.join(", ")}\n\nValid service keys are:\n${validServiceKeys()}`;
    }

    return { content: [{ type: "text", text: output }] };
  }
);

// --- TOOL 3: draft_agreement_outline ---
server.tool(
  "draft_agreement_outline",
  "Generate a structured outline for a legal agreement (Medical Director Agreement, MSA, Employment Agreement, etc.) populated with client-specific data. Returns section headers, key terms, and state-specific clauses to include.",
  {
    template_type: z.enum([
      "management_services_agreement",
      "medical_director_agreement",
      "employment_agreement",
      "independent_contractor_agreement",
      "membership_agreement",
      "nda_mutual"
    ]).describe("Type of agreement to draft"),
    client_data: z.object({
      client_name: z.string().describe("Client/company name"),
      state: z.string().describe("State of operation"),
      entity_name: z.string().optional().describe("Name of the professional entity (PC/PLLC)"),
      mso_name: z.string().optional().describe("Name of the MSO entity"),
      medical_director_name: z.string().optional().describe("Medical director's name"),
      medical_director_specialty: z.string().optional().describe("Medical director's specialty"),
      compensation: z.string().optional().describe("Compensation terms"),
      services_offered: z.array(z.string()).optional().describe("Services the practice will offer"),
      additional_notes: z.string().optional()
    }).describe("Client-specific data to populate the agreement")
  },
  async (input) => {
    const template = DB.template_types[input.template_type];
    if (!template) {
      return { content: [{ type: "text", text: `Template type "${input.template_type}" not found.` }] };
    }

    const stateData = DB.states[input.client_data.state] || null;
    const cd = input.client_data;

    // Check for unknown services in services_offered
    const unknownServices = [];
    if (cd.services_offered) {
      for (const svc of cd.services_offered) {
        if (!DB.services_to_documents[svc]) {
          unknownServices.push(svc);
        }
      }
    }

    let output = `
## ${template.display_name} — DRAFT OUTLINE

**Prepared for:** ${cd.client_name}
**State:** ${stateData?.name || cd.state}
**Template Type:** ${template.display_name}

### Document Description
${template.description}

### When This Document Is Needed
${template.when_needed}

### Sections to Include

${template.key_sections.map((section, i) => `${i + 1}. **${section}**`).join("\n")}

### Key Terms to Populate

| Field | Value |
|-------|-------|
| Client/Company Name | ${cd.client_name || "[TO BE COMPLETED]"} |
| State | ${stateData?.name || cd.state || "[TO BE COMPLETED]"} |
| Professional Entity | ${cd.entity_name || "[TO BE COMPLETED]"} |
| MSO Entity | ${cd.mso_name || "[TO BE COMPLETED — if MSO structure]"} |
${input.template_type === "medical_director_agreement" ? `| Medical Director | ${cd.medical_director_name || "[TO BE COMPLETED]"} |
| Specialty | ${cd.medical_director_specialty || "[TO BE COMPLETED]"} |
| Compensation | ${cd.compensation || "[TO BE COMPLETED]"} |` : ""}
| Services | ${cd.services_offered?.map(s => DB.services_to_documents[s]?.display_name || s).join(", ") || "[TO BE COMPLETED]"} |

### State-Specific Considerations for ${stateData?.name || cd.state}
${stateData ? stateData.key_regulations.map(r => `- ${r}`).join("\n") : "- [State-specific regulations to be researched]"}

${stateData?.cpom_doctrine ? `### CPOM Compliance Note
This agreement must ensure that the MSO does not interfere with clinical decision-making. ${stateData.cpom_description}` : ""}

### Estimated Typical Price Range
${template.typical_price_range}

### State-Specific Customization Required
${template.state_customization_needed ? "YES — This document must be customized for " + (stateData?.name || cd.state) + " regulations before use." : "Minimal state-specific customization needed."}

---
*This is a structural outline for demonstration purposes only. The actual agreement would be drafted by Lengea attorneys using proprietary templates customized for ${stateData?.name || cd.state} law. This outline is NOT a substitute for legal counsel.*`.trim();

    // Append unknown service warning if any
    if (unknownServices.length > 0) {
      output += `\n\n---\n**Note:** The following service keys were not recognized: ${unknownServices.join(", ")}\n\nValid service keys are:\n${validServiceKeys()}`;
    }

    return { content: [{ type: "text", text: output }] };
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
