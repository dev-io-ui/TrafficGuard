const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const { TYPES } = require('../utils/constants');
const auth = require('../controllers/auth'), geo = require('../controllers/geo'), veh = require('../controllers/vehicles'),
  rep = require('../controllers/reports'), fin = require('../controllers/fines'), usr = require('../controllers/users'), st = require('../controllers/stats');

const STAFF = ['officer', 'supervisor', 'finance', 'regional_admin', 'admin'];

// public
router.post('/auth/register', [body('name').trim().notEmpty().withMessage('Name is required'), body('email').isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')], validate, auth.register);
router.post('/auth/login', [body('email').isEmail().withMessage('A valid email is required'), body('password').notEmpty().withMessage('Password is required')], validate, auth.login);
router.get('/geo/countries', geo.countries);
router.get('/geo/states', geo.states);
router.get('/geo/districts', geo.districts);
router.get('/geo/pincodes', geo.pincodes);
router.get('/public/search', fin.publicSearch);
router.post('/public/fines/:id/pay', fin.publicPay);
router.get('/public/receipt/:key', fin.publicReceipt);

// authenticated
router.use(protect);
router.get('/auth/me', auth.me);
router.put('/auth/password', [body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')], validate, auth.changePassword);
router.get('/stats', st.summary);

// Vehicles are managed by admins only; citizens just see the ones linked to their account.
router.get('/vehicles', authorize('citizen', 'admin', 'regional_admin'), veh.list);
router.post('/vehicles', authorize('admin', 'regional_admin'), veh.add);
router.put('/vehicles/:id', authorize('admin', 'regional_admin'), veh.update);
router.delete('/vehicles/:id', authorize('admin', 'regional_admin'), veh.remove);

router.post('/reports', authorize('citizen'), upload, [
  body('violationType').isIn(TYPES).withMessage('Invalid violation type'),
  body('state').notEmpty().withMessage('State is required'), body('district').notEmpty().withMessage('District is required'),
  body('pincode').matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
], validate, rep.create);
router.get('/reports', rep.list);
router.get('/reports/:id', rep.getOne);
router.post('/reports/:id/comment', authorize('citizen'), rep.comment);
router.put('/reports/:id/review', authorize('officer', 'supervisor', 'regional_admin', 'admin'), rep.review);

router.get('/fines/schedule', fin.schedule);
router.put('/fines/schedule', authorize('admin', 'regional_admin'), fin.setSchedule);
router.get('/fines', fin.list);
router.get('/fines/:id', fin.getOne);
router.put('/fines/:id/pay', authorize('citizen'), fin.pay);
router.put('/fines/:id/dispute', authorize('citizen'), fin.dispute);
router.put('/fines/:id/decision', authorize('supervisor'), fin.decide);
router.put('/fines/:id/refund', authorize('finance', 'admin'), fin.refund);

router.get('/users', authorize('admin', 'regional_admin'), usr.list);
router.post('/users', authorize('admin', 'regional_admin'), [body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required'), body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')], validate, usr.create);
router.put('/users/:id/toggle-active', authorize('admin', 'regional_admin'), usr.toggleActive);
router.get('/audit', authorize('admin'), st.audit);

module.exports = router;
