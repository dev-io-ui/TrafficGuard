const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '..', 'uploads', 'reports');
fs.mkdirSync(dir, { recursive: true });

const IMG = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const VID = ['video/mp4', 'video/webm', 'video/quicktime'];

const mw = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 12 },
  fileFilter: (req, file, cb) => {
    const ok = file.fieldname === 'photos' ? IMG.includes(file.mimetype) : file.fieldname === 'videos' ? VID.includes(file.mimetype) : false;
    cb(ok ? null : new Error('Photos must be JPEG/PNG/WEBP/HEIC and videos MP4/WEBM/MOV'), ok);
  },
}).fields([{ name: 'photos', maxCount: 10 }, { name: 'videos', maxCount: 2 }]);

// Check the real file signature, not just the declared MIME type.
function signatureOk(file) {
  const fd = fs.openSync(file.path, 'r'); const b = Buffer.alloc(12); fs.readSync(fd, b, 0, 12, 0); fs.closeSync(fd);
  const hex = b.toString('hex'), ascii = b.toString('latin1');
  if (file.fieldname === 'photos')
    return hex.startsWith('ffd8ff') || hex.startsWith('89504e47') || (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') || ascii.slice(4, 8) === 'ftyp';
  return ascii.slice(4, 8) === 'ftyp' || hex.startsWith('1a45dfa3');
}

module.exports = (req, res, next) => mw(req, res, (err) => {
  const files = [...(req.files?.photos || []), ...(req.files?.videos || [])];
  const drop = () => files.forEach((f) => fs.unlink(f.path, () => {}));
  if (err) { drop(); return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (photos 5 MB, videos 50 MB)' : err.message }); }
  for (const f of files) {
    if (f.fieldname === 'photos' && f.size > 5 * 1024 * 1024) { drop(); return res.status(400).json({ message: 'Each photo must be 5 MB or smaller' }); }
    if (!signatureOk(f)) { drop(); return res.status(400).json({ message: `${f.originalname} is not a valid image/video file` }); }
  }
  next();
});
