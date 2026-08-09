const Settings = require('../models/Settings');

// Settings is a single-document collection (site-wide config).
// This helper fetches it, creating the default doc on first use.
const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

// GET /api/settings  (admin)
const getSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

// PUT /api/settings  (admin — partial update of any fields)
const updateSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();

    const {
      siteName,
      contactPhone,
      contactEmail,
      address,
      whatsappNumber,
      socialLinks,
      warrantyPolicy,
      ptaPolicyInfo,
      isStoreOpen,
    } = req.body;

    if (siteName !== undefined) settings.siteName = siteName;
    if (contactPhone !== undefined) settings.contactPhone = contactPhone;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (address !== undefined) settings.address = address;
    if (whatsappNumber !== undefined) settings.whatsappNumber = whatsappNumber;
    if (warrantyPolicy !== undefined) settings.warrantyPolicy = warrantyPolicy;
    if (ptaPolicyInfo !== undefined) settings.ptaPolicyInfo = ptaPolicyInfo;
    if (isStoreOpen !== undefined) {
      settings.isStoreOpen = isStoreOpen === 'true' || isStoreOpen === true;
    }
    if (socialLinks !== undefined) {
      settings.socialLinks = {
        ...settings.socialLinks.toObject(),
        ...socialLinks,
      };
    }

    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

// GET /api/public/settings  (storefront — public-safe subset)
const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      success: true,
      settings: {
        siteName: settings.siteName,
        contactPhone: settings.contactPhone,
        contactEmail: settings.contactEmail,
        address: settings.address,
        whatsappNumber: settings.whatsappNumber,
        socialLinks: settings.socialLinks,
        warrantyPolicy: settings.warrantyPolicy,
        ptaPolicyInfo: settings.ptaPolicyInfo,
        isStoreOpen: settings.isStoreOpen,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings, getPublicSettings };
