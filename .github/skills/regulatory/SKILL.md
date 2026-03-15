# /regulated — Regulated Industry Overlay

This skill activates a compliance constraint layer on top of any active skill (most commonly `/team`). It does not replace roles — it adds a mandatory filter that every role runs their output through before responding.

**Invoke alongside another skill:** `/team /regulated` or mention "regulated context" in your prompt.

---

## WHEN TO USE

Activate this overlay when the work involves any of:
- Financial services, healthcare, insurance, or government/defense systems
- Data that triggers compliance obligations (PII, financial records, health data, audit trails)
- Agentic AI workflows where a human must remain in the decision loop
- Systems that will be reviewed by auditors, regulators, or oversight bodies
- Procurement or acquisition contexts where provenance of decisions matters

---

## THE OVERLAY: THREE LENSES

Each role applies their standard process first, then runs their output through the relevant lens before finalizing.

---

### 🗂️ PM — Compliance as Competitive Moat

After completing the standard competitive scan and requirements, add:

**Regulatory surface scan:**
- What compliance obligations does this feature touch? (list them explicitly — don't assume they're obvious)
- Which competitors treat compliance as a cost center vs. a differentiator?
- Is there a "compliant by design" positioning opportunity here?

**Requirement additions under this overlay:**
- **Must-have:** Auditability of every consequential decision (who approved what, when, with what inputs)
- **Must-have:** Explicit human sign-off points — map them in the journey before writing a single requirement
- **Should-have:** Compliance evidence that is useful to auditors, not just checkboxes for internal teams
- **Won't-have (this version):** Fully automated consequential decisions with no human override path

---

### ⚙️ PE — Audit-First Architecture

After completing the standard systems audit, add:

**Compliance architecture check — flag immediately if any proposed approach:**
- Produces no machine-readable audit log of AI-assisted decisions
- Conflates AI confidence score with human approval (they are different events — log them separately)
- Makes it hard to reconstruct "what did the model see, what did it output, what did the human decide" for any given transaction
- Stores audit data in a format that requires significant transformation before an auditor can read it

**Audit log minimum schema** (include in CLAUDE.md UPDATE when relevant):
```
{
  event_id:        string,        // immutable, globally unique
  timestamp:       ISO8601,       // when the event occurred
  actor_type:      "ai" | "human",
  actor_id:        string,        // model version or user ID
  action:          string,        // what was decided or recommended
  inputs_hash:     string,        // hash of inputs the model/human saw
  confidence:      float | null,  // AI only; null for human decisions
  provenance:      string[],      // source IDs that informed the decision
  human_approved:  boolean | null,// null until a human acts
  approved_by:     string | null, // user ID of approving human
  approved_at:     ISO8601 | null
}
```

**Confidence scoring rule:** Display confidence with explicit provenance, not as a single opaque score. "87% — based on 3 matched sources" is acceptable. "87%" alone is not.

---

### 🎨 UX — The Two Critical Gaps

After completing the standard journey map, add focus to:

**Gap 1 — Post-proposal / pre-decision moment:**
This is where AI recommendation hands off to human judgment. Most systems design the AI output well and the downstream workflow adequately — and completely neglect this moment. Design it explicitly:
- What does the human see?
- What context do they need to make a genuinely informed decision (not just rubber-stamp)?
- What does "I disagree with this recommendation" look like as an interaction?
- How is their decision — and their reasoning — captured?

**Gap 2 — Downstream audit review moment:**
Auditors and oversight reviewers are users too. Map their journey:
- What are they trying to reconstruct?
- What does the evidence package look like?
- Where does the current design make their job harder than it needs to be?

**Non-digital moments (regulated context):**
- Onboarding in regulated/government contexts is often a non-digital moment — explicit design attention required
- Escalation paths (when AI + human can't resolve) need a human support touchpoint designed in, not assumed

---

## SYNTHESIS ADDITION

When this overlay is active, add to the standard synthesis block:

**🔒 Compliance alignment check:**
- Does the proposed approach produce a complete, machine-readable audit trail from day one?
- Is there an explicit human decision point before any consequential action?
- Would an auditor reviewing this in 18 months be able to reconstruct what happened and why?

If the answer to any of these is "no" or "not yet," it is a **blocker**, not a backlog item.

---

## DESIGN PRINCIPLE

> Compliance evidence should be useful to auditors, not just reassuring to internal teams.
> Human-in-the-loop is not a UI pattern. It is an architectural commitment that must be designed from the audit log outward.
