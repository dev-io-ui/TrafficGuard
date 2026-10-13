require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const User = require('./models/User');
const Region = require('./models/Region');
const Vehicle = require('./models/Vehicle');
const FineSchedule = require('./models/FineSchedule');
const india = require('./data/india');
const { DEFAULT_FINES } = require('./utils/constants');

const title = (s) => String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

async function seedGeo() {
  const UT = india['@UT'], PINS = india['@PINS'];
  const entries = [...Object.entries(india).filter(([k]) => !k.startsWith('@')).map(([s, d]) => [s, d, 'State']), ...Object.entries(UT).map(([s, d]) => [s, d, 'Union Territory'])];
  for (const [state, districts, kind] of entries) {
    const doc = await Region.findOneAndUpdate({ country: 'India', state }, { $setOnInsert: { kind } }, { upsert: true, new: true });
    for (const d of districts) {
      let dist = doc.districts.find((x) => x.name === d);
      if (!dist) { doc.districts.push({ name: d, pincodes: [] }); dist = doc.districts[doc.districts.length - 1]; }
      for (const [code, area] of PINS[state]?.[d] || []) if (!dist.pincodes.some((p) => p.code === code)) dist.pincodes.push({ code, area });
    }
    await doc.save();
  }
  console.log(`Geography ready: ${entries.length} states/UTs`);
}

async function importCsv(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  const head = lines.shift().split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  const ix = (n) => head.findIndex((h) => h.includes(n));
  const [ip, io, id, is] = [ix('pincode'), ix('officename'), ix('district'), ix('statename')];
  const regions = await Region.find({ country: 'India' });
  const byName = Object.fromEntries(regions.map((r) => [r.state.toLowerCase(), r]));
  let n = 0;
  for (const line of lines) {
    const c = line.split(',').map((x) => x.trim().replace(/"/g, ''));
    const st = byName[c[is]?.toLowerCase()] || byName[c[is]?.toLowerCase().replace(' & ', ' and ')];
    if (!st || !/^\d{6}$/.test(c[ip])) continue;
    const dn = title(c[id]);
    let d = st.districts.find((x) => x.name.toLowerCase() === dn.toLowerCase() || x.name.toLowerCase().startsWith(dn.toLowerCase() + ' '));
    if (!d) { st.districts.push({ name: dn, pincodes: [] }); d = st.districts[st.districts.length - 1]; }
    if (!d.pincodes.some((p) => p.code === c[ip])) { d.pincodes.push({ code: c[ip], area: title(c[io] || '').replace(/ B\.o| S\.o| H\.o/gi, '') }); n++; }
  }
  await Promise.all(regions.map((r) => r.save()));
  console.log(`Imported ${n} pincodes from ${file}`);
}

async function seedDemo() {
  for (const [k, v] of Object.entries(DEFAULT_FINES)) await FineSchedule.updateOne({ state: '*', violationType: k }, { amount: v }, { upsert: true });
  const demo = [
    ['Super Admin', 'admin@roadwatch.in', 'admin'],
    ['Telangana Admin', 'regional@roadwatch.in', 'regional_admin', 'Telangana'],
    ['Officer Rao', 'officer@roadwatch.in', 'officer', 'Telangana', 'Hyderabad', 'TS-1042'],
    ['Supervisor Reddy', 'supervisor@roadwatch.in', 'supervisor', 'Telangana', 'Hyderabad'],
    ['Finance Officer', 'finance@roadwatch.in', 'finance'],
    ['Demo Citizen', 'citizen@roadwatch.in', 'citizen'],
  ];
  for (const [name, email, role, state, district, badgeNumber] of demo) {
    if (await User.findOne({ email })) continue;
    await User.create({ name, email, password: 'Password@123', role, state, district, badgeNumber });
    console.log(`  ${role.padEnd(15)} ${email} / Password@123`);
  }
  const citizen = await User.findOne({ email: 'citizen@roadwatch.in' }), admin = await User.findOne({ email: 'admin@roadwatch.in' });
  if (citizen && !(await Vehicle.findOne({ regNo: 'TS09AB1234' })))
    await Vehicle.create({ regNo: 'TS09AB1234', chassisNo: 'MA3EWB10SK0123456', type: 'Car', ownerName: citizen.name, owner: citizen._id, addedBy: admin?._id });
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const args = process.argv.slice(2);
  await seedGeo();
  const csv = args.find((a) => a.endsWith('.csv'));
  if (csv) await importCsv(csv);
  if (!args.includes('--geo-only')) await seedDemo();
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
