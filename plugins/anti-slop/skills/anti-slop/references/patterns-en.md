# English prose patterns

This catalogue lists the tics that make English prose read as machine-written. Each entry gives the tell, a bad example, a rewrite that changes the sentence's shape, and the reason the pattern gives the text away.

**Bad:** lines quote a pattern on purpose, so the scanner skips them. Vocabulary entries also carry one or more **Match:** lines, each holding a regex in backticks. `scripts/scan.mjs` compiles those regexes with the flags `giu`, strips fenced code, inline code spans and the **Bad:** and **Match:** lines from the text under test, and reports every hit with its pattern name and line. Outside those lines, this file names banned words only inside inline code spans, so it passes its own scan.

A hit marks a place to rewrite, not a word to swap. Rebuild the sentence around the fact it was hiding.

## Vocabulary

### The word `delve`

**Tell:** `delve` stands in for "look at" or "examine", often next to "into the intricacies".

**Match:** `\bdelv(?:e|es|ed|ing)\b`

**Bad:** Let's delve into how the cache handles invalidation.

**Rewrite:** The cache drops an entry when its key is written again. Two cases need care: concurrent writes and expired entries.

**Why:** Models reach for this verb far more often than people do, so its presence alone suggests generated text.

### The word `seamless`

**Tell:** `seamless` or `seamlessly` describes an integration or experience without saying what works.

**Match:** `\bseamless(?:ly)?\b`

**Bad:** The plugin integrates seamlessly with your existing workflow.

**Rewrite:** The plugin reads the config you already have. No migration step.

**Why:** The word claims a result and shows no evidence. Naming the concrete behaviour replaces the claim.

### The word `robust`

**Tell:** `robust` praises code or a design without naming a failure it survives.

**Match:** `\brobust(?:ness)?\b`

**Bad:** This change makes the parser more robust.

**Rewrite:** The parser now returns an error for an empty file instead of throwing.

**Why:** A quality word with no case behind it. The reader cannot check it.

### The word `leverage`

**Tell:** `leverage` used as a verb where "use" would do.

**Match:** `\bleverag(?:e|es|ed|ing)\b`

**Bad:** We leverage the existing index to speed up lookups.

**Rewrite:** Lookups read the existing index.

**Why:** A longer word for a plain verb. It pads the sentence and adds no meaning.

### The phrase `it's worth noting`

**Tell:** A sentence that opens by announcing it is worth reading, such as `it's worth noting`, `it is worth mentioning` or `worth pointing out`.

**Match:** `\bit(?:'|’)?s worth (?:noting|mentioning|pointing out|highlighting)\b`

**Match:** `\bit is worth (?:noting|mentioning|pointing out|highlighting)\b`

**Bad:** It's worth noting that the flag is off by default.

**Rewrite:** The flag is off by default.

**Why:** If the sentence is worth reading, the announcement is redundant; if it is not, the sentence should go.

### Stock scene-setters

**Tell:** An opening that sets a scene about the era or the industry before saying anything, such as `in today's fast-paced world`, `in the ever-evolving landscape of` or `in the digital age`.

**Match:** `\bin today(?:'|’)s (?:fast-paced|digital|modern|ever-changing|rapidly evolving)\b`

**Match:** `\bever-(?:evolving|changing)\s+(?:landscape|world|field)\b`

**Match:** `\bin the (?:digital age|modern world)\b`

**Bad:** In today's fast-paced development landscape, tests matter more than ever.

**Rewrite:** The suite failed twice last week on changes nobody had tested. This PR adds the missing test.

**Why:** The opener fits any topic, so it says nothing about this one. Readers learn to skip it.

### Inflated vocabulary

**Tell:** Grand words for ordinary things: `tapestry`, `testament`, `pivotal`, `crucial`, `comprehensive`, `streamline`, `elevate`, `unlock`, `empower`, `showcase`.

