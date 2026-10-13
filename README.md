# RoadWatch v2 — Region-aware Traffic Violation Reporting & Fine Management (MERN)

Citizens report violations with photo/video evidence → district officers validate and issue fines →
vehicle owners pay online and get a receipt → supervisors decide appeals.

## Roles
| Role | What they do |
|---|---|
| citizen | Report violations, track reports, register vehicles, view/pay fines, print receipts, dispute fines |
| officer | Reviews reports in their **district**: validate (issues fine), reject, or request more info |
| supervisor | Decides appeals in their district (uphold / reduce / waive, with written reason) |
| finance | Payments ledger, refunds, revenue, CSV export |
| regional_admin | Manages officers/supervisors/finance and the fine schedule for their **state** |
| admin | Everything, incl. regional admins, default fine schedule and the audit log |

## Setup (Node 18+, MongoDB local or Atlas)
```
cd backend
npm install
npm run seed          # geography + fine schedule + demo accounts
npm run dev           # http://localhost:5000

cd ../frontend
npm install
npm run dev           # http://localhost:5173
```
Edit `backend/.env` first (`MONGO_URI`, **`JWT_SECRET`**, `CLIENT_ORIGIN`).

## Demo accounts (password `Password@123` — change them)
admin@roadwatch.in · regional@roadwatch.in (Telangana) · officer@roadwatch.in (Hyderabad, Telangana) ·
supervisor@roadwatch.in (Hyderabad) · finance@roadwatch.in · citizen@roadwatch.in

## Quick walkthrough
1. citizen: Report violation for a vehicle that is NOT yours (e.g. `TS10CD5678`; Telangana → Hyderabad, pincode, photos/video). `TS09AB1234` is the demo citizen's own vehicle, so it cannot be reported by that account.
2. officer: Review queue → open the report → Validate & issue fine.
3. Anyone (no login): landing page → **Check / pay challan** → search `TS10CD5678` → Pay → note the receipt no. / payment ID. Later use **Find receipt** with either number. A logged-in owner can also dispute a fine; the supervisor decides.
4. finance: refunds/exports. admin: staff, fine schedule, audit log.

## Geography
All Indian states/UTs are seeded. Telangana has all 33 districts and sample pincodes; other states carry major
districts only. To load the **full** national district + pincode list, download the India Post "All India Pincode
Directory" CSV (columns: pincode, officename, district, statename) and run:
`npm run seed:geo -- path/to/pincodes.csv`
The pincode field accepts any 6-digit code (suggestions come from the dropdown list when available).

## Notes / not included
- Payment is a demo gateway (no Razorpay/Stripe yet); receipts print via the browser (Save as PDF) and can be verified at `/verify/<receipt no>`.
- Uploads are stored on local disk and served publicly by file name; use object storage + signed URLs for production.
- Not included: email/SMS, in-app notifications, i18n (Telugu/Hindi), refresh tokens, Docker, automated tests.
- Set HTTPS in production (camera/video recording need a secure context).

## Who verifies a report? (v2.1)
1. On submit, the report is auto-assigned to the least-busy active **officer posted in the same state + district**.
2. If no officer is posted there, it goes to the review queue of that state's **supervisors / regional admin** and the **super admin**
   (all of them have a "Review reports" tab and can verify and issue the fine).
3. The reviewer opens the evidence, then **Verify evidence & issue fine** (confirmation dialog), **Reject**, or **Request info**.
   No fine exists until a reviewer does this. The amount field is only a suggestion from the fine schedule.
4. The citizen sees who is reviewing it and the current status. Citizens cannot report their own registered vehicle.
To receive reports for a district, create an officer for it (Admin → Staff) with that state and district.

## Vehicles, challan search and receipts (v2.2)
- **Only admins (and regional admins) add vehicles** — Admin → Vehicles: registration no., chassis no., type, owner name/mobile, and an optional owner account email.
  Citizens cannot add vehicles; "My vehicles" shows the ones an admin linked to their email.
- **Public challan search (no login):** landing page search or `/search` — by vehicle number, chassis number or challan number.
  Shows all challans on that vehicle (owner name is masked) and lets anyone pay with just a name (+ optional mobile).
- **Public receipt search:** `/receipts` — by receipt number, payment ID or challan number (also `/verify/<number>`).
- Public endpoints are rate-limited. Evidence photos/videos and reporter identity are never exposed publicly.
