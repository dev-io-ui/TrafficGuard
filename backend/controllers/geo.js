const Region = require('../models/Region');
exports.countries = (req, res) => res.json({ countries: ['India'] });
exports.states = async (req, res, next) => {
  try { res.json({ states: (await Region.find({ country: req.query.country || 'India' }).select('state').sort('state')).map((r) => r.state) }); } catch (e) { next(e); }
};
exports.districts = async (req, res, next) => {
  try {
    const r = await Region.findOne({ state: req.query.state });
    res.json({ districts: (r?.districts || []).map((d) => d.name).sort() });
  } catch (e) { next(e); }
};
exports.pincodes = async (req, res, next) => {
  try {
    const r = await Region.findOne({ state: req.query.state });
    const d = r?.districts.find((x) => x.name === req.query.district);
    res.json({ pincodes: d?.pincodes || [] });
  } catch (e) { next(e); }
};
