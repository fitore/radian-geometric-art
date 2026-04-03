# Radian v2 — Vision Spike: Claude Code Setup Prompt

**Paste this into Claude Code as your first message. Ensure all three files are in your project directory first.**

---

## Files required in project

```
radian-v2-spike/
├── docs/
│   ├── radian-v2-PRD.md
│   └── radian-vision-spike.md
└── spike/
    └── test-images.json        ← Pre-populated with 15 images + ground truth
```

---

## Prompt

You are a principal engineer running a feasibility spike for Radian, 
a sacred geometry collection app. Before doing anything else, read 
all three of these files completely, in this order:

1. @spike/test-images.json — Read this FIRST. It contains 15 
   pre-selected test images from Wikimedia Commons, each with a 
   direct URL, license, image type classification, and complete 
   ground truth across all five tag groups (constructionMethod, 
   tradition, patternType, symmetry, proportion). It also includes 
   a coverage matrix and per-image notes explaining what makes each 
   image a useful test case. Do NOT search for or substitute 
   different images. Use exactly these 15.

2. @docs/radian-vision-spike.md — The full spike plan. It defines 
   the system prompt for Claude Vision (Part 1), the test protocol 
   and scoring rubric (Parts 2-3), the edge detection feasibility 
   plan (Part 4), and prompt iteration strategies (Part 5). The 
   test-images.json file already satisfies the image gathering 
   requirements in Part 2 — skip that step.

3. @docs/radian-v2-PRD.md — The product requirements document. 
   Read Section 6 (Pattern Analysis) and Section 14 (API 
   Integration Layer) for context on how the spike results will 
   be used. You do not need to read the full PRD for this spike, 
   but it is here for reference.

After reading all three files, confirm your understanding of:
- The system prompt you will use (from spike doc Part 1)
- The 15 test images and their ground truth (from test-images.json)
- The scoring rubric: MATCH (+1), PARTIAL (+0.5), HONEST MISS 
  (+0.25), MISS with high confidence (-0.5), MISS with low 
  confidence (0)
- The decision thresholds: ≥70% greenlight, 50-70% iterate, 
  <50% descope

Then execute this plan:

1. Create a `spike/` directory for all spike work (if it doesn't 
   already exist — test-images.json should already be there)

2. Write a Node.js script (`spike/run-spike.js`) that:
   - Reads test-images.json to get all 15 image URLs and ground truth
   - Contains the full system prompt from Part 1 of the spike doc
   - For each image: fetches the image from its URL, converts to 
     base64, sends to Claude API (claude-sonnet-4-20250514) with 
     the system prompt
   - Parses the JSON response
   - Compares Claude's classifications against the ground truth 
     using the scoring rubric
   - Logs per-image results with scores to spike/results.json
   - Outputs a summary scorecard at the end

3. Run the spike across all 15 test images sequentially (respect 
   API rate limits — add a 1-second delay between calls)

4. After all images are processed, generate:
   - `spike/results.json` — raw results per image
   - `spike/scorecard.md` — formatted scorecard table with 
     per-field accuracy and overall accuracy
   - `spike/SPIKE-RESULTS.md` — findings summary including:
     - Overall accuracy vs. decision thresholds
     - Per-field accuracy breakdown (which tag groups are strong 
       vs. weak)
     - Failure pattern analysis (what types of images or 
       classifications consistently fail)
     - Confidence calibration assessment (is Claude overconfident 
       or well-calibrated?)
     - Architecture recommendation per Part 4 of the spike doc
     - Go/no-go recommendation with rationale

Install the Anthropic SDK before starting:
```
npm init -y && npm install @anthropic-ai/sdk node-fetch
```

My API key is stored in the environment variable ANTHROPIC_API_KEY.

Important: Start by reading all three files and confirming your 
understanding. Do not write code until you have confirmed the 
test protocol.