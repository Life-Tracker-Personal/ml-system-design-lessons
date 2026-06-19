---
name: interview-questions
description: >
  Real ML / ML-system-design interview questions by company (Meta, Google, Amazon, Netflix,
  Microsoft, Apple, Uber, Lyft, DoorDash, Instacart, LinkedIn, TikTok/ByteDance, Spotify, Snap,
  Airbnb, Pinterest, Stripe, OpenAI/Anthropic) plus the canonical answer frameworks (Hello
  Interview's delivery framework, Educative's 6-step Grokking template) and per-archetype
  "expected response" rubrics (recommendation/feed ranking, search ranking, ad CTR, ETA/regression,
  fraud, harmful-content, PYMK, visual search, dynamic pricing, RAG/LLM design). Sourced from
  Hello Interview, Educative, Blind, Glassdoor, LeetCode, interviewing.io, and company engineering
  blogs (2024–2026). USE THIS when authoring or reviewing any "design X" / system-design-rehearsal
  lesson, an interview-gotchas section, or a quiz question that must mirror what real interviewers
  ask and what a staff-level answer actually contains.
---

# ML interview questions & expected-answer rubrics (by company)

This is the **question bank + answer-key** companion to `authoring-lessons`. It exists because the
course (PLAN.md §9) has a known gap: **system-design rehearsal** — the open-ended "design X"
walk-throughs that every top-tier ML loop now centers on. Lessons that teach a *concept* (losses,
metrics, imbalance) should end by showing how that concept is *interrogated in a real interview*;
the planned design-rehearsal lessons should be built directly on the archetypes below.

