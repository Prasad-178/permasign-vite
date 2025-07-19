
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
  }
};
