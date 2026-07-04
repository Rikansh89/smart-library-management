const bcrypt = require('bcryptjs');
const pool = require('../config/db');
require('dotenv').config();

const generateSampleData = async () => {
  try {
    console.log('Generating sample data...');

    const hashedPassword = await bcrypt.hash('password123', 12);

    await pool.query(`INSERT IGNORE INTO users (name, email, password, role) VALUES
      ('Admin User', 'admin@library.com', '${hashedPassword}', 'admin'),
      ('Librarian One', 'librarian@library.com', '${hashedPassword}', 'librarian'),
      ('Student One', 'student@library.com', '${hashedPassword}', 'student'),
      ('Jane Smith', 'jane@example.com', '${hashedPassword}', 'student'),
      ('Bob Wilson', 'bob@example.com', '${hashedPassword}', 'student')
    `);

    await pool.query(`INSERT IGNORE INTO books (title, author, isbn, category, publication_year, quantity, available_quantity, description) VALUES
      ('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Fiction', 1925, 5, 5, 'A story of the mysteriously wealthy Jay Gatsby.'),
      ('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Fiction', 1960, 3, 3, 'A novel about racial injustice in the Deep South.'),
      ('1984', 'George Orwell', '9780451524935', 'Science Fiction', 1949, 4, 4, 'A dystopian social science fiction novel.'),
      ('Pride and Prejudice', 'Jane Austen', '9780141439518', 'Romance', 1813, 3, 3, 'A romantic novel of manners.'),
      ('The Catcher in the Rye', 'J.D. Salinger', '9780316769488', 'Fiction', 1951, 2, 2, 'A story about adolescent angst.'),
      ('Introduction to Algorithms', 'Thomas H. Cormen', '9780262033848', 'Education', 2009, 2, 2, 'Comprehensive textbook on algorithms.'),
      ('The Art of Computer Programming', 'Donald Knuth', '9780201896831', 'Education', 1968, 1, 1, 'Monumental work on programming.'),
      ('A Brief History of Time', 'Stephen Hawking', '9780553380163', 'Science', 1988, 3, 3, 'Explores cosmology and the nature of time.'),
      ('The Hobbit', 'J.R.R. Tolkien', '9780547928227', 'Fantasy', 1937, 4, 4, 'A fantasy novel about Bilbo Baggins.'),
      ('Harry Potter and the Philosophers Stone', 'J.K. Rowling', '9780747532743', 'Fantasy', 1997, 6, 6, 'First book in the Harry Potter series.')
    `);

    await pool.query(`INSERT IGNORE INTO study_rooms (name, capacity, location, description) VALUES
      ('Quiet Study Room A', 4, 'First Floor', 'Silent study room with individual desks'),
      ('Group Study Room B', 8, 'First Floor', 'Collaborative space with whiteboard'),
      ('Discussion Room C', 6, 'Second Floor', 'Perfect for group discussions'),
      ('Private Booth D', 2, 'Second Floor', 'Individual study booth with computer'),
      ('Conference Room E', 12, 'Third Floor', 'Large room for study groups')
    `);

    console.log('Sample data generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating sample data:', error);
    process.exit(1);
  }
};

generateSampleData();