**Provenance and the accuracy bar.** The repo's accuracy bar (`authoring-lessons` §7) is
non-negotiable: a wrong claim repeated in an interview is worse than a missing one. The material
here was gathered (June 2026) from Hello Interview and Educative (the two named primary prep
sources), candidate reports on Blind / Glassdoor / LeetCode / 1point3acres / interviewing.io, and —
most reliably — **company engineering and research blogs** (DeepETA, Michelangelo, PinSage, LiGNN,
360Brew, Netflix's foundation model, Snap ad ranking, Instacart availability, Airbnb embeddings).
Two confidence tiers are flagged throughout:

- **[corroborated]** — the loop structure, archetype, metrics, and architecture are confirmed
  across multiple independent sources and/or a company's own published system. Safe to teach.
- **[reported]** — a specific verbatim prompt or a single-candidate anecdote. Teach the *shape* of
  the question, not the exact wording, and never attribute an exact quote to a company as fact.

When you cite a company's *production* system in a lesson (e.g., "Uber's DeepETA"), follow §7 of
`authoring-lessons`: name the system and the mechanism, and prefer the primary eng-blog/paper.

---

## Part 1 — The two canonical answer frameworks

Both named sources teach the **same underlying pipeline**; they differ in emphasis and naming.
A lesson should teach **one unified framework** and note that it is the intersection of both.

### 1A. Hello Interview — "ML System Design in a Hurry" delivery framework [corroborated]

Their framing: the framework is a set of *guideposts, not hard rules* — follow the interviewer if
they redirect. The stated goal: *"not to design the perfect system in 45 minutes, but to
demonstrate your thought process and ability to make reasonable trade-offs."*

**The opening move is the whole differentiator of ML design** (do this in the first ~5 minutes):

1. **Clarify the problem.**
2. **Establish a high-level business objective.**
3. **Translate the business objective into an ML objective** you can build around.

Their load-bearing insight, worth quoting in a lesson:
> *"The ultimate objective for an ML solution is usually not the loss function of the model."*

A harmful-content system's real objective may be *reduce legal risk* or *reduce harmful
impressions* — neither equals cross-entropy. **Confusing the loss function with the business
objective is the #1 substantive mistake they call out.**

Section ordering (the ML version replaces generic SD's "Core Entities + API" with ML-specific
middle steps):

| Step | Contents | Rough time (45-min loop) |
|---|---|---|
| 1. Requirements / scoping | Clarify problem; business objective → ML objective; **functional** ("system should *do*…") vs **non-functional** ("system should *be*…": scale to 100M+ DAU, p99 latency, freshness, cost). Prioritize the top ~3. | ~0–5 min |
| 2. ML task framing | classification vs ranking vs regression vs retrieval; inputs, outputs, success metrics | ~5–10 min |
| 3. Data | sources, labeling, data/feature pipelines, feature engineering | part of high-level |
| 4. High-level design | start simple, meet functional reqs; usually the **candidate-generation/retrieval → ranking** funnel; model, training, serving | ~10–30 min |
| 5. Deep dives | non-functional reqs (latency, scale, freshness, cost, guardrails, monitoring) + evaluation; "where you show depth" | ~30–45 min |

> The exact per-section minute table on the ML page could not be fully confirmed (their site blocks
> scraping); the splits above are the general-SD timings adapted, and a circulated third-party split
> is ~10% clarify / 20% high-level / 50% deep-dive / 20% eval+tradeoffs. Teach the *ordering* as
> firm and the *minutes* as approximate.

**Hello Interview's published worked problems** (their "problem breakdowns"): Video Recommendations
(YouTube "up next"), Harmful Content Detection (Meta), Bot Detection. Their community DB adds
Top-K Recommendation (tagged Mastercard/Amazon), generic Recommender, Ads-recommendation model,
and is filterable by company. **Contrast trap:** their *general* SD track has "Ad Click
Aggregator," which is a streaming **data-pipeline** problem (idempotent counting, fraud filtering),
**not** an ML CTR-modeling problem — make sure a lesson doesn't conflate the two.

### 1B. Educative — "Grokking the ML Interview" 6-step template [corroborated]

Educative teaches one repeatable structure and applies it verbatim to every case study. Their
own framing: *"identify the problem statement, understand scale and latency requirements and define
metrics, then come up with the architecture, select models, gather data, and finally execute and
evaluate the models offline [then online]."*

The generalized template (the section names are remarkably consistent across their Search Ranking,
Feed, Recommendation, and Ad Prediction chapters):

1. **Problem statement / setup** — clarify; translate to ML objective; pin down **scale** (items,
   users, QPS) and **latency** budget.
2. **Metrics** — split **offline** (classification: P/R/F1/AUC; ranking: precision@k, NDCG, MAP;
   regression: MSE/MAE) vs **online** (CTR, engagement, session success, retention, revenue), and
   discuss the gap between them.
3. **Architectural components** — high-level diagram; separate non-ML (servers, DBs, indexes) from
   ML, laid out as a **funnel** (candidate generation → ranking → filtering/blending).
4. **Candidate / document selection** — fast, cheap retrieval over the full corpus.
5. **Feature engineering** — organized by **actor** (user/searcher, query, item/document, context)
   plus **cross-features** (user×item, query×document).
6. **Training-data generation** — labels (implicit vs explicit), positive/negative definition,
   **negative sampling**, class balance, train/test split, online collection, **recalibration**.
7. **Modeling / ranking** — simple → complex (logistic regression → GBDT/MART → deep / two-tower /
   wide&deep / stacking); justify each jump by data/latency.
8. **Offline eval → online experimentation (A/B) → deployment/serving → monitoring**.

Educative's case-study list (each maps to the archetypes in Part 3): Search Ranking; Feed-Based
System (Twitter); Recommendation (Netflix/movie); Self-Driving Image Segmentation; Entity Linking;
Ad Prediction; Fraud Detection; Hate-Speech / Harmful Content; Dynamic Pricing. The newer
"ML System Design" course updates these to: Video Recommendation, Feed Ranking, Ad Click
Prediction, Rental Search Ranking (Airbnb), and Food-Delivery ETA.

### 1C. The unified framework to teach

The widely-used community "9-step" template (alirezadir) is the intersection of both and tracks
Grokking section-for-section. Teach this spine and tell the learner *every* company's design round
is a walk down it:

> **Requirements → ML task framing → Metrics (offline + online) → Data & labels (incl. negative
> sampling) → Features (by actor + cross) → Model (simple→complex) → Funnel/serving (retrieval →
> ranking → re-rank) → Online experimentation (A/B) → Scaling, monitoring & retraining
> (drift, training-serving skew, rollback).**

Lead with the business→ML-objective translation (Hello Interview's move) and **end every archetype
on evaluation tied back to the business objective** — that closing is what separates senior answers.

---

## Part 2 — The universal "expected response" rubric

### 2A. Meta's official 5-dimension ML-design rubric [corroborated]

Reported consistently from Meta's own interview-prep material; a clean, gradeable rubric to reuse:

1. **Problem navigation** — organize the problem/solution space; connect business context to ML
   decisions; ask clarifying questions early ("optimize watch-time or shares?", "latency budget?").
2. **Training data** — how to collect/label; constraints and risks of each method.
3. **Feature engineering** — the signals (user behavior, content similarity, engagement likelihood,
   recency) and how they're built.
4. **Modeling** — justify the model; explain training; anticipate and mitigate risks.
5. **Evaluation & deployment** — consistent eval/deploy; justify offline + online metrics; A/B.

### 2B. Strong vs weak — what graders actually reward

| Dimension | Weak answer (cheap) | Strong answer (staff-level) |
|---|---|---|
| Objective | Jumps to a model. | Clarifies business objective, then **translates to an ML objective**, and notes where they diverge (loss ≠ business goal). |
| Scoping | Designs everything. | Picks top ~3 functional + the binding non-functional constraint (latency/scale/freshness/cost) and designs to *those*. |
| Funnel | One model over all items. | **Retrieval → ranking → re-rank** funnel, justified by latency/scale: cheap recall first, expensive precision last. |
| Metrics | "Accuracy / AUC." | **Offline metric chosen to predict the online metric**; names guardrails (latency, diversity, fairness, calibration); knows offline≠causal. |
| Labels | "We have labels." | Defines positive/negative precisely; **negative sampling** (random + hard negatives); "not-clicked ≠ negative"; class imbalance; delayed labels. |
| Model choice | "Use a deep net." | simple→complex path; justifies each jump by data/latency/cost; knows when GBDT/logistic beats deep. |
| Production | Stops at the model. | Serving (batch vs real-time), **feature store + online/offline parity (training-serving skew)**, drift, retraining cadence, rollback, monitoring. |
| Curiosity | Recites the standard story. | Surfaces a failure mode / feedback loop / bias the standard story hides (see Part 7). |

### 2C. The seniority signal that recurs everywhere

Across Netflix, Meta E6, Amazon AS, and Uber staff: **judgment over sophistication.** The signature
senior move is *declining* complexity — choosing the interpretable/stable model, or refusing to
deploy a fancy one because it raises experimentation cost or interpretability risk. Netflix
explicitly treats "I would *not* deploy this" as a strength. A lesson teaching a powerful method
should include "when the boring choice wins."

---

## Part 3 — Question archetypes with expected-answer skeletons

These are the reusable building blocks. Each archetype = the prompt variants + companies + the
**expected-answer skeleton** (walk down the unified framework) + the **"challenge the standard
story"** hook the course prizes. Build a design-rehearsal lesson by instantiating one archetype on
one company's surface.

### Archetype 1 — Recommendation / feed ranking (the single most common) [corroborated]

**Prompts & companies:** Reels / short-video recommendation, Instagram feed/Explore ranking (Meta);
YouTube "up next" / video recommendation (Google); Top-K product recs (Amazon, Mastercard); Netflix
Top Picks / video recommendation + thumbnail personalization (Netflix); "For You" (TikTok/ByteDance);
Discover Weekly / next-track radio / podcast recs (Spotify); Homefeed "Pinnability" / Related Pins
(Pinterest); LinkedIn feed ranking; Spotlight short-video feed (Snap); Uber Eats / Instacart /
DoorDash item recs; Office 365 next-action recs (Microsoft).

**Expected-answer skeleton:**
- **Objective:** business = long-term engagement / watch-time / retention (Hello Interview's YouTube
  breakdown: *"maximize long-term user watch time, not just immediate clicks"*) → ML = rank items by
  P(positive engagement) or expected watch-time; often **multi-task** (P(click), P(complete),
  P(like), P(skip)) combined into one score.
- **Funnel:** candidate generation (**two-tower** user/item embeddings + **ANN** retrieval, e.g.
  Faiss/ScaNN; collaborative filtering / matrix factorization as the simple baseline) → **ranking**
  (DNN with user×item cross-features; DCN / wide&deep / multi-task heads) → **re-ranking** for
  diversity/freshness/business rules.
- **Features (by actor):** user (history embeddings, demographics, context: time/device), item
  (content embeddings, age, popularity), cross (user×item affinity), context (session, position).
- **Labels & data:** implicit feedback; **negative sampling** (random + hard negatives; not-shown
  vs shown-not-clicked); **position bias** correction; delayed/again-watched signals.
- **Metrics:** offline NDCG / recall@k / AUC; online CTR, watch-time, session success, retention,
  plus **diversity / novelty / repetition penalty** guardrails.
- **Production:** feature store, embedding refresh cadence, cold-start (new user/item), real-time vs
  batch features, **feedback loop** monitoring.
- **Challenge the standard story:** AUC/NDCG can rise while the system gets *worse* (filter bubble,
  popularity bias, feedback loop); CTR is confounded by thumbnails/position; "engagement" can
  optimize for outrage. The senior point: **the offline metric must be shown to predict the online
  one**, and the objective must encode long-term value, not next-click.

### Archetype 2 — Search ranking [corroborated]

**Prompts & companies:** web/product search ranking (Google, Amazon A9); Airbnb rental search
ranking; Bing ranking (Microsoft); LinkedIn job/people search; Pinterest search.

**Skeleton:** query understanding (rewrite, spell, intent) → **document selection** (retrieve ~100k
from billions via inverted index + embedding/ANN retrieval) → **two-stage ranker** (light model
trims 100k→500, heavy LTR/cross-encoder ranks 500) → **blender** (mix result types) → filter.
Features by actor (searcher, query, document, context) + cross (query×document TF-IDF and
**embedding similarity**; searcher×document). Models: LTR / GBDT → deep; embedding retrieval for
recall. Offline: NDCG, recall@k. Online: CTR, **successful-session rate**, time-to-success.
**Challenge the standard story:** CTR is confounded by image/price/position; NDCG measures ranking
quality independent of those — so optimize NDCG offline but validate session success online.
Defining the positive label is non-trivial (a click then a quick back is a *negative*).

### Archetype 3 — Ad click / conversion prediction (CTR/CVR) [corroborated]

**Prompts & companies:** ad ranking / CTR (Meta, Google Ads, Snap, Pinterest, TikTok monetization);
"design an evaluation framework for ad ranking" (Hello Interview).

**Skeleton:** **ad selection** funnel (eligibility filter → light high-recall candidate gen → heavy
DL conversion model) feeding a **real-time auction**. Features: ad, user, context, **user×ad cross**.
Models: **logistic regression** (sparse features, online learning, cheap) → GBDT for auto
non-linear features (Facebook's "Practical Lessons from Predicting Clicks on Ads") → deep. Labels:
engagement logs, **negative downsampling + recalibration**. **Calibration is the differentiator:**
predicted CTR must be well-calibrated (calibration = expected/observed clicks) so advertisers pay a
fair auction price; cover delayed conversions, budget pacing, click-value vs click-probability.
Metrics: offline log-loss, **PR-AUC**, calibration; online CTR/CVR, revenue, advertiser ROI.
**Challenge the standard story:** a model with great AUC can be badly *calibrated* and break the
auction — AUC is invariant to monotonic transforms, calibration is not. (Ties directly to c1.10.)

### Archetype 4 — ETA / time estimation (regression) [corroborated]

**Prompts & companies:** Uber ride ETA; Uber Eats / DoorDash / Instacart delivery-time, decomposed
into prep (P1) + match/pickup (P2) + travel (P3); Google Maps ETA.

**Skeleton:** regression (or quantile regression for intervals). Features: map segments, real-time
traffic, weather, historical ETAs, temporal patterns, restaurant/store state. Model: GBDT vs deep;
Uber's **DeepETA** = a model that predicts a *residual on top of a routing-engine estimate*
(name the mechanism per §7). Tight latency/scale ("~500K req/s at low ms"). **Loss choice is a real
probe** (ties to c1.2): drivers take detours → labels are noisy/heavy-tailed → **Huber / robust
regression** over plain squared error; quantile loss for "show a range." Metrics: offline MAE/MAPE;
online late-delivery rate, cancellations, support-contact rate. Production: drift + freshness
monitors, **shadow mode** to validate parity before ramp, retraining trigger, rollback.
**Challenge the standard story:** offline MAPE down ≠ better — an ETA that is *biased low* destroys
user trust more than one that is symmetrically noisier; the loss should encode asymmetric cost.

### Archetype 5 — Fraud / anomaly / abuse detection [corroborated]

**Prompts & companies:** Stripe payment fraud; Uber/Lyft/DoorDash payment + GPS-spoof + promo-abuse;
Instacart/Airbnb fraud & trust-and-safety; LinkedIn account fraud.

**Skeleton:** binary classification under **extreme class imbalance + asymmetric cost** (ties to
c1.11). Real-time, sub-100ms scoring → light model (GBDT / logistic) online, heavy/graph model in
batch. Features: behavioral, device/velocity, graph (shared cards/devices), merchant; **streaming
features with online/offline parity** (a top failure mode). Labels: delayed/partial fraud
confirmation, label noise, **chargeback lag**. Sampling: stratified / cost-sensitive / SMOTE +
anomaly detection for novel fraud. Metrics: **PR-AUC** (not accuracy), recall at fixed precision,
$ fraud loss vs false-positive friction; pick the **threshold from the PR curve** at a required
precision. Manual-review queue for the uncertain band. **Challenge the standard story:** 95%
accuracy is worthless at 1% prevalence (ties to the c1.1 quiz "95%-accuracy trap"); a static model
decays fast because adversaries adapt — fraud is non-stationary, so monitoring/retraining is the
system, not an afterthought.

### Archetype 6 — Harmful-content / integrity classification [corroborated]

**Prompts & companies:** Meta harmful-content / post moderation; hate-speech (Educative); spam/bot
detection (LinkedIn, Pinterest, social platforms).

**Skeleton (Hello Interview's worked breakdown):** **multimodal, multi-label** classification
(text + image + video), early vs **late fusion**, multi-task heads per harm type. Scale ~500M
posts/day, ~10K annotated. Labels: user reports + human annotators + **LLM-generated labels**.
Action layer: delete / flag-for-review / down-rank, gated by a **confidence threshold** (the
"95%-confidence-before-removal" trade-off). Offline: F1, PR-AUC, ROC-AUC. Online: **prevalence,
harmful impressions, proactive rate** (share caught before user reports). Bot detection variant:
multi-branch model — a **sequence branch** (last ~200 events, time-bucketed, event-type embeddings
→ bidirectional GRU, *chosen over a transformer because you're fitting sketchy behavior, not
language*) fused with feature branches via cross-attention; PR curve to hold precision while
maximizing recall. **Challenge the standard story:** the business objective is *reduce harmful
impressions / legal risk*, not maximize classifier F1 — precision/recall trade-off is a
**policy + cost** decision (cost of wrongful takedown vs missed harm), not a modeling default.

### Archetype 7 — Connection / "People You May Know" (link prediction) [corroborated]

**Prompts & companies:** LinkedIn PYMK / job recs; Meta friend recommendation; Snap friend rec.

**Skeleton:** **link prediction** on a graph; candidate generation via **friends-of-friends /
2–3-hop neighbors** (never N×N over billions) → ranking on # shared connections, co-work/co-school,
**graph embeddings / GNNs** (LinkedIn LiGNN/GraphSAGE; Snap embedding-based retrieval; Pinterest
PinSage). Metrics: precision@k on accepted invites; guard against spammy/awkward suggestions.
**Challenge the standard story:** optimizing accept-rate can recommend people you already know or
create harassment vectors — the graph + a "value of a *new* connection" objective matter more than
raw P(accept).

### Archetype 8 — Visual / embedding similarity search [corroborated]

**Prompts & companies:** Pinterest visual search / Lens; Airbnb similar-listings; Amazon multimodal
search; Apple on-device photo search.

**Skeleton:** encode query + corpus into a **shared embedding space** (two-tower / CLIP-style),
store vectors in an ANN index (Faiss / OpenSearch), retrieve top-k by cosine, optional re-rank.
Training: **contrastive loss** with hard-negative mining. Metrics: recall@k, precision@k, latency.
Apple twist: **on-device** inference under memory/battery/privacy constraints (quantization).
**Challenge the standard story:** cosine-in-embedding-space is only as good as the training
objective's notion of "similar"; popularity and presentation bias leak into embeddings.

### Archetype 9 — Dynamic pricing / surge / marketplace [corroborated]

**Prompts & companies:** Uber/Lyft surge; Airbnb smart pricing; Instacart/DoorDash incentives;
Amazon pricing.

**Skeleton:** demand forecasting + supply estimation → pricing/optimization, balancing a
**two/three-sided marketplace** (riders/drivers, guests/hosts, consumers/dashers/merchants). Often
regression/forecasting + optimization + bandits. Experimentation is hard: **network/interference
effects** break naive user-level A/B → switchback / region-level / cluster designs; CUPED for
variance reduction. **Challenge the standard story:** the metric you can measure (per-session
conversion) is biased by interference; marketplace-level causal estimation is the real problem.

### Archetype 10 — LLM / GenAI system design (the 2024–2026 frontier) [corroborated trend]

**Prompts & companies:** RAG for customer support (Airbnb, Lyft, DoorDash, Uber Genie); "RAG vs
fine-tuning" (Amazon, Microsoft Copilot, Uber, Apple, LinkedIn AI Engineer); LLM-for-recsys
(Netflix foundation model, LinkedIn 360Brew, Spotify AI DJ); evals & hallucination (OpenAI,
Anthropic, Microsoft); agent design (multiple).

**Skeleton:**
- **Frame the choice:** RAG vs fine-tuning vs prompting vs tools/agents — decided by *freshness of
  knowledge, need for grounding/citations, latency, and cost*, not fashion. (Strong answers note
  lightweight fine-tuning of a ranker can beat RAG for user-history tasks.)
- **RAG pipeline:** chunking strategy → embedding model → vector store + **hybrid (sparse+dense)
  retrieval** → re-ranking → context-window management → generation with **citations**. Trade-offs:
  embedding latency vs vector-search accuracy vs token cost.
- **Evaluation (the hardest part, explicitly tested):** golden set + **LLM-as-judge**; the **RAG
  triad** — faithfulness/groundedness, answer relevance, context relevance; hallucination rate =
  % answer sentences supported by retrieved spans; refusal-policy rate; red-teaming. *"Evaluation
  is the hardest unsolved problem in LLM engineering"* — a multi-layered eval strategy (not BLEU)
  is the signal.
- **Production:** guardrails, human fallback, cost/latency budgets, caching, self-hosting under
  constraints (LoRA/PEFT), drift.
- **Anthropic-specific:** safety as the product; RLHF → **RLAIF / Constitutional AI**.
- **Challenge the standard story:** RAG is *not* "embed the docs and cosine-search"; most failures
  are retrieval failures, and you must be able to *measure* hallucination before you can reduce it.

---

## Part 4 — Company cheat sheets

Each: the loop, the level signals, the distinctive emphasis, the GenAI shift, and the canonical
prompts. Use these to set the *flavor* of a design-rehearsal lesson and to write accurate
"interview gotchas" sections.

### Meta / Facebook [corroborated]
- **Loop:** recruiter → 1–2 screens → onsite. E4: 2 coding + 1 ML design + 1 behavioral. E5: same,
  sometimes 2 design. **E6: 2 coding + 2 ML design (ML modeling + ML systems/recsys) + behavioral.**
  Coding is a pass/fail floor; **level is decided by design + behavioral.**
- **Distinctive:** the only loop with a **dedicated ML-coding round** (implement/debug a model in
  NumPy/PyTorch — k-means, logistic regression, MLP/attention, "overfit a toy sample") *separate*
  from a dedicated **ML system-design round**. Design is recsys/ranking/ads/integrity-heavy; spend
  the bulk of time on **modeling architectures & trade-offs** (multi-stage recsys, two-tower vs DCN
  vs multi-task). Operational ML at 3B DAU, sub-50ms serving.
- **Rubric:** the 5-dimension rubric in Part 2A is Meta's.
- **Canonical prompts:** Reels/short-video recommendation; Facebook/Instagram feed ranking; ad CTR;
  harmful-content detection; PYMK; Marketplace classification.
- **GenAI shift:** Oct-2025 **AI-assisted coding round** replaces one coding round (CoderPad with a
  built-in assistant; grading shifts to *reviewing* AI-generated code). GenAI topics (RAG, agents,
  guardrails, evals) entering the design round.

### Google (product MLE / AS / RS) [corroborated]
- **Loop:** 5–6 onsite rounds → **hiring committee → team match**. **L4:** 3 coding + 1 ML domain
  (no standalone design). **L5:** 2 coding + 1 ML domain + 1 ML system design. **L6:** 2 design + 2
  coding + 1 behavioral. Coding is a strong **separate** SWE gate; the **ML domain round is distinct
  from system design** (not folded in). Scored on 4 attributes incl. **Googleyness**.
- **Distinctive:** deliberately **underspecified prompts** (scope to a business objective yourself);
  search ranking and YouTube recommendation are home turf; tens-of-ms latency; funnel (BM25 + ANN
  retrieval → light ranker → cross-encoder on top candidates); strong monitoring/drift/serving
  emphasis; resume-/specialization-driven depth (CV/NLP/RecSys).
- **Canonical prompts:** YouTube "up next"; content/ad-content moderation; autocomplete & spell-check
  on mobile; email smart-reply; document matching; face recognition / image search / chatbot; Google
  Ads CTR; Maps ETA & restaurant recs; Pay fraud.
- **ML coding (separate from DSA):** logistic/linear regression, k-means, KNN, PCA, trees from
  scratch; NN primitives (conv, batch/layer norm, attention, backprop).
- **GenAI shift:** RAG-vs-fine-tune-vs-long-context for internal docs; serve a 70B model
  (quantization, KV cache, speculative decoding); conversational agent over a knowledge base;
  RAG/LLM eval (groundedness, safety); agentic RAG (Gemini).

### Google DeepMind [corroborated]
- **Loop (Research Engineer):** **2 coding rounds in CoderPad where the code must actually run**
  (stricter than product Google) + **2 ML rounds** (one math/depth, one breadth/design where the
  interviewer **stacks constraints live**) + **paper/research-discussion** + behavioral. RS adds a
  job talk and dedicated math/theory rounds. Applied/MLE framed as "help train the next Gemini."
- **Distinctive:** **mathematical intuition over technique-naming** — the canonical bar is *"why L1
  over L2?"* answered via **gradients** (L1's constant-magnitude gradient drives weights exactly to
  zero; L2 shrinks proportionally), where "gives sparsity" alone fails. Dedicated linear-algebra /
  probability / stats rounds; ML primitives coded by hand (MHA without `nn.MultiheadAttention`);
  **AI assistants prohibited** in 2026 rounds.
- **Canonical prompts:** Bayes "balls-in-a-bag" opener; scaled-dot-product attention & **why ÷√d_k**
  (variance of qᵀk is d_k); derive softmax+cross-entropy and backprop through attention; **LLM FLOPs
  budgeting (Chinchilla C≈6·P·D** — the naive 2PD misses the backward pass); scalable YouTube-style
  recommendation with constraints stacked; DPO vs PPO-based RLHF.

### Amazon [corroborated]
- **Loop (Applied Scientist):** phone screen → onsite around **four pillars** — **ML/science
  breadth** (rapid-fire ML-101), **ML/science depth** (deep dive into *your* project/papers),
  **coding** (LC easy/med or implement-from-scratch), **science application** (open-ended applied
  design) + **Bar Raiser / Leadership Principles**. MLE loop is more SDE-flavored (OA → coding →
  system design). RS adds a research/publication round.
- **Distinctive:** **Leadership Principles graded in *every* round**, even technical; Bar Raiser is
  a dedicated behavioral gate. "Substance over publications." **Practicality bias** — interpretable,
  stable, production-viable choices win (classical time-series can beat deep for forecasting
  stability). Math underpinnings expected (matrix-form OLS, entropy/Gini by hand, attention O(N²)).
- **Canonical prompts:** product recommendation (long-term revenue; conversion/revenue-per-session;
  guardrails latency/diversity/fairness); Prime Video "measure success of recs"; demand forecasting;
  fraud; multimodal search; Alexa intent correction; "design 3 metrics to select a quality dataset."
- **GenAI shift:** AS/MLE reqs now demand RAG, fine-tuning, RLHF, agents; know **Nova** family,
  Bedrock, SageMaker; MLE OAs embed GenAI tasks.

### Netflix [corroborated]
- **Loop:** small, deep, **unanimous-hire**; ~4–8 rounds; 1 ML design (weighted heaviest), coding,
  1–2 ML-reasoning/metrics, **heavy behavioral/culture**; Netflix uniquely puts **directors** in
  the loop. No YoE/dataset-size leveling proxy.
- **Distinctive:** **judgment > sophistication** (declining to deploy is a strength); **causal
  inference & experimentation** are a Netflix signature *for all ML roles* (diff-in-diff, double ML,
  Bayesian A/B, interference); culture (Keeper Test, Culture Memo) is ~40–50% of the bar.
- **Canonical prompts:** "Design Top Picks"; video-recommendation pipeline; **thumbnail/artwork
  personalization**; online-training pipeline; **multi-armed bandit** service; experimentation
  platform; "validate a DAU spike" (diagnostic skepticism).
- **GenAI shift:** pivot to a **unified autoregressive transformer foundation model** for
  personalization (millions→billions of params; SFT→RL post-training; Llama-3.1-8B post-train beat
  production by 3–5%); GenAI design (eval/cost/guardrails) emerging as its own round.

### Microsoft [corroborated]
- **Loop:** AS = ML system design + ML breadth + ML depth + coding + behavioral; ML coding from
  scratch is **rare** (theory + design + project deep-dive lean). MLE heavier on DSA. DS is
  experimentation-heavy (ExP platform). MSR adds a job talk.
- **Distinctive:** **Growth mindset** is THE cultural lens ("learn-it-all"); the **"As-Appropriate"
  (AA) round** is a senior-leader culture-fit gate with outsized authority; **hire-then-team-match**;
  questions intentionally **vague-by-design** to test scoping. Depth can include **derivations**
  (e.g., "prove MSE is non-convex for logistic regression" via the Hessian).
- **Canonical prompts:** Bing search ranking; Office 365 real-time recs; "Copilot underperforms a
  competitor — diagnose & improve"; RAG vs fine-tuning; conv2d from scratch [reported].
- **GenAI shift:** LLM fine-tuning, RAG, eval frameworks now explicit (M365 Copilot); new
  AI-Engineer (Foundry) / agentic track.

### Apple [corroborated]
- **Loop:** the **least standardized** in big tech (per-team, secretive); HM often early; 5–8
  onsite rounds; coding (DSA + ML-from-scratch in NumPy — Naive Bayes, KNN, MLP, conv2d), ML depth,
  ML design with **on-device/privacy constraints**, HM rounds; RS adds a presentation.
- **Distinctive:** **on-device ML** (quantization, compression, latency/memory/battery), **privacy
  as architecture** ("never collect it" → on-device inference), ML as a shipping product feature.
- **Canonical prompts:** on-device photo classification under latency/memory; deploy with accuracy
  parity to server; RAG for Apple News grounded in licensed articles [reported]; video-understanding
  temporal modeling (RS).
- **GenAI shift:** mirrors Apple's Foundation Models work — ~3B on-device model, **2-bit
  quantization-aware training**, LoRA to recover performance, RoPE/NoPE long context, PT-MoE server.

### Uber [corroborated]
- **Loop (MLE):** LC medium-hard (bar **not** lowered for MLEs) + ML coding from scratch + ML system
  design + behavioral; Amazon-style **Bar Raiser** + explicit values. AS adds ML/stats +
  applied-problem + stakeholder rounds.
- **Distinctive:** **real-time low-latency marketplace ML** is the identity; explicitly rejects
  "offline metrics only" — must tie to downstream business metrics; know **DeepETA** and
  **Michelangelo**; heavy experimentation/causal + offline policy eval for RL marketplace policies.
- **Canonical prompts:** ETA prediction; Eats delivery ETA (P1/P2/P3); surge/dynamic pricing; fraud
  (incl. GPS-spoof); Eats recs; "monitor/validate a newly deployed ETA model." ML coding: k-means
  from scratch.
- **GenAI shift:** GenAI Gateway, Genie (agentic RAG on-call copilot); "RAG vs fine-tuned LLM with
  grounded citations"; LLM-benchmark reproducibility [reported].

### Lyft [corroborated]
- **Loop (MLE/ML-SWE):** CoderPad ML+CS screen + DSA + ML system design + a **Design&Architecture
  round where the model is a black box** (MLOps/observability/reliability) + behavioral. DS splits
  **Product** (A/B, SQL) vs **Algorithm** (ML, Python) streams.
- **Distinctive:** **production reliability ≥ offline accuracy**; two-sided-marketplace reasoning;
  speed-graded coding; LyftLearn serving context.
- **Canonical prompts:** real-time ETA serving (p99 50ms); surge/dynamic pricing; driver–rider
  matching; ETA noisy-label loss choice (Huber); ETA-MAPE production incident; driver-churn
  take-home; probability puzzles (coins/cards/coupons).
- **GenAI shift:** LoRA-fine-tuned Llama replacing BERT intent classifier; RAG FAQ agent for
  drivers; teen-safety modeling.

### DoorDash [corroborated]
- **Loop (MLE):** coding (increasingly **ML-from-scratch over LeetCode** — logistic regression,
  kNN, k-means) + **ML system design (infra/SWE-heavy:** feature stores, online/offline parity,
  serving) + **ML domain** round (treat as a 2nd design) + behavioral. DS is product/experimentation
  + SQL + a delivery-duration take-home.
- **Distinctive:** **three-sided marketplace** reasoning; "product engineer who happens to build
  ML" (end-to-end ownership); **causal inference / switchback experiments** central even for ML
  roles; four MLE domains (logistics, personalization, incentives/causal, safety/fraud).
- **Canonical prompts:** delivery-time/ETA (P1/P2/P3); Dasher dispatch/matching; personalized
  search/recs; real-time fraud; demand/supply forecasting; "measure impact of a 5%-off coupon"
  (network effects); "consumers got cold food — diagnose."
- **GenAI shift:** GenAI Platform (LLM/MCP/Agent gateways, Evals platform); RAG + guardrails;
  dedicated AI-Engineer track (GenAI a *nice-to-have* for core MLE).

### Instacart [corroborated]
- **Loop (MLE):** coding (LC easy→med, **no hards**) + ML breadth (traditional ML) + ML system
  design + behavioral/project deep-dive. DS/AS is experimentation- & take-home-heavy.
- **Distinctive:** the **physical-world / four-sided-marketplace** twist (stale inventory, mobile
  shoppers, real-time accuracy); **real-time item-availability** is the signature topic
  (G-T-R hierarchical model); latency obsession; coding stays easy, trading for ML + business depth.
- **Canonical prompts:** scalable recommendation + "how to evaluate it"; personalization; fraud;
  ETA with **label-leakage** probing; **real-time item-availability** prediction; shopper-demand
  prediction. DS: experiment-review take-home; CUPED; marketplace interference; SQL schema design.
- **GenAI shift:** LLM query-understanding "Intent Engine" with RAG + embedding similarity.

### LinkedIn [corroborated]
- **Loop:** **centralized, team-agnostic** (hire-then-**team-match**); 4–5 rounds; coding (LC
  med-hard, **probability-heavy** — e.g., sample from a non-uniform distribution) + ML system design
  + **ML Breadth** (rapid-fire) + **ML Depth** (project deep-dive) + behavioral. Each round scored
  **4-point, 3 = pass**; Review Council decides + leveling.
- **Distinctive:** recommendations/relevance + **graph/GNNs** are the soul (LiGNN/GraphSAGE; link
  prediction); full-lifecycle thinking; **normalized cross-entropy** as the feed offline metric.
- **Canonical prompts:** feed ranking; **PYMK**; job recommendations; generic recommender; real-time
  fraud; notifications/ads relevance.
- **GenAI shift:** **360Brew** (150B decoder-only foundation model from Llama-3 unifying 30+
  ranking tasks); AI-Engineer loops add RAG/agents/fine-tuning/eval.

### TikTok / ByteDance [corroborated]
- **Loop:** ~2-hr OA + technical screens (coding + resume) + **ML system design** (in nearly every
  round) + behavioral ("ByteStyle" values). **TikTok USDS "knockout" format:** fail an early round
  and later ones auto-cancel. Coding is reported **hard** (up to 4 problems incl. 2 hards). ByteDance
  RS = 4 rounds, each a deep dive on one of *your* papers + team-relevant research Qs.
- **Distinctive:** recommendation at **extreme scale** (candidate gen → ranking → re-ranking →
  post-processing); **exploration/exploitation (contextual bandits), cold-start, and online learning
  under non-stationary data** (trends die within hours) are **first-class** topics; latency discipline
  (~100ms feed, ~150ms ads); "MLE as product owner of the algorithm."
- **Canonical prompts:** "For You" recommendation; short-video ranking; ads CTR (calibration,
  normalized cross-entropy, ~1–2% CTR imbalance); content moderation; video search; A/B framework to
  improve the recsys. Coding: bipartite-graph detection; enclosed-loop in a 2D image; median of two
  sorted arrays.
- **GenAI shift:** incorporate an LLM into a large-scale recsys; query-generation to maximize CTR;
  implement MHA and top-p sampling; RAG/vector-search.

### Spotify [corroborated]
- **Loop (MLE):** recruiter → technical screen → onsite 4–5 rounds (coding Python/Scala; **ML system
  design**; applied-ML depth; **open-ended case study** — "most important round," sometimes
  "debug a stalled recsys"; values). RS-Personalization requires publications + a research talk.
- **Distinctive:** **personalization at global scale**; hybrid recsys (CF + content-based audio +
  session/context); **cold-start** repeatedly probed; **metrics beyond accuracy** (skip/completion
  rate, dwell, saves, retention; NDCG/MAP, diversity/novelty); strong communication bar; PMs in loop.
- **Canonical prompts:** Discover Weekly; next-track/Radio ranking; podcast recs; rank artists per
  country; predict MAU; "1 song per user"; DS take-home "what makes a playlist successful?"
- **GenAI shift:** **AI DJ (DJ X)** (TTS + generative commentary); semantic-IDs + LLM
  personalization; AI/prompted playlists ("steer the algorithm").

### Snap [corroborated]
- **Loop:** ~6 rounds = 3 coding + ML fundamentals + **ML system design (separate from a distributed
  System Design round)** + HM. **From-scratch ML coding** (k-means, 2D convolution — no sklearn).
  RS/CV adds a research talk; PhD for CV research.
- **Distinctive:** "almost purely technical," correctness over hand-waving; product-grounded design
  (Spotlight feed, Discover, friend-rec, ads, **Lens/AR**); reading Snap's ad-ranking eng blog is
  reported as directly useful (ads = eligibility → light candidate gen → heavy DL conversion model
  in a real-time auction; friend-rec = FoF + GNN + embedding-based retrieval).
- **Canonical prompts:** Spotlight short-video feed; recommender; "People You May Know"; ad ranking;
  real-time image processing in Lens Studio.

### Airbnb [corroborated]
- **Loop (MLE):** HackerRank screen (SQL+Pandas+ML) → onsite: data-manipulation coding + **ML system
  design** (search/recs/pricing/fraud) + **debug a model with unexpected behavior** + Core Values +
  ML-experience deep-dive. SWE loop has a distinctive **Code Review round** (2024+).
- **Distinctive:** **two-sided marketplace** trade-offs (guest conversion vs host earnings; the
  "one listing per guest per date, users rarely reconsume" constraint → listing embeddings);
  product/business familiarity mandatory; trust/safety; production reasoning; experimentation rigor
  (interleaving for ranking, interference, CUPED).
- **Canonical prompts:** "Design Airbnb Search" / iterate the ranker; the **embedding-leakage**
  scenario (offline AUC +8 but bookings drop — diagnose feedback loop) [reported]; similar-listings
  recs; smart/dynamic pricing; pricing-badge experiment with interference; fraud.
- **GenAI shift:** GenAI-Engineer / Senior-Staff-MLE-GenAI roles; "RAG for customer support";
  fine-tune-vs-RAG; vector-DB selection; hallucination measurement; agents.

### Pinterest [corroborated]
- **Loop:** CodeSignal OA (~7 ML MCQ + 3 coding: implement Naive Bayes, gradient descent, 1 LC-med)
  → onsite 5–7 rounds across 5 **streams**: Domain-Specific, ML Practitioner, **ML Systems Design**,
  Data Intuition, DSA. ≥1 (often 2) design rounds, weighted heaviest.
- **Distinctive:** **objectives/constraints/trade-offs FIRST** (penalizes "model-first"); real
  surfaces (Homefeed/Pinnability, Related Pins, Ads, Visual Search/Lens, Shopping); **graph
  ML/embeddings heritage** (PinSage GCN, PinnerSage, ItemSage, OmniSearchSage); genuine depth (must
  derive any term you invoke, e.g., contrastive learning, transformer internals).
- **Canonical prompts:** Homefeed personalization; Related Pins; ad ranking; visual search; spam
  detection; search.
- **GenAI shift:** transformers/multimodal foundation reps (PinCLIP, OmniSage); fine-tune vs
  in-context, inference optimization, RAG for AS/RS (don't over-index — core stays classical recsys).

### Stripe (+ fintech fraud) [corroborated]
- **Loop:** coding (practical/CoderPad, *not* LeetCode) + HM + **ML design** + **ML "bug squash"
  (debug buggy code — often a real Stripe bug: data leakage, transform error, drift)** + **ML coding**
  (build+evaluate a model in ~1hr in a notebook) + behavioral.
- **Distinctive:** Stripe hires engineers to build **decision systems** — the model is one component
  among pipelines, thresholds, human-in-the-loop, monitoring, rollback. Questions are framed "how
  would you design/balance/respond when…", not "which algorithm?". Signature topics: **asymmetric
  cost (FP friction vs FN $ loss) via a cost matrix, not accuracy/AUC**; **AUPRC > AUROC** under
  imbalance; ~100ms real-time scoring (Radar); transaction features (velocity, device fingerprint,
  IP reputation); **label delay** (chargebacks lag 30–90 days) → concept drift → continuous
  retraining. Behavioral probe: "What happens three months later? How does this system fail?"
- **Canonical prompts:** design a (real-time) fraud-detection / credit-risk system (Archetype 5);
  "the fraud model blocks too many legit transactions — what do you do?"; DS: 3DS-onboarding
  experiment when merchants share fraud infra (why randomization breaks). **No LLM/GenAI** confirmed
  in first-hand reports — the loop stays classic tabular/streaming ML.
- **Other fintechs:** PayPal ("reduce false declines without raising fraud loss"; AUPRC, precision@k);
  Affirm (logistic-regression coefficient interpretation; credit-risk model drift); Block/Cash App
  (whole-pipeline "why"; P2P fraud/bot patterns); Coinbase (crypto anomaly; irreversibility,
  compliance, human-review queues).

### OpenAI [corroborated]
- **Loop:** tech screen (often 1 ML design + 1 pandas coding) → sometimes a **paid 48-hr "Work
  Trial"** take-home (build something real, e.g. a webhook-delivery system; graded on
  reliability/testing) → onsite: coding + ML coding/debug + **LLM system design (most-failed round)**
  + project deep-dive + behavioral. **Coding bar is non-negotiable** (a low coding score sinks the
  loop); coding has shifted from trick-LeetCode to **production-oriented, evolving-spec** problems.
- **Canonical coding:** **LRU cache** (then extended), versioned/time-based KV store (+ concurrency),
  in-memory DB, **rate limiter (sliding window)**, resumable iterator over a large dataset. ML coding:
  **self-attention from scratch** (softmax(QKᵀ/√d_k)V), a BPE tokenizer, **backprop for a 2-layer NN
  in vectorized NumPy**, debug a broken PyTorch setup; conceptual: GQA vs MQA + KV-cache memory at
  100K context, why LayerNorm > BatchNorm in transformers.
- **LLM system design (distinctive, with hard budgets):** "enterprise RAG search" — 5M docs,
  indexed in 5 min, 300 QPS, multi-tenant ACL, p95 ≤ 1.2s, ≤ $0.002/query (chunking, **hybrid BM25 +
  ANN**, query reformulation, **cross-encoder rerank**); ChatGPT for 100M users; cross-conversation
  memory; **distributed training** (partition params across thousands of GPUs, OOM recovery, a job
  queue for 100k+ GPU jobs with preemption/checkpointing). **Evals heavily weighted** — design
  regression/eval suites and **LLM-as-judge** from a labeled gold set; red-teaming.

### Anthropic [corroborated]
- **Loop:** recruiter (mission-alignment heavy) → coding (90-min CodeSignal take-home **or** 60-min
  live) → onsite: system design + ML depth + **values** + (RS) a 1-hr research presentation; Applied
  AI adds a **customer-conversation simulation** (highest-signal). **AI tools prohibited** in live
  rounds and (unless told) in take-homes — candidates have been removed for using them.
- **Distinctive:** **safety is the product** (HHH, Constitutional AI, RLHF → RLAIF); the **values/
  behavioral round is uniquely heavy and the most-failed** ("Why Anthropic?", "a time you acted
  against your own values", "assigned to a project you believed was unsafe — what do you do?");
  **evolving-spec coding** (e.g., implement a bank with record/hold → top-k accounts → scheduled
  transactions → merge-accounts-keeping-histories; candidates run out of time).
- **Canonical prompts:** design the Claude chat service; **end-to-end LLM batching system** ("100
  requests take the same time as 1"); 100K req/s token-generation service; tool-using agent via MCP;
  diagnose **reward hacking** in the RLHF pipeline; design an experiment to detect hallucinations;
  Applied-AI design centers on **eval harnesses** ("can you measure whether Claude actually helped
  the customer?") over RAG. (See Archetype 10.)

### Other frontier labs [corroborated]
- **Mistral:** implement MHA in PyTorch (batched + causal mask), RoPE / a sampling algo from scratch;
  KV caching; scaling laws. **Cohere:** production ML code (Python/Go), top-k token decoding; design
  rooted in Command/Embed/Rerank (RAG, embeddings, eval, low-latency multi-tenant serving); "answer
  questions about events after the training cutoff." **xAI:** practical/OO coding (iterators, KV
  stores, caches) prioritizing bug-free completeness; two **post-training** sessions + a vision talk.
  **Meta GenAI/FAIR:** LLM internals (KV cache, GQA, RoPE, MoE), post-training (SFT/DPO/GRPO/PEFT),
  "reduce hallucinations with eval+training under 300ms latency", RAG-only vs fine-tune vs both.

---

## Part 5 — ML-coding & ML breadth/depth question bank

These map to the *coding* and *breadth/depth* rounds (distinct from system design). Many become
ML-coding quiz questions per `authoring-lessons` §5 (the "library-specific debugging" and
"implement from scratch" question types).

**Implement-from-scratch (NumPy/PyTorch, often no sklearn)** — reported at Meta, Amazon, Uber,
DoorDash, Snap, Apple, Pinterest, Microsoft:
- k-means / k-means++ (vectorized; loop to centroid stability) — *the most common*.
- Logistic regression (stable sigmoid, log-likelihood, gradients, gradient checking).
- Linear regression (closed-form vs gradient descent), KNN (vectorized distance, tie-breaking).
- Naive Bayes; a single gradient-descent step; decision-tree split (entropy/Gini/info-gain by hand).
- A 2D convolution (stride/padding); an MLP / attention / layernorm / optimizer from scratch and
  "overfit a toy sample"; debug a given broken training loop.

**ML breadth (rapid-fire)** — Amazon, LinkedIn, Instacart, Apple, Microsoft:
- bias–variance; L1 vs L2; bagging vs boosting; supervised vs unsupervised; cross-validation;
  precision/recall/F1, AUC-ROC vs PR-AUC; overfitting detection & fixes; ReLU; batch vs layer norm
  (and why LayerNorm in transformers); choosing k clusters when unknown; OLS assumptions; p-values.

**ML depth (derivations & internals)** — Amazon, Microsoft, Apple, Snap, DeepMind:
- "Trace a token through a transformer"; attention O(N²) + Flash/Sparse attention; **scaled
  dot-product attention & why ÷√d_k**; BERT vs GPT; masked vs causal LM; debug vanishing/exploding
  gradients; backprop / BPTT; "prove MSE is non-convex for logistic regression" (Hessian); **"why L1
  over L2" via gradients, not "it gives sparsity"** (DeepMind's bar); LoRA/PEFT; RLHF / **DPO vs PPO**;
  quantization (2-bit, why it preserves accuracy); RoPE; **Chinchilla FLOPs C≈6·P·D**.

**Frontier-lab "implement from scratch in PyTorch/NumPy"** — OpenAI, Anthropic, Mistral, Cohere,
Meta GenAI, DeepMind (the dominant frontier signal; AI tools usually banned):
- **Multi-head self-attention** (no `nn.MultiheadAttention`; batched, causal mask), RoPE,
  **token decoding / sampling** (top-k, nucleus/top-p), a BPE/WordPiece tokenizer, an MLP/Transformer
  training loop, **backprop derived + vectorized by hand**, KL divergence; debug a broken PyTorch
  run / memory leak.
- **"Evolving-spec" coding** (Anthropic, OpenAI, DeepMind breadth round): solve a problem, then the
  interviewer **stacks new requirements** forcing refactors (versioned KV store; a bank that grows
  record→top-k→scheduled→merge; "first use a library, now implement it from scratch"). Graded on
  clean iteration under pressure, not one clever trick.

**These tie directly into existing lessons:** c1.2 (losses/Huber for ETA), c1.3 (focal/class-balanced
for fraud/harmful), c1.9 (CV/bias-variance), c1.10 (AUC vs calibration for ads), c1.11 (imbalance for
fraud). A design-rehearsal lesson should *reuse* those derivations in context.

---

## Part 6 — Cross-cutting interview gotchas & common mistakes

The mistakes graders penalize, aggregated across all sources — reuse these in "Interview gotchas"
sections (mapping "the question they'll ask" → "what a strong answer contains"):

1. **Skipping scoping** — designing before clarifying problem, scale, and the binding constraint.
2. **Loss ≠ business objective** — the single most-cited substantive error (Hello Interview).
3. **No funnel** — one model over the whole corpus; conflating retrieval with ranking.
4. **Offline metric ≠ online impact** — treating AUC/NDCG as proof of value; ignoring that only
   A/B establishes causal lift, and that the offline metric must be *shown to predict* the online one.
5. **Sloppy labels** — "not clicked = negative"; ignoring negative sampling, position bias, delayed
   labels, leakage (ties to c1.1).
6. **Reaching for deep learning by default** — not justifying the jump by data/latency/cost; not
   knowing when GBDT/logistic/classical-time-series wins.
7. **Stopping at the model** — no serving, feature store, **training-serving skew**, drift,
   retraining, rollback, monitoring.
8. **Calibration blindness** — great AUC, broken auction/probabilities (ads); ties to c1.10.
9. **Imbalance naïveté** — accuracy at 1% prevalence; no PR-curve threshold reasoning (ties c1.11).
10. **No curiosity** — reciting the standard story without surfacing a feedback loop, bias, or
    failure mode (the course's signature move; `authoring-lessons` §4).

---

## Part 7 — How to turn this into lessons

- **Design-rehearsal lessons** (the curriculum gap): pick one **archetype × company surface** (e.g.,
  "Design Reels recommendation" = Archetype 1 × Meta), walk the **unified framework** (Part 1C),
  and hit the depth bar (`authoring-lessons` §3) — derive the metric choice, quantify the
  funnel's latency budget, ground it in the company's real system (DeepETA, PinSage, 360Brew…), and
  end on the **"challenge the standard story"** hook from the archetype.
- **Existing concept lessons:** add/upgrade the **Interview gotchas** section using Part 6 and the
  relevant archetype's "challenge the standard story," so c1.2→ETA loss, c1.3→harmful-content,
  c1.10→ad calibration, c1.11→fraud are explicitly connected to a real design prompt.
- **Quizzes:** the Part-5 bank seeds "implement-from-scratch" and "derive/prove" questions;
  archetype "challenge the standard story" hooks seed the construct-a-counter-example questions.
- **Honor the accuracy bar:** teach **[corroborated]** facts as fact; teach **[reported]** prompts as
  representative shapes, never as verbatim company quotes; cite the company's primary eng-blog/paper
  when you name a production system.

---

## Part 8 — Source map & provenance

Primary prep frameworks (the two the learner named):
- Hello Interview — *ML System Design in a Hurry* (delivery framework, evaluation, problem
  breakdowns: video-recommendations, harmful-content, bot-detection; community question DB).
- Educative — *Grokking the Machine Learning Interview* and *Machine Learning System Design*
  (the 6-step template + 9–14 case studies).

Candidate-report sources: Blind, Glassdoor, LeetCode discuss, 1point3acres, interviewing.io,
Exponent, InterviewQuery, igotanoffer, datainterview, Yuan-Meng's MLE-interview write-ups,
alirezadir's ML-interviews repo (the "9-step" template).

Company primary systems cited (for §7-compliant grounding): Uber **DeepETA** & **Michelangelo**;
Pinterest **PinSage / PinnerSage / OmniSearchSage / PinCLIP**; LinkedIn **LiGNN** (KDD 2024) &
**360Brew** (arXiv 2501.16450); Netflix **foundation model** (artwork personalization via LLM
post-training); Snap **ad ranking** & embedding-based friend retrieval; Instacart **real-time
availability** (G-T-R); Airbnb **listing embeddings** (KDD 2018) & marketplace-interference paper
(arXiv 2004.12489); Facebook **"Practical Lessons from Predicting Clicks on Ads."**

> Reliability note: most aggregator and forum pages block automated fetching, so verbatim prompt
> wording is **[reported]** (paraphrase-level) while loop structures, archetypes, metrics, and the
> company-system architectures are **[corroborated]** across multiple independent sources and
> company publications. Re-verify any exact API/version/paper claim against the primary source
> before putting it in a lesson, per `authoring-lessons` §7.
