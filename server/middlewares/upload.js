import multer from 'multer';

const storage = multer.memoryStorage(); // Store files in memory as buffers

const upload = multer({ storage });
export default upload;