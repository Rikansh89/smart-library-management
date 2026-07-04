const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const qrDir = path.join(__dirname, '..', 'uploads', 'qrcodes');

if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
}

async function generateQRCode(data) {
  const filename = `book_${data.bookId}_${Date.now()}.png`;
  const filePath = path.join(qrDir, filename);

  const qrData = JSON.stringify({
    id: data.bookId,
    isbn: data.isbn,
    title: data.title,
    copyCode: data.copyCode
  });

  await QRCode.toFile(filePath, qrData, {
    color: {
      dark: '#1e3a5f',
      light: '#ffffff'
    },
    width: 300,
    margin: 2
  });

  return {
    filename,
    filePath,
    url: `/uploads/qrcodes/${filename}`
  };
}

async function generateBulkQRCode(books) {
  const results = [];
  for (const book of books) {
    const result = await generateQRCode(book);
    results.push(result);
  }
  return results;
}

module.exports = { generateQRCode, generateBulkQRCode };