**Match:** `\b(?:tapestry|testament|pivotal|streamlines?|streamlined|elevates?|unlocks?|empowers?|showcases?)\b`

**Match:** `\b(?:crucial|comprehensive)\b`

**Bad:** This release unlocks a comprehensive toolkit and streamlines onboarding.

**Rewrite:** This release adds three import commands. A new project now takes one command to set up.

**Why:** The words sound weighty and carry no detail. Counts and commands do the work they pretend to do.

### Announcing what the text will do

**Tell:** A sentence that says what the next sentences will cover, such as `in this section, we will`, `this guide will walk you through`.

**Match:** `\bin this (?:section|guide|article|post|document),? (?:we|you)(?:'ll| will)\b`

**Match:** `\bthis (?:guide|document|section) will (?:walk|take) you\b`

**Bad:** In this section, we will walk through how expiry works.

**Rewrite:** Expiry is lazy: an entry is removed the next time its key is read.

**Why:** The announcement delays the content by a sentence. A human writer starts with the content.

### Stacked transitions

**Tell:** A sentence that opens with `Additionally,`, `Moreover,` or `Furthermore,` to bolt on a point.

**Match:** `(?:^|[.!?]\s+)(?:additionally|moreover|furthermore),`

**Bad:** Additionally, the command prints a summary.

**Rewrite:** The command prints a summary when it finishes.

**Why:** The connective adds a stiff tone and no logic. If the points relate, say how; if not, start a new paragraph.

### Reflex setup reminder

**Tell:** A closing line that tells the reader what to do if they have not yet done the obvious step, such as installing the library, when nobody asked.

**Match:** `\bif you (?:have not|haven't|have yet to) (?:installed|set up|configured)\b`

**Bad:** If you have not installed the library yet, run the command below.

**Rewrite:** Install it with `pip install quillcache`.

**Why:** It addresses a reader the text never describes and makes a one-line fact three lines long. Seen in the RED baseline.

## Structure

### Forced groups of three

**Tell:** Lists of exactly three adjectives, benefits or examples, even when the facts number two or four.

**Bad:** The tool is fast, reliable, and easy to use.

**Rewrite:** The tool sorts 10,000 files in two seconds. Use it with one command.

**Why:** Models default to triads because they sound complete. Real lists have the length of the facts.

### Recap that repeats the body

**Tell:** A final sentence or paragraph that restates what the text just said, often opening with `in summary`, `overall` or `to sum up`. Short texts also restate the cause or the result twice, as the Dutch comment and the README section did in the RED baseline.

**Bad:** In summary, this change fixes the crash by trimming the name before the split.

**Rewrite:** Delete the sentence. The body already said it.

**Why:** A recap suits a long text a reader may skim. In a short one it only repeats.

### Headers or bullets on short text

**Tell:** A heading, a bullet list or bold labels on text under about ten lines, where two or three plain sentences would do. The PR body in the RED baseline opened with a heading above five sentences.

**Bad:** A PR body with a "Summary" heading and four bullets for one fix.

**Rewrite:** Two sentences: the crash and its cause, then the fix. Closes the issue on the last line.

**Why:** Formatting borrowed from long documents makes a short note look like a report. Keep headings only where a template or a commit grammar requires them.

### An em-dash in every sentence

**Tell:** Em-dashes, or spaced hyphens used as dashes, in most sentences of a paragraph, setting off asides.

**Bad:** The fix is small — one line — and the test covers it — fully.

**Rewrite:** The fix is one line, and the test covers it.

**Why:** One dash can be style. A dash in every sentence is a verbal habit of generated text, and it breaks the rhythm of the paragraph.

### Identical sentence openings

**Tell:** Three or more consecutive sentences that start with the same word or construction, such as `This`, `It` or `We`.

**Bad:** This change trims the name. This avoids the crash. This also adds a test.

**Rewrite:** Trimming the name avoids the crash. A new test covers it.

