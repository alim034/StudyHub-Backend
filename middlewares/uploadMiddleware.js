import multer from 'multer';
import path from 'path';

// Storage config (local, public/uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
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