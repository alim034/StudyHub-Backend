import multer from 'multer';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Determine a safe upload directory. In production (serverless) the
// project root is usually read-only (e.g. /var/task). Use an explicit
// UPLOAD_DIR env var when present. Otherwise fall back to a tmpdir in
// production, and to ./public/uploads in development for local dev.
const defaultLocalDir = path.join(process.cwd(), 'public', 'uploads');
const tmpUploadsDir = path.join(os.tmpdir(), 'studyhub-uploads');
export const uploadDir = process.env.UPLOAD_DIR || (process.env.NODE_ENV === 'production' ? tmpUploadsDir : defaultLocalDir);

// Try to create the upload directory if possible. If the target is
// read-only this will fail; we catch and warn but do not crash the app.
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  // Don't crash on read-only FS; multer will fail later if it can't write,
  // but this prevents trying to create '/var/task/public' on platforms
  // where the project directory is read-only.
  console.warn(`Could not create upload dir ${uploadDir}:`, err.message);
}

// Storage config (local, public/uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

// File filter (accept images, pdfs, Word, Excel)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf|docx|xlsx/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext)) {
    // Virus scan stub (replace with real scan for production)
    // Example: clamav.scanFile(file.path, (err, isInfected) => ...)
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, Word (.docx), and Excel (.xlsx) files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

export default upload;