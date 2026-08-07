const createDOMPurify = require('isomorphic-dompurify');

/**
 * Cleaning HTML that will be rendered unescaped on the public site.
 *
 * Until now the only defence was that authoring is administrator-only, which
 * holds exactly as long as no administrator account is ever compromised and no
 * marketing assistant is ever given one. Neither is a safe assumption to build
 * on, and the cost of being wrong is a script tag on every page of the site.
 *
 * The point is to keep everything a page author legitimately needs and drop
 * only what executes. That distinction matters here more than usual, because
 * the module exists precisely so people can paste layouts: strip too much and
 * the feature is gone.
 *
 *   kept     structure, tables, <style> blocks, inline styles, classes, data
 *            attributes, images, inert form controls, and <iframe> — the
 *            platform's own embed builder emits an iframe, so removing those
 *            would break Myboat's own workflow
 *
 *   dropped  <script>, event handlers (onclick and friends), javascript: and
 *            data: URLs, and <form> — a form on a CMS page is far more likely
 *            to be a phishing prompt than a feature, and without one no
 *            control that survives can post anywhere
 *
 * A note on what this costs: a third-party widget that needs its own <script>
 * — a chat bubble, an analytics snippet, someone else's booking form — will no
 * longer work when pasted into a page. That is the trade being made, not an
 * oversight. Such things belong in the site's own code, where they are
 * reviewed, rather than in a text box.
 */

// Tags a page author has a real use for. Everything else goes.
//
// '#text' has to be here explicitly: supplying ALLOWED_TAGS at all replaces
// DOMPurify's defaults wholesale, and without it every piece of text on the
// page is stripped along with the tags — headings and paragraphs come back
// empty.
const ALLOWED_TAGS = [
  '#text',
  // structure
  'div', 'span', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
  // text
  'a', 'strong', 'b', 'em', 'i', 'u', 's', 'small', 'sub', 'sup', 'mark',
  'blockquote', 'q', 'cite', 'code', 'pre', 'abbr', 'time', 'address',
  // lists
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  // media
  'img', 'picture', 'source', 'figure', 'figcaption', 'video', 'audio', 'track',
  // embeds — the embed builder's own output
  'iframe',
  // presentational
  'style', 'svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'ellipse', 'defs', 'lineargradient', 'radialgradient', 'stop', 'text', 'tspan',
  'use', 'symbol', 'title', 'desc', 'details', 'summary',
  // Form controls, but never <form> itself. A pasted guide often carries a
  // filter or a dropdown, and stripping those leaves visible holes in the
  // layout. Without <form> and without script they submit nowhere and do
  // nothing, so they survive as the furniture they now are.
  'label', 'select', 'option', 'optgroup', 'input', 'textarea', 'button', 'fieldset', 'legend',
];

const ALLOWED_ATTR = [
  'href', 'src', 'srcset', 'sizes', 'alt', 'title', 'target', 'rel',
  'class', 'id', 'style', 'width', 'height', 'align', 'loading', 'decoding',
  'colspan', 'rowspan', 'headers', 'scope', 'datetime', 'lang', 'dir', 'role',
  // iframe
  'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'referrerpolicy', 'sandbox',
  // media
  'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'poster', 'preload',
  // svg
  'viewbox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'points', 'rx', 'ry', 'transform', 'opacity', 'offset', 'stop-color',
  'gradientunits', 'preserveaspectratio', 'aria-hidden', 'aria-label',
  // Inert form controls
  'type', 'value', 'placeholder', 'for', 'name', 'checked', 'selected', 'disabled', 'readonly',
];

/**
 * Schemes a link or image may use.
 *
 * `data:` is absent deliberately: a data: URL can carry an HTML document, and
 * an iframe pointed at one runs whatever is inside it on this origin.
 */
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

const CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOWED_URI_REGEXP,
  // Authors use data-* for their own scripts' hooks and for styling.
  ALLOW_DATA_ATTR: true,
  // A page body is a fragment, not a document — no <html> or <body> wrapper.
  WHOLE_DOCUMENT: false,
  // Drop the element and its contents, rather than leaving the text of a
  // script sitting in the page as prose.
  KEEP_CONTENT: false,
  // <form> is the one that matters: without it, no control can post anywhere.
  FORBID_TAGS: ['script', 'noscript', 'form', 'object', 'embed', 'base', 'meta', 'link'],
  FORBID_ATTR: ['formaction', 'xlink:href', 'action'],
  /**
   * Parse the fragment inside <body>.
   *
   * Without this a leading <style> block is hoisted into the implicit <head>
   * and then dropped as being outside the fragment — silently taking the CSS
   * of any pasted layout with it, which is the one thing such a paste cannot
   * do without.
   */
  FORCE_BODY: true,
};

/**
 * Sanitise a fragment.
 *
 * Returns the clean HTML and whether anything changed, so a save can tell the
 * author their markup was altered instead of silently handing back something
 * different from what they wrote.
 *
 * @param {string|null|undefined} html
 * @returns {{ clean: string, changed: boolean }}
 */
function sanitizeCmsHtml(html) {
  if (html === null || html === undefined) return { clean: html, changed: false };

  const input = String(html);
  if (!input.trim()) return { clean: input, changed: false };

  const clean = createDOMPurify.sanitize(input, CONFIG);

  // What went, worked out by comparing the markup in against the markup out.
  //
  // DOMPurify does publish a `removed` array, but under this build it comes
  // back sparse — three holes where three entries should be — so anything
  // mapped over it silently yields nothing. This is advisory text only; the
  // security decision was made by the sanitiser above, and a wrong label here
  // costs a confusing message, not a hole.
  const removed = [...difference(fingerprint(input), fingerprint(clean))];

  return { clean, changed: removed.length > 0, removed };
}

/**
 * Every tag and attribute a fragment mentions, as a set of 'img' / 'img@src'.
 *
 * `tbody` is excluded because the parser inserts one into any hand-written
 * table, which would otherwise read as markup appearing out of nowhere.
 */
function fingerprint(html) {
  const found = new Set();
  const tagPattern = /<([a-z][a-z0-9-]*)((?:\s+[^<>]*)?)\/?>/gi;

  let match;
  while ((match = tagPattern.exec(String(html))) !== null) {
    const tag = match[1].toLowerCase();
    if (tag === 'tbody') continue;
    found.add(tag);

    const attrPattern = /([a-z_:][a-z0-9_:.-]*)\s*=/gi;
    let attr;
    while ((attr = attrPattern.exec(match[2] || '')) !== null) {
      found.add(`${tag}@${attr[1].toLowerCase()}`);
    }
  }
  return found;
}

const difference = (before, after) => {
  const gone = new Set();
  before.forEach((item) => {
    if (!after.has(item)) gone.add(item);
  });
  return gone;
};

module.exports = { sanitizeCmsHtml, ALLOWED_TAGS, ALLOWED_ATTR };
