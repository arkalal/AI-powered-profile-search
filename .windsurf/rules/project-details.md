---
trigger: always_on
---

# Project Details

Prompt‑Only AI Candidate Search (Fiber‑style)

Vision & Desired Outcome

One‑line: “User types a natural‑language prompt → AI interprets it → search index returns people that match → results show with an explanation of how the AI parsed the prompt.”

No clicks: No filter pickers or drop‑downs in v0. We only show read‑only ‘chips’ that explain what the AI extracted from the prompt.

Fast demo: Handles ~2–3M profiles comfortably; current dataset ≈ a few GB JSONL in S3. Latency target P50 < 1.2s (without external re‑rank); < 2.5s with optional LLM re‑rank.

Primary user journey

User enters a prompt (e.g., “ServiceNow developers in Pune with Python or JavaScript, Deloitte background”).

Backend calls OpenAI to parse → filters JSON + keywords.

Backend queries search index (filters + BM25 keywords) and returns results + parsed filters.

UI shows results list and an “AI understood” panel with non‑interactive chips (titles, skills, employers, size buckets, locations, seniority hints).

Data Source & Assumptions

Source of truth: JSONL file(s) in S3 (one object per line). Example fields present in provided samples:

first_name, last_name, title, summary, expertise (skills comma‑string), country, city, functional_area, current_industry, education[], experience[] (with name, estimated_num_employees, etc.), linkedin_url, location.

MVP Features (v0)

Prompt‑only search over people.

AI parsing → structured filters and keywords from the prompt.

Hybrid retrieval: keyword BM25 across selected fields + strict filters.

Read‑only explanation chips that mirror the Fiber UI sections:

Title includes; Company size; Previously worked at; Mentions (keywords/skills); Location; Past seniority.

Result cards: name, headline/title, city/country, top skills (deduped), 1–2 notable employers, LinkedIn link.

Pagination: 20 per page, next/prev.

High‑Level Architecture

Data layer

S3: raw JSONL.

ETL process (one‑off or cron): stream JSONL → derive helper fields → upsert to search index.

Search index: Choose one

Typesense (recommended for v0, easiest facets/filters/typos)

Meilisearch (similar simplicity)

OpenSearch Serverless (all‑AWS, heavier setup, supports vector later)

Indexed Document Model (derived, no code)

Collection name: people

Stored fields (source)

first_name, last_name, title, summary, country, city, functional_area, current_industry, linkedin_url.

experience[] (at least employer names, employee counts if available).

education[] (campus/major/specialization).

expertise (raw comma list of skills).

Derived fields (created in ETL)

skills[]: split/trim/lowercase from expertise; dedupe.

past_employers[]: normalized company names from experience[].name.

size_buckets[]: bucketed from experience[].estimated_num_employees into [0–9, 10–49, 50–199, 200–499, 500–999, 1000–4999, 5000+].

education_signals[]: flags like mba, iit, computer-science based on education text.

seniority_guess: enum or null inferred via regex from title/summary (cxo/founder, vp, director, lead/manager, null).

name_full: convenience string "First Last".

id: stable doc id (e.g., slug of name + linkedin_url).

Queryable text fields

title, summary, skills, functional_area, current_industry, past_employers (as a text field too, for keyword hits), education.campus/major/specialization.

Facet/filter fields

country, city, functional_area, current_industry, skills[], past_employers[], size_buckets[], education_signals[], seniority_guess.

ETL Plan (from S3 → Index)

Input: one or more .jsonl files in S3.

Process per line

Parse JSON; skip empty/malformed lines.

Build skills[] from expertise (comma split, trim, lowercase, dedupe).

Normalize past_employers[] from experience[].name (trim, common canonicalizations like HSBC/Capital One, collapse whitespace/casing).

Convert estimated_num_employees to size_buckets[] and dedupe across experiences.

Add education_signals[] via regex hits (MBA/IIT/Computer‑Science).

Infer seniority_guess from title/summary.

Ensure country/city set if present; otherwise null.

Construct id (stable) and name_full.

Upsert batch to search index (batch size ~250–1000 docs for throughput). Retry on transient errors.

Validation: Random sample N=200 docs, ensure required fields exist, spot‑check chips.

Frequency: one‑off for demo; can be re‑run to refresh.

Prompt Parsing (LLM) — Contract

Goal: Convert user’s natural language into a Filters JSON + Keywords that our search index understands. If the prompt requests a field we don’t track (e.g., company type), put it in keywords.

LLM Output JSON (target)

titles_include[] — strings to match in title (e.g., ["CTO","VP of Engineering","ServiceNow Developer"]).

skills[] — normalized tokens (e.g., ["servicenow","python","javascript"]).

past_employers[] — company names (e.g., ["Google","Microsoft","Deloitte"]).

keywords[] — free text terms for BM25 across title/summary/skills/education/industry (e.g., ["AI infrastructure","cloud migration"]).

country — string or null.

city — string or null.

size_buckets[] — subset of allowed bucket labels.

seniority[] — subset of allowed labels: ["cxo/founder","vp","director","lead/manager","senior","mid","junior"].

exclude_keywords[] — strings to negatively match (optional).

Parsing rules

Prefer filters over keywords when the prompt is explicit.

If a filter value is unknown in our schema, move it to keywords.

If both city and country are present, use both.

For ranges like “50–1000 employees”, expand to [50–199, 200–499, 500–999].

For synonyms (e.g., “leadership” → seniority), map to closest label.

Examples

Input: “ServiceNow developers in Pune with Python or JavaScript, Deloitte background”

Output filters: titles_include=["developer"], skills=["servicenow","python","javascript"], past_employers=["Deloitte"], city="Pune", country=null.

Input: “Finance leaders in India who worked at Capital One or HSBC”

Filters: functional_area (derived later), seniority=["lead/manager","director","vp","cxo/founder"], past_employers=["Capital One","HSBC"], country="India", keywords=["finance","risk","analytics"].

Search Query Construction (Index Layer)

query string: join titles_include + keywords (space‑separated) for BM25.

filters (AND‑ed):

country, city

skills (multi‑value IN)

past_employers (multi‑value IN)

size_buckets (multi‑value IN)

seniority_guess (multi‑value IN)

Optionally functional_area/current_industry if mentioned.

facets returned (read‑only chips): skills, past_employers, size_buckets, city, country, education_signals, seniority_guess.

pagination: page, per_page.

Fallbacks

If no filters extracted → search only BM25 across title, summary, skills, education, past_employers, functional_area, current_industry.

If only one of city/country is present → use that one.

If titles_include empty → rely on keywords and skills.
