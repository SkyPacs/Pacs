import express from 'express';
import { getTemplates,createTemplate } from '../controllers/templateController.js';
const router = express.Router();
router.get('/getTemplates',getTemplates)
router.post('/createTemplate',createTemplate)
export default router;