import express from 'express';
import { registerAdmin, loginAdmin,logout } from '../controllers/adminController.js';

const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', loginAdmin)
router.post('/logout',logout)
export default router;
