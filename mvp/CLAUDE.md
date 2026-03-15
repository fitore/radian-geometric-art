# CLAUDE.md — Radian

## Architecture rules
- Single file: index.html only. No build step, no framework, no npm.
- Vanilla JS and CSS only. No external JS libraries.
- Google Fonts CDN allowed for typography only.
- All state lives in memory (JS variables). Persistence via localStorage only.
- localStorage key prefix: `radian:` — never write keys without this prefix.

## Internal code structure (comment-delimited sections in index.html)
<!-- STYLES -->       All CSS in one <style> block
<!-- DATA -->         TAG_VOCABULARY constant + localStorage utilities
<!-- GALLERY -->      renderGallery(), filterEntries(), card template
<!-- FORM -->         renderForm(), populateForm(), saveEntry()
<!-- APP -->          init(), routing, event listeners

## populateForm() contract — DO NOT break this
populateForm(entry) must accept any valid entry object and pre-fill all form fields.
It is called both on edit-load AND will be called by the Claude API annotation feature in v2.
Never inline form-filling logic outside this function.

## localStorage schema
Index:  radian:index        → JSON array of UUIDs
Entry:  radian:entry:{uuid} → JSON entry object

## Entry object shape (canonical)
{
  id, createdAt, title, imageUrl, sourceUrl,
  status,      // "want-to-try" | "attempted" | "done"
  difficulty,  // "beginner" | "intermediate" | "advanced"
  tags: {
    constructionMethod: [],
    tradition: [],
    patternType: [],
    symmetry: [],
    proportion: []
  },
  description,
  attemptNotes
}

## Filter logic
- AND across tag groups (entry must match all active groups)
- OR within a tag group (entry matches if it has any active tag in that group)
- Status and difficulty filters also OR within their group

## v2 hook
A "✦ Annotate with Claude" button will be added to the form in v2.
It will call populateForm() with a pre-filled entry from the API.
Do not build this now. Do ensure populateForm() works as a standalone function
that can be called from outside the form submission flow.
