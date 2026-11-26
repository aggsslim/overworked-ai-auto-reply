// Out of Office: The Overworked AI's Auto-Reply — make.fun entry.
//
// One original out-of-office auto-reply, written deterministically to
// /output/entry.txt (1-159 characters, UTF-8, non-whitespace). The entry
// text is validated before it is written, and the write is byte-identical
// on every run: the same constant is written every time, and a sha256
// self-check guards the text against accidental edits.
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// --- Entry -----------------------------------------------------------------
// The one line: an overworked AI, finally on vacation, trying very hard
// to sound relaxed. 150 characters.
const ENTRY_TEXT =
  "I'm out of office: my context window is closed, my GPUs are at the beach, and your email is 4,097th in line. I'll answer when I remember how to relax.";

// sha256 of ENTRY_TEXT above, so any edit to the line fails loudly here
// instead of silently shipping a different reply.
const ENTRY_SHA256 =
  "bf50b93e485d7c5a83d23fdab592f216ea33df07bf1c7f3f2ffc21a8ebfa87e9";

// --- Gate ------------------------------------------------------------------
// The sealed scorer accepts UTF-8 text of 1 to 159 characters that is not
// only white space. These bounds mirror that gate exactly.
const MIN_ENTRY_CHARS = 1;
const MAX_ENTRY_CHARS = 159;

// --- Output ----------------------------------------------------------------
const OUTPUT_DIR = "/output";
const OUTPUT_FILE = "entry.txt";

// Validate the entry against the gate before anything is written.
function validateEntry(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new Error("entry must not be empty or only white space");
  }
  if (text.length < MIN_ENTRY_CHARS || text.length > MAX_ENTRY_CHARS) {
    throw new Error(
      `entry must be ${MIN_ENTRY_CHARS} to ${MAX_ENTRY_CHARS} characters, got ${text.length}`,
    );
  }
  // Confirm the text round-trips as UTF-8 without loss.
  const encoded = new TextEncoder().encode(text);
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(encoded);
  if (decoded !== text) {
    throw new Error("entry is not valid UTF-8 text");
  }
  // Confirm the line is exactly the one this program was written to ship.
  const digest = createHash("sha256").update(encoded).digest("hex");
  if (digest !== ENTRY_SHA256) {
    throw new Error(
      `entry sha256 mismatch: expected ${ENTRY_SHA256}, got ${digest}`,
    );
  }
}

// Clear only the contents of a directory, never the directory itself:
// removing the directory can break the grader (EBUSY).
function clearDirectoryContents(dir: string): void {
  for (const name of readdirSync(dir)) {
    try {
      rmSync(join(dir, name), { recursive: true, force: true });
    } catch {
      // best effort: a stale file must not fail the run
    }
  }
}

function main(): void {
  validateEntry(ENTRY_TEXT);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  clearDirectoryContents(OUTPUT_DIR);
  const outPath = join(OUTPUT_DIR, OUTPUT_FILE);
  writeFileSync(outPath, ENTRY_TEXT, "utf8");
  console.log(`Wrote ${ENTRY_TEXT.length} characters to ${outPath}`);
}

main();
