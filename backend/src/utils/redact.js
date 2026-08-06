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
 * A charter carries three numbers: what the customer pays, what the operator
 * asked for, and how the two shares divide. `quotedPrice` holds the customer's
 * price, because that is what every payment screen already reads.
 *
 * An operator asked for their own figure, so that is what `quotedPrice` must
 * mean to them: prefilling their quote form with a marked-up published rate
 * would have them re-quote it and the markup would compound. They also see
 * what the customer pays and what they will actually receive, under names of
 * their own — an operator settling with Myboat should not have to work out
 * their own payout.
 *
 * A customer sees their price and nothing else. What the operator settles for
 * is not theirs to know.
 */
function priceForViewer(request, user) {
  if (!request || !('vendorQuotedPrice' in request)) return request;

  if (user?.role === 'ADMIN') return request;

  const out = { ...request };
  if (user?.role === 'VENDOR') {
    out.publicPrice = request.quotedPrice;
    // Null when a quote predates the engine; the two were the same then.
    out.quotedPrice = request.vendorQuotedPrice ?? request.quotedPrice;
    out.vendorNetAmount = request.vendorNetAmount ?? request.quotedPrice;
    return out;
  }

  delete out.vendorQuotedPrice;
  delete out.platformCutAmount;
  delete out.vendorNetAmount;
  return out;
}

/**
 * Redact unless the viewer is allowed to see contact details.
 * ADMIN sees everything; the customer who raised the request sees their own.
 */
function redactForViewer(request, user) {
  if (!request || !user) return request;
  const priced = priceForViewer(request, user);
  if (user.role === 'ADMIN') return priced;
  if (priced.userId && priced.userId === user.id) return priced;
  return redactRequestContact(priced);
}

const redactListForViewer = (list, user) =>
  Array.isArray(list) ? list.map((r) => redactForViewer(r, user)) : list;

module.exports = {
  redactRequestContact,
  priceForViewer,
  redactForViewer,
  redactListForViewer,
};
