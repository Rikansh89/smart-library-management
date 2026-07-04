const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const generateQR = async (data, filename) => {
  const qrDir = path.join(__dirname, '..', 'uploads', 'covers');
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
  }
  const filePath = path.join(qrDir, filename);
  await QRCode.toFile(filePath, data);
  return `/uploads/covers/${filename}`;
};

module.exports = { generateQR };
