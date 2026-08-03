/**
 * Customer contact details on charter/logistics requests are Myboat's to hold.
 * Operators quote on the trip, not on the person, so they never receive the
 * name, email or phone — administrators do.
 *
 * This must happen server-side. Hiding the fields in the dashboard still ships
 * them in the JSON, where anyone can read them from the network tab.
 */
const CONTACT_FIELDS = ['guestName', 'guestEmail', 'guestPhone'];

/** Strip contact details from one request record. */
function redactRequestContact(request) {
  if (!request) return request;
  const out = { ...request };
  CONTACT_FIELDS.forEach((f) => {
    if (f in out) out[f] = null;
  });
  // The customer's account is joined on some endpoints; it carries the same
  // details by another name.
  if (out.user) {
    out.user = { id: out.user.id };
  }
  // Flag so the UI can explain the blank rather than showing empty fields.
  out.contactRedacted = true;
  return out;
}

/**
 * Redact unless the viewer is allowed to see contact details.
 * ADMIN sees everything; the customer who raised the request sees their own.
 */
function redactForViewer(request, user) {
  if (!request || !user) return request;
  if (user.role === 'ADMIN') return request;
  if (request.userId && request.userId === user.id) return request;
  return redactRequestContact(request);
}

const redactListForViewer = (list, user) =>
  Array.isArray(list) ? list.map((r) => redactForViewer(r, user)) : list;

module.exports = { redactRequestContact, redactForViewer, redactListForViewer };