**Why:** Uniform openings give a drumbeat no person writes unprompted. Merge the sentences or lead with different subjects.

## Tone

### Hedging

**Tell:** Qualifiers on facts the writer knows, such as `may potentially`, `might possibly`, `it seems that`, `it appears to be`.

**Match:** `\b(?:may potentially|might possibly|could potentially|can potentially)\b`

**Match:** `\bit (?:seems|appears) (?:that|to be)\b`

**Bad:** This may potentially cause the lookup to fail in some cases.

**Rewrite:** The lookup fails when the name has a trailing space.

**Why:** Stacked qualifiers dodge being wrong. State what is known, and say plainly what is not known.

### Empty enthusiasm

**Tell:** Praise or eagerness before the content, such as `great question`, `absolutely`, `happy to help`, `I'd be glad to`.

**Match:** `\b(?:great|good|excellent) question\b`

**Match:** `\b(?:absolutely|certainly|definitely)!`

**Match:** `\bhappy to help\b`

**Bad:** Great question! I'd be happy to help with that.

**Rewrite:** Start with the answer.

**Why:** In published text there is no conversation to warm up. The cheerfulness is filler and reads as a script.

### Fake balance

**Tell:** A forced two-sided frame where the writer has a view or the facts point one way, such as `on the one hand ... on the other hand`.

**Match:** `\bon the (?:one|other) hand\b`

**Bad:** On the one hand, caching is fast; on the other hand, it adds complexity.

**Rewrite:** Caching cuts the report from four seconds to 200 ms. The price is one more place to invalidate. Take it.

**Why:** Balance is a reflex, not an analysis. It hides the recommendation the reader came for.

### Self-reference

**Tell:** The writer talks about itself or the act of writing, such as `as an AI`, `I hope this helps`, `I've drafted`.

**Match:** `\bas an? (?:ai|language model|assistant)\b`

**Match:** `\bi hope this helps\b`

**Match:** `\bi(?:'|’)ve (?:drafted|prepared|put together)\b`

**Bad:** I've drafted a summary below. I hope this helps!

**Rewrite:** Publish the summary. Leave out the framing.

**Why:** Published text speaks for the project. Meta commentary about the writing is noise to the reader.

## Substance

### Claims without specifics

**Tell:** A benefit stated with no number, case or name behind it, such as `improves performance`, `enhances the user experience`, `significantly improves`.

**Match:** `\b(?:significantly|greatly|dramatically) (?:improves?|enhances?|boosts?|reduces?)\b`

**Match:** `\b(?:improves?|enhances?) (?:overall )?(?:performance|reliability|quality|the user experience)\b`

**Bad:** This change significantly improves performance.

**Rewrite:** Startup drops from 1.8 s to 0.6 s on the sample repo.

**Why:** A claim nobody can check. The specific figure either exists, in which case use it, or it does not, in which case cut the claim.

### Deletable filler

**Tell:** Words and whole sentences that can go with no loss, such as `in order to`, `due to the fact that`, `needless to say`, `at the end of the day`.

**Match:** `\b(?:in order to|due to the fact that|needless to say|it goes without saying|at the end of the day|as previously mentioned)\b`

**Bad:** In order to avoid the crash, we trim the name, due to the fact that spaces broke the split.

**Rewrite:** Trimming the name avoids the crash that a trailing space caused in the split.

**Why:** Each filler phrase costs the reader a beat. A test: delete it, and if the meaning holds, it was filler.

### Vague intensifiers

**Tell:** Degree words that push a claim without measuring it, such as `very`, `really`, `extremely`, `incredibly`, `highly`, `truly`.

**Match:** `\b(?:very|really|extremely|incredibly|highly|truly|massively|vastly)\b`

**Bad:** The new index is extremely fast and really easy to maintain.

**Rewrite:** The new index answers a lookup in under a millisecond, and its build script is 20 lines.

**Why:** Intensifiers stand in for evidence. A measured fact is stronger than any adverb.
