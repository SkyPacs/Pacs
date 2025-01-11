import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHUNK_UPLOAD_DIR = path.join(__dirname, 'uploads', 'chunks');
const FINAL_UPLOAD_DIR = path.join(__dirname, 'uploads', 'completed');
fs.mkdirSync(CHUNK_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(FINAL_UPLOAD_DIR, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({ storage }).single('chunk');

const uploadDicomFile = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Error uploading chunk:', err);
      return res.status(400).send({ message: 'Error uploading chunk', error: err });
    }

    try {
      const { fileName, chunkIndex, totalChunks } = req.body;

      if (!fileName || chunkIndex === undefined || !totalChunks) {
        return res.status(400).send({ message: 'Missing required fields' });
      }

      const chunkDir = path.join(CHUNK_UPLOAD_DIR, fileName);
      await fs.promises.mkdir(chunkDir, { recursive: true });
      const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`);
      await fs.promises.writeFile(chunkPath, req.file.buffer);

      if (parseInt(chunkIndex, 10) + 1 === parseInt(totalChunks, 10)) {
        req.uploadInfo = { isComplete: true, fileName, chunkDir };
      } else {
        req.uploadInfo = { isComplete: false };
      }
      next();
    } catch (error) {
      console.error('Error handling chunk upload:', error);
      next(error);
    }
  });
};
export default uploadDicomFile;