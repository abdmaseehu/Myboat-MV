/**
 * Payment details for requests Myboat handles itself.
 *
 * A "Request Boat MV" has no operator — Myboat sources the boat and quotes it,
 * so the customer pays Myboat directly. These are the platform's own accounts,
 * set in Admin -> Settings -> Bank Details, and they mirror the shape an
 * operator's accounts take so the payment page needs no special case.
 */
const KEYS = {
  MVR_NAME: 'ADMIN_BANK_MVR_NAME',
  MVR_HOLDER: 'ADMIN_BANK_MVR_HOLDER',
  MVR_ACCOUNT: 'ADMIN_BANK_MVR_ACCOUNT',
  USD_NAME: 'ADMIN_BANK_USD_NAME',
  USD_HOLDER: 'ADMIN_BANK_USD_HOLDER',
  USD_ACCOUNT: 'ADMIN_BANK_USD_ACCOUNT',
  SITE_NAME: 'SITE_NAME',
  SITE_LOGO: 'SITE_LOGO',
  CONTACT_EMAIL: 'CONTACT_EMAIL',
  CONTACT_PHONE: 'CONTACT_PHONE',
};

/**
 * @returns {Promise<{operator: object, bank: object, configured: boolean}>}
 *   `configured` is false when the account for that currency is blank, so the
 *   caller can say "we'll be in touch" rather than show an empty panel.
 */
async function getPlatformPaymentDetails(prisma, currency = 'MVR') {
  const rows = await prisma.setting.findMany({
    where: { keyName: { in: Object.values(KEYS) } },
    select: { keyName: true, value: true },
  });
  const get = (k) => {
    const v = rows.find((r) => r.keyName === k)?.value;
    return v && String(v).trim() ? String(v).trim() : null;
  };

  const isUsd = String(currency).toUpperCase() === 'USD';
  const bank = isUsd
    ? {
        currency: 'USD',
        bankName: get(KEYS.USD_NAME),
        accountName: get(KEYS.USD_HOLDER),
        accountNumber: get(KEYS.USD_ACCOUNT),
      }
    : {
        currency: 'MVR',
        bankName: get(KEYS.MVR_NAME),
        accountName: get(KEYS.MVR_HOLDER),
        accountNumber: get(KEYS.MVR_ACCOUNT),
      };

  return {
    operator: {
      id: null,
      businessName: get(KEYS.SITE_NAME) || 'Myboat MV',
      businessLogo: get(KEYS.SITE_LOGO),
      contactEmail: get(KEYS.CONTACT_EMAIL),
      contactPhone: get(KEYS.CONTACT_PHONE),
      isPlatform: true,
    },
    bank,
    configured: !!bank.accountNumber,
  };
}

module.exports = { getPlatformPaymentDetails };
