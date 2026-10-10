import { OcrPageData } from "../types/ocr";

export interface SampleDoc {
  id: string;
  name: string;
  description: string;
  fileSize: number;
  imperfections: string[];
  pages: OcrPageData[];
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: "sample-bill-of-lading",
    name: "Ocean_Bill_of_Lading_Manifest_Scan.pdf",
    description: "Multi-page maritime shipping document with uneven photocopy margins, rotated table, and blurred container seal numbers.",
    fileSize: 3180200,
    imperfections: [
      "Inconsistent margins & photocopy gutter shadow",
      "Smudged ISO container numbers & seal codes",
      "Complex nested shipping freight charges table",
      "Preserves 2-page sequence with terms on page 2"
    ],
    pages: [
      {
        pageNumber: 1,
        detectedOrientation: 0,
        skewAngleDegrees: -1.6,
        qualityScore: 82,
        blurDetected: true,
        contrastLevel: "medium",
        documentType: "Ocean Bill of Lading",
        title: "OCEAN BILL OF LADING & MULTIMODAL MANIFEST",
        engine: "Adobe PDF Services API (OCR & Sensei Extract)",
        isAdobeExtract: true,
        rawElementsCount: 48,
        pageGeometry: { widthPt: 612, heightPt: 792, rotation: 0 },
        summary: "Original negotiable maritime Bill of Lading #BOL-PAC-2026-9041 covering 12 intermodal shipping containers consigned to Apex Maritime Systems.",
        cleanMarkdown: `# OCEAN BILL OF LADING & MULTIMODAL MANIFEST
**B/L Number:** BOL-PAC-2026-9041  
**Vessel / Voyage:** MV Pacific Horizon / V.408W  
**Port of Loading:** Port of Singapore (SGSIN)  
**Port of Discharge:** Port of Los Angeles (USLAX)  
**Document Type:** Negotiable Maritime Transport Document (Page 1 of 2)  

---

### Commercial Entities & Routing
| Entity Role | Details |
| :--- | :--- |
| **Shipper / Exporter:** | Orient Precision Engineering Pte Ltd, 18 Jurong Port Road, Singapore |
| **Consignee:** | Apex Maritime Systems LLC, Terminal Gate 4B, Maritime Plaza, Suite 400 |
| **Notify Party:** | Pacific Customs Clearance Brokers Inc, Bayview Center, Long Beach CA |
| **Pre-Carriage by:** | Coastal Feeder 08 |
| **Place of Delivery:** | Los Angeles Intermodal Rail Depot |

---

### Container Cargo & Shipping Details
| Container # | Seal # | Pkgs | Description of Goods | Gross Weight | Measurement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MSCU-782190-4** | SL-98214 | 420 | High-Precision Maritime Telemetry Gear (Class 9) | 18,450 kg | 68.4 cbm |
| **TGHU-902411-2** | SL-98215 | 380 | Automated Vessel Propulsion Servo Spares | 16,800 kg | 64.2 cbm |
| **CMAU-128490-9** | SL-98216 | 600 | Heavy Duty Berth Lashing Cable Assemblies | 21,200 kg | 72.0 cbm |
| **MEDU-554109-0** | SL-98217 | 150 | Sealed Refrigerated Core Sensors (Temp -18°C) | 12,900 kg | 58.1 cbm |

---

### Freight Charges & Destination Currency
- **Ocean Freight (Prepaid):** $18,400.00 USD  
- **Terminal Handling Charge (THC):** $2,150.00 USD  
- **Bunker Adjustment Factor (BAF):** $1,620.00 USD  
- **Total Freight & Surcharges:** **$22,170.00 USD**  

---
*Signed for the Carrier: Pacific Horizon Lines Co. by Master J. R. Sterling*  
*Page 1 of 2 • Reconstructed with Adobe PDF Extract API (Table & Geometry Model)*`,
        blocks: [
          {
            type: "heading",
            text: "OCEAN BILL OF LADING & MULTIMODAL MANIFEST",
            box2d: [50, 60, 110, 850],
            confidence: 99.6,
            adobePath: "//Document/H1",
            boundsPt: [72, 720, 540, 750],
            readingOrder: 1,
          },
          {
            type: "paragraph",
            text: "B/L Number: BOL-PAC-2026-9041 | Vessel: MV Pacific Horizon / V.408W | Port of Loading: Singapore | Port of Discharge: Los Angeles",
            box2d: [120, 60, 160, 800],
            confidence: 98.8,
            adobePath: "//Document/P",
            boundsPt: [72, 670, 540, 700],
            readingOrder: 2,
          },
          {
            type: "heading",
            text: "Commercial Entities & Routing",
            box2d: [175, 60, 215, 500],
            confidence: 99.2,
            adobePath: "//Document/H2",
            boundsPt: [72, 630, 300, 655],
            readingOrder: 3,
          },
          {
            type: "paragraph",
            text: "Shipper: Orient Precision Engineering Pte Ltd | Consignee: Apex Maritime Systems LLC | Notify: Pacific Customs Brokers Inc",
            box2d: [220, 60, 290, 920],
            confidence: 98.4,
            adobePath: "//Document/P",
            boundsPt: [72, 560, 540, 620],
            readingOrder: 4,
          },
          {
            type: "table",
            text: "Container Cargo & Shipping Manifest (4 Units)",
            box2d: [310, 60, 640, 940],
            confidence: 99.4,
            adobePath: "//Document/Table",
            boundsPt: [72, 340, 540, 540],
            readingOrder: 5,
          },
          {
            type: "paragraph",
            text: "Freight & Surcharges: Ocean Freight: $18,400.00 | THC: $2,150.00 | Total: $22,170.00 USD (Prepaid)",
            box2d: [660, 60, 740, 920],
            confidence: 99.1,
            adobePath: "//Document/P",
            boundsPt: [72, 260, 540, 320],
            readingOrder: 6,
          },
          {
            type: "signature",
            text: "Signed for the Carrier: Pacific Horizon Lines Co. by Master J. R. Sterling",
            box2d: [760, 60, 840, 600],
            confidence: 97.5,
            adobePath: "//Document/P",
            boundsPt: [72, 180, 380, 240],
            readingOrder: 7,
          }
        ],
        tables: [
          {
            title: "Container Cargo & Shipping Manifest",
            headers: ["Container #", "Seal #", "Pkgs", "Description of Goods", "Gross Weight", "Measurement"],
            rows: [
              ["MSCU-782190-4", "SL-98214", "420", "High-Precision Maritime Telemetry Gear (Class 9)", "18,450 kg", "68.4 cbm"],
              ["TGHU-902411-2", "SL-98215", "380", "Automated Vessel Propulsion Servo Spares", "16,800 kg", "64.2 cbm"],
              ["CMAU-128490-9", "SL-98216", "600", "Heavy Duty Berth Lashing Cable Assemblies", "21,200 kg", "72.0 cbm"],
              ["MEDU-554109-0", "SL-98217", "150", "Sealed Refrigerated Core Sensors (Temp -18°C)", "12,900 kg", "58.1 cbm"]
            ],
            adobePath: "//Document/Table[1]",
            boundsPt: [72, 340, 540, 540]
          }
        ],
        confidenceScore: 99.4,
        correctionsMade: [
          { originalArtifact: "MSCU-782I90-4", correctedText: "MSCU-782190-4", reason: "Repaired ISO 6346 container checksum code" },
          { originalArtifact: "SL-982I4", correctedText: "SL-98214", reason: "De-blurred high security container seal number" },
          { originalArtifact: "Uneven margin scan (-1.6°)", correctedText: "Normalized to 72pt grid margins", reason: "Adobe page geometry alignment" }
        ],
        keyEntities: [
          { label: "B/L Number", value: "BOL-PAC-2026-9041", type: "reference", confidence: 99.8 },
          { label: "Vessel / Voyage", value: "MV Pacific Horizon / V.408W", type: "reference", confidence: 99.4 },
          { label: "Issue Date", value: "October 06, 2026", type: "date", confidence: 99.7 },
          { label: "Port of Loading", value: "Port of Singapore (SGSIN)", type: "entity", confidence: 99.5 },
          { label: "Port of Discharge", value: "Port of Los Angeles (USLAX)", type: "entity", confidence: 99.6 },
          { label: "Consignee", value: "Apex Maritime Systems LLC", type: "entity", confidence: 99.2 },
          { label: "Total Freight", value: "$22,170.00 USD", type: "currency", confidence: 99.9 }
        ],
        uncertainTokens: [
          {
            id: "unc-1",
            text: "SL-98214",
            confidence: 86,
            candidateAlternatives: ["SL-982I4", "SL-98214", "SL-98274"],
            context: "Seal # for container MSCU-782190-4",
            reason: "Photocopy shadow across vertical stroke of digit 1 vs I",
            status: "flagged"
          },
          {
            id: "unc-2",
            text: "MEDU-554109-0",
            confidence: 88,
            candidateAlternatives: ["MEDU-5541O9-0", "MEDU-554109-0"],
            context: "Refrigerated core sensor container code",
            reason: "Low contrast dot-matrix imprint between 0 and O",
            status: "flagged"
          }
        ]
      },
      {
        pageNumber: 2,
        detectedOrientation: 0,
        skewAngleDegrees: 0.8,
        qualityScore: 89,
        blurDetected: false,
        contrastLevel: "medium",
        documentType: "Ocean Bill of Lading (Terms & Conditions)",
        title: "STANDARD CONDITIONS OF CARRIAGE & CARRIER LIABILITY",
        engine: "Adobe PDF Services API (OCR & Sensei Extract)",
        isAdobeExtract: true,
        rawElementsCount: 36,
        pageGeometry: { widthPt: 612, heightPt: 792, rotation: 0 },
        summary: "Terms and conditions of carriage, Hague-Visby liability limitation rules, demurrage formulas, and port jurisdiction clauses.",
        cleanMarkdown: `# STANDARD CONDITIONS OF CARRIAGE & CARRIER LIABILITY
**B/L Reference:** BOL-PAC-2026-9041  
**Carrier:** Pacific Horizon Lines Co.  
**Jurisdiction:** Maritime Court of California, Central District  
**Document Page:** Page 2 of 2  

---

### Clause 1: Definitions & Paramount Clause
The terms and conditions shall take effect subject to the provisions of the International Convention for the Unification of Certain Rules of Law relating to Bills of Lading signed at Brussels (The Hague Rules) or Hague-Visby Amendments.

### Clause 2: Carrier's Limitation of Liability (Package Limitation)
In case of any loss or damage to cargo for which Carrier is adjudged legally liable, such compensation shall not exceed **$500.00 USD per package** or customary freight unit, unless higher value has been declared prior to shipment and noted on Page 1 with supplemental ad valorem freight paid.

### Clause 3: Demurrage & Free Time Allowances
1. **Inbound Terminal Free Time:** Five (5) calendar days from complete vessel discharge.  
2. **Tier 1 Demurrage:** $180.00 USD per 40ft container per day for days 1 to 5 following free time expiration.  
3. **Tier 2 Demurrage:** $350.00 USD per container per day thereafter until gate departure.  

### Clause 4: General Average & Both-to-Blame Collision
General Average shall be adjusted at any port or place at the option of the Carrier in accordance with York-Antwerp Rules 1994.

---
*End of Maritime Contract • Verified Page 2 of 2*`,
        blocks: [
          {
            type: "heading",
            text: "STANDARD CONDITIONS OF CARRIAGE & CARRIER LIABILITY",
            box2d: [50, 60, 110, 850],
            confidence: 99.7,
            adobePath: "//Document/H1",
            boundsPt: [72, 720, 540, 750],
            readingOrder: 1,
          },
          {
            type: "paragraph",
            text: "B/L Reference: BOL-PAC-2026-9041 | Carrier: Pacific Horizon Lines Co. | Document Page 2 of 2",
            box2d: [120, 60, 160, 700],
            confidence: 98.9,
            adobePath: "//Document/P",
            boundsPt: [72, 670, 540, 700],
            readingOrder: 2,
          },
          {
            type: "heading",
            text: "Clause 1: Definitions & Paramount Clause",
            box2d: [180, 60, 220, 600],
            confidence: 99.4,
            adobePath: "//Document/H2",
            boundsPt: [72, 620, 400, 645],
            readingOrder: 3,
          },
          {
            type: "paragraph",
            text: "The terms and conditions shall take effect subject to the provisions of the International Hague-Visby Convention rules.",
            box2d: [225, 60, 280, 920],
            confidence: 98.2,
            adobePath: "//Document/P",
            boundsPt: [72, 570, 540, 610],
            readingOrder: 4,
          },
          {
            type: "heading",
            text: "Clause 2: Carrier's Limitation of Liability ($500/package)",
            box2d: [300, 60, 340, 700],
            confidence: 99.3,
            adobePath: "//Document/H2",
            boundsPt: [72, 520, 480, 545],
            readingOrder: 5,
          },
          {
            type: "paragraph",
            text: "Compensation shall not exceed $500.00 USD per package or customary freight unit unless higher value is formally declared.",
            box2d: [345, 60, 410, 920],
            confidence: 98.7,
            adobePath: "//Document/P",
            boundsPt: [72, 460, 540, 510],
            readingOrder: 6,
          },
          {
            type: "heading",
            text: "Clause 3: Demurrage & Free Time Allowances",
            box2d: [430, 60, 470, 650],
            confidence: 99.1,
            adobePath: "//Document/H2",
            boundsPt: [72, 410, 450, 435],
            readingOrder: 7,
          },
          {
            type: "paragraph",
            text: "Inbound Terminal Free Time: 5 calendar days. Tier 1 Demurrage: $180/day. Tier 2 Demurrage: $350/day thereafter.",
            box2d: [475, 60, 540, 920],
            confidence: 98.8,
            adobePath: "//Document/P",
            boundsPt: [72, 350, 540, 400],
            readingOrder: 8,
          }
        ],
        tables: [],
        confidenceScore: 99.6,
        correctionsMade: [
          { originalArtifact: "Fine-print blurred clause text", correctedText: "Restored high-legibility digital typography", reason: "Adobe Sensei font classification" },
          { originalArtifact: "Broken two-column line wrap", correctedText: "Standardized reading sequence flow", reason: "Adobe reading order graph" }
        ]
      }
    ]
  },
  {
    id: "sample-invoice",
    name: "Tilted_Freight_Invoice_Scan_2026.pdf",
    description: "Poorly aligned freight bill with -3.2° tilt, low contrast, and blurred numbers.",
    fileSize: 1420500,
    imperfections: ["Tilted at -3.2° angle", "Photocopy noise & background graying", "Blurred item descriptions", "Partially illegible totals"],
    pages: [
      {
        pageNumber: 1,
        detectedOrientation: 0,
        skewAngleDegrees: -3.2,
        qualityScore: 78,
        blurDetected: true,
        contrastLevel: "low",
        documentType: "Commercial Tax Invoice",
        title: "Commercial Freight & Logistics Invoice",
        engine: "Adobe PDF Services API (OCR & Sensei Extract)",
        isAdobeExtract: true,
        rawElementsCount: 32,
        pageGeometry: { widthPt: 612, heightPt: 792, rotation: 0 },
        summary: "Maritime terminal freight invoice #FL-9042 totaling $12,450.00 for container clearance and storage.",
        cleanMarkdown: `# PACIFIC FREIGHT & TERMINAL LOGISTICS
**Official Tax Invoice & Port Clearance Statement**  
**Invoice No:** FL-9042-X  
**Issue Date:** October 06, 2026  
**Due Date:** November 05, 2026  
**Payment Status:** PENDING APPROVAL  

---

### Bill To
- **Company:** Apex Maritime Operations Ltd.
- **Representative:** Marcus Vance
- **Address:** Terminal Gate 4B, Maritime Plaza, Suite 400
- **Tax Registration:** US-EIN-9482104-A

---

### Description of Services
| Item # | Description | Units | Rate (USD) | Total Amount |
| :--- | :--- | :--- | :--- | :--- |
| 101 | Standard 40ft High-Cube Berth Clearance & Security | 8 Containers | $650.00 | $5,200.00 |
| 102 | Heavy Machinery Staging & Quay Lashing Inspections | 2 Containers | $950.00 | $1,900.00 |
| 103 | Customs Bonded Storage & Demurrage Shield (14 Days) | 1 Package | $3,450.00 | $3,450.00 |
| 104 | Digital Manifest Electronic Filing & Port Surcharge | Flat Rate | $850.00 | $850.00 |

---

### Financial Summary
- **Subtotal:** $11,400.00
- **Harbor Maintenance & Security Surcharge (9.2%):** $1,050.00
- **Total Due:** **$12,450.00 USD**

---
*Authorized Electronic Signature: Eleanor Vance (Harbor Accounts Controller)*  
*OCR De-skewing applied: Adjusted +3.2° clockwise. Repaired 4 blurred numeric digits.*`,
        blocks: [
          { type: "heading", text: "PACIFIC FREIGHT & TERMINAL LOGISTICS", box2d: [60, 80, 110, 800], confidence: 99, adobePath: "//Document/H1", boundsPt: [72, 710, 520, 740], readingOrder: 1 },
          { type: "paragraph", text: "Official Tax Invoice & Port Clearance Statement | Invoice No: FL-9042-X", box2d: [120, 80, 155, 750], confidence: 98, adobePath: "//Document/P", boundsPt: [72, 665, 520, 695], readingOrder: 2 },
          { type: "heading", text: "Bill To: Apex Maritime Operations Ltd.", box2d: [180, 80, 220, 600], confidence: 97, adobePath: "//Document/H2", boundsPt: [72, 620, 350, 645], readingOrder: 3 },
          { type: "paragraph", text: "Terminal Gate 4B, Maritime Plaza, Suite 400 | US-EIN-9482104-A", box2d: [225, 80, 260, 680], confidence: 96, adobePath: "//Document/P", boundsPt: [72, 580, 480, 610], readingOrder: 4 },
          { type: "table", text: "Itemized Port Services & Container Clearance", box2d: [290, 80, 630, 920], confidence: 99, adobePath: "//Document/Table", boundsPt: [72, 330, 540, 560], readingOrder: 5 },
          { type: "paragraph", text: "Subtotal: $11,400.00 | Total Due: $12,450.00 USD", box2d: [650, 480, 750, 920], confidence: 99, adobePath: "//Document/P", boundsPt: [320, 240, 540, 310], readingOrder: 6 }
        ],
        tables: [
          {
            title: "Itemized Port Services",
            headers: ["Item #", "Description", "Units", "Rate (USD)", "Total Amount"],
            rows: [
              ["101", "Standard 40ft High-Cube Berth Clearance & Security", "8 Containers", "$650.00", "$5,200.00"],
              ["102", "Heavy Machinery Staging & Quay Lashing Inspections", "2 Containers", "$950.00", "$1,900.00"],
              ["103", "Customs Bonded Storage & Demurrage Shield (14 Days)", "1 Package", "$3,450.00", "$3,450.00"],
              ["104", "Digital Manifest Electronic Filing & Port Surcharge", "Flat Rate", "$850.00", "$850.00"]
            ],
            adobePath: "//Document/Table[1]",
            boundsPt: [72, 330, 540, 560]
          }
        ],
        confidenceScore: 99.1,
        correctionsMade: [
          { originalArtifact: "FL-9O42-X", correctedText: "FL-9042-X", reason: "Replaced glyph 'O' with digit 0 in invoice code" },
          { originalArtifact: "Demurr4ge Shield", correctedText: "Demurrage Shield", reason: "Corrected blurry digit-as-letter smudge" },
          { originalArtifact: "$12,4S0.00", correctedText: "$12,450.00", reason: "Corrected 5 misread as S via arithmetic verification" }
        ]
      }
    ]
  },
  {
    id: "sample-contract",
    name: "Rotated_Legal_Agreement_Scan.pdf",
    description: "Multi-page legal agreement scanned rotated 90° sideways with folded corner shadows.",
    fileSize: 2840100,
    imperfections: ["Rotated 90° clockwise by scanner", "Folded top corner shadow", "Fine-print terms degradation", "Stamper overlay bleed-through"],
    pages: [
      {
        pageNumber: 1,
        detectedOrientation: 90,
        skewAngleDegrees: 1.4,
        qualityScore: 84,
        blurDetected: false,
        contrastLevel: "medium",
        documentType: "Legal Contract / Agreement",
        title: "Master Maritime Logistics & Service Agreement",
        engine: "Adobe PDF Services API (OCR & Sensei Extract)",
        isAdobeExtract: true,
        rawElementsCount: 28,
        pageGeometry: { widthPt: 612, heightPt: 792, rotation: 90 },
        summary: "Binding multi-party service agreement defining container allocation liability and insurance indemnification.",
        cleanMarkdown: `# MASTER MARITIME LOGISTICS & SERVICE AGREEMENT
**Document Reference:** MLA-2026-OCT-88  
**Effective Date:** October 01, 2026  
**Jurisdiction:** Maritime Commercial Court, Southern District  

---

### Recitals
**BETWEEN:**  
1. **PACIFIC DOCKLINE SYSTEMS INC.** ("Operator"), organized under the commercial laws of California.  
2. **GLOBAL FREIGHT FORWARDERS CORP.** ("Client"), having its primary trading house in Rotterdam.  

**WHEREAS**, Operator maintains certified terminal berth clearance, and Client desires expedited port entry for high-cube container cargo.

---

### Section 1: Scope of Operations & Priority Access
1.1 **Berth Scheduling**: The Operator guarantees preferential docking within four (4) hours of vessel arrival notification.  
1.2 **Cold Storage & Refrigerated Cargo**: Any refrigerated units shall receive unbroken backup power telemetry with maximum temperature deviation of ±0.5°C.  
1.3 **Hazardous Materials**: Client warrants all Class 3 and Class 8 hazardous freight is placarded in strict accordance with IMO Maritime Code.

---

### Section 2: Limitation of Liability & Force Majeure
2.1 Except in events of demonstrated gross negligence, Operator's financial exposure for containerized cargo damage is capped at **$2,500.00 per TEU**.  
2.2 Neither party shall bear default for delays precipitated by typhoon warnings, harbor strikes, or automated customs gateway server outages.

---

### Signatures & Ratification
- **For Operator:** *David K. O'Connor*, Managing VP  
- **For Client:** *Elena Rostova*, Logistics Director  
- **Date Sealed:** *October 09, 2026*`,
        blocks: [
          { type: "heading", text: "MASTER MARITIME LOGISTICS & SERVICE AGREEMENT", box2d: [60, 70, 110, 850], confidence: 99, adobePath: "//Document/H1", boundsPt: [72, 715, 540, 745], readingOrder: 1 },
          { type: "paragraph", text: "Document Reference: MLA-2026-OCT-88 | Effective Date: October 01, 2026", box2d: [120, 70, 155, 780], confidence: 98, adobePath: "//Document/P", boundsPt: [72, 670, 540, 695], readingOrder: 2 },
          { type: "heading", text: "Recitals & Commercial Parties", box2d: [175, 70, 215, 500], confidence: 99, adobePath: "//Document/H2", boundsPt: [72, 625, 340, 650], readingOrder: 3 },
          { type: "paragraph", text: "BETWEEN: 1. Pacific Dockline Systems Inc. ('Operator') and 2. Global Freight Forwarders Corp. ('Client')", box2d: [220, 70, 310, 920], confidence: 98, adobePath: "//Document/P", boundsPt: [72, 550, 540, 610], readingOrder: 4 },
          { type: "heading", text: "Section 1: Scope of Operations & Priority Access", box2d: [330, 70, 370, 700], confidence: 99, adobePath: "//Document/H2", boundsPt: [72, 500, 460, 525], readingOrder: 5 },
          { type: "paragraph", text: "1.1 Berth Scheduling: Preferential docking within four (4) hours of vessel arrival notification.", box2d: [380, 70, 440, 920], confidence: 97, adobePath: "//Document/P", boundsPt: [72, 440, 540, 485], readingOrder: 6 },
          { type: "paragraph", text: "1.2 Cold Storage: Unbroken backup power telemetry with maximum temperature deviation of ±0.5°C.", box2d: [450, 70, 510, 920], confidence: 96, adobePath: "//Document/P", boundsPt: [72, 380, 540, 425], readingOrder: 7 },
          { type: "heading", text: "Section 2: Limitation of Liability & Force Majeure", box2d: [530, 70, 570, 680], confidence: 99, adobePath: "//Document/H2", boundsPt: [72, 330, 470, 355], readingOrder: 8 },
          { type: "paragraph", text: "2.1 Financial exposure capped at $2,500.00 per TEU containerized unit.", box2d: [580, 70, 660, 920], confidence: 98, adobePath: "//Document/P", boundsPt: [72, 260, 540, 315], readingOrder: 9 },
          { type: "signature", text: "Signatures: David K. O'Connor & Elena Rostova | Date Sealed: October 09, 2026", box2d: [780, 70, 880, 850], confidence: 95, adobePath: "//Document/P", boundsPt: [72, 160, 500, 220], readingOrder: 10 }
        ],
        tables: [],
        confidenceScore: 99.4,
        correctionsMade: [
          { originalArtifact: "90° Sideways Scan", correctedText: "Auto-Rotated to 0° Normal", reason: "Detected 90° clockwise scan orientation" },
          { originalArtifact: "MLA-2O26-OCT-88", correctedText: "MLA-2026-OCT-88", reason: "Repaired blurred serial character" }
        ]
      }
    ]
  }
];
