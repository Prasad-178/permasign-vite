
export interface Template {
  name: string;
  description: string;
  roles: string[];
  permissions: {
    [role: string]: string[];
  };
}

// Hardcoded templates defined in the frontend
export const templates: { [name: string]: Template } = {
  "Startup Fundraising": {
    name: "Startup Fundraising",
    description: "A standard set of roles and documents for a startup raising a seed round.",
    roles: ["Investor", "Auditor", "Vendor", "Customer"],
    permissions: {
      "founder": [
        "Cap Table", "Founders Agreement",
        "Board Resolutions", "Registration Certificates", "Licenses & Certifications", "Team Bios"
      ],
      "Investor": ["Term Sheet", "Shareholders Agreement", "SAFE / Convertible Notes"],
      "Auditor": ["Audit Report"],
      "Vendor": ["Procurement Contract", "Quality Assurance Agreement"],
      "Customer": ["Master Service Agreement", "Statement of Work"]
    }
  },
  "Due Diligence": {
    name: "Due Diligence",
    description: "A comprehensive template for M&A due diligence processes.",
    roles: ["Acquirer", "Legal Team", "Financial Advisor"],
     permissions: {
      "founder": [
        "Pitch Deck", "Financial Statements", "Cap Table", "Founders Agreement",
        "Board Resolution", "Registration Certificates", "Licenses & Certifications",
        "Team Bios", "Intellectual Property", "Material Contracts"
      ],
      "Acquirer": ["Pitch Deck", "Financial Statements", "Cap Table", "Material Contracts", "Intellectual Property"],
      "Legal Team": ["Founders Agreement", "Registration Certificates", "Board Resolution", "Intellectual Property", "Material Contracts"],
      "Financial Advisor": ["Financial Statements", "Cap Table"]
    }
  },
  "Real Estate": {
    name: "Real Estate",
    description: "A template for managing documents related to real estate transactions.",
    roles: ["Buyer", "Seller", "Agent", "Lawyer"],
    permissions: {
        "founder": ["Property Deed", "Title Report", "Survey Plan", "Tax Records"],
        "Buyer": ["Purchase Agreement", "Inspection Report", "Loan Application"],
        "Seller": ["Listing Agreement", "Disclosure Statement"],
        "Agent": ["Commission Agreement"],
        "Lawyer": ["Legal Opinion", "Closing Documents"]
    }
  },
  "Intellectual Property": {
      name: "Intellectual Property",
      description: "A template for managing intellectual property assets and agreements.",
      roles: ["Inventor", "Patent Attorney", "Licensee"],
      permissions: {
          "founder": ["Patent Application", "Trademark Registration", "Copyright Certificate"],
          "Inventor": ["Invention Disclosure Form"],
          "Patent Attorney": ["Prior Art Search Report", "Office Action Response"],
          "Licensee": ["Licensing Agreement", "Royalty Statement"]
      }
  },
  "DAO Governance": {
    name: "DAO Governance",
    description: "A template for DAOs to manage proposals, voting, and treasury operations.",
    roles: ["Core Contributor", "Token Holder", "Treasury Council"],
    permissions: {
        "founder": ["DAO Charter", "Governance Framework", "Initial Treasury Allocation"],
        "Core Contributor": ["Improvement Proposals", "Project Milestones", "Contributor Agreements"],
        "Token Holder": ["Voting Records", "Snapshot Proposals"],
        "Treasury Council": ["Treasury-related Financial Statements", "Approved Budgets", "Grant Agreements"]
    }
  },
  "Web3 Grants Program": {
      name: "Web3 Grants Program",
      description: "Manage grant applications, reviews, and milestone approvals for a Web3 ecosystem.",
      roles: ["Grantee", "Review Committee", "Finance Team"],
      permissions: {
          "founder": ["Grants Program Policy", "Budget Allocation", "Committee Mandate"],
          "Grantee": ["Grant Application", "Milestone Reports", "Proof of Completion"],
          "Review Committee": ["Application Reviews", "Voting on Grants", "Feedback Forms"],
          "Finance Team": ["Payment Confirmations", "Fund-related Financial Statements"]
      }
  }
};
