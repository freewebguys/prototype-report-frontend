# Prototype Survival Report UI

Single-page React + Vite app that renders a Prototype Survival JSON report entirely in the browser. Users can upload a local JSON file to visualize the structural viability score, risks, summary narrative, and recommended next step without any backend or CLI dependency.

## Features

- Inter-styled layout inspired by the original static HTML report
- Local-only JSON upload via `FileReader` (no server round-trips)
- Structural viability score bar, stage pill, summary and next-step cards
- Risks table with clickable (placeholder) file paths
- Placeholder state so the page stays polished before data loads

## Getting Started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173). Click **Upload JSON** and select your Prototype Survival Report file. The UI parses the file in the browser and populates the report view.

## Expected JSON Shape

```json
{
  "structuralViabilityScore": 78,
  "stage": "Needs redesign",
  "summary": "Plain-language summary of the findings.",
  "recommendedNextStep": "Do the next thing.",
  "risks": [
    { "type": "Coupling", "filePath": "src/core/api.ts", "explanation": "Why this matters." }
  ]
}
```

All fields are optional—missing values fall back to descriptive placeholders so the UI remains demo-ready even with partial data.
