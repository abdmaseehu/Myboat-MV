/**
 * Deciding whether HTML can safely be opened in the visual editor.
 *
 * TipTap has a schema, and anything outside it is discarded on load — not
 * flagged, not preserved, discarded. Open a pasted 38 KB layout in it and what
 * comes back is the words with the design stripped out. That is the same
 * failure mode that already cost this CMS a <style> block once, so the editor
 * asks before it does it rather than after.
 *
 * The check is deliberately generous about what counts as complex. A false
 * positive costs a dismissible warning; a false negative costs the layout.
 */

/** Markup the visual editor has no representation for. */
const SIGNALS = [
  { pattern: /<style[\s>]/i, label: 'a <style> block' },
  { pattern: /<iframe[\s>]/i, label: 'an embedded iframe' },
  { pattern: /<svg[\s>]/i, label: 'inline SVG' },
  { pattern: /<(section|article|aside|header|footer|nav|main)[\s>]/i, label: 'layout sections' },
  { pattern: /\sstyle\s*=\s*["']/i, label: 'inline styles' },
  { pattern: /<(select|option|input|button|label)[\s>]/i, label: 'form controls' },
  { pattern: /<(video|audio|picture|source)[\s>]/i, label: 'media elements' },
];

/**
 * How many class attributes before markup is "designed" rather than written.
 *
 * A hand-typed paragraph carries none. Two or three might survive a copy from
 * another editor. A pasted layout has dozens, and they are the whole point of
 * it.
 */
const CLASS_THRESHOLD = 3;

/**
 * @param {string} html
 * @returns {{ complex: boolean, reasons: string[] }}
 */
export function inspectHtml(html) {
  const input = String(html || '');
  if (!input.trim()) return { complex: false, reasons: [] };

  const reasons = SIGNALS.filter((s) => s.pattern.test(input)).map((s) => s.label);

  const classCount = (input.match(/\sclass\s*=\s*["']/gi) || []).length;
  if (classCount >= CLASS_THRESHOLD) {
    reasons.push(`${classCount} styling classes`);
  }

  return { complex: reasons.length > 0, reasons };
}

/**
 * Which mode to open a page in.
 *
 * Existing complex markup opens in HTML, because that is the mode that can
 * actually hold it. Everything else — including a brand new page — opens in
 * the visual editor, which is the one most people want most of the time.
 */
export const preferredMode = (html) => (inspectHtml(html).complex ? 'html' : 'visual');
