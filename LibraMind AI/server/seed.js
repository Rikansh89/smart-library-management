require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initDatabase, closeDatabase, getDatabase } = require('./config/database');
const { initializeDatabase } = require('./models/schema');

async function seed() {
  await initDatabase();
  initializeDatabase();
  const db = getDatabase();

  console.log('Seeding database...');

  const existingAdmin = db.prepare("SELECT id FROM users WHERE email = 'admin@libramind.com'").get();
  if (existingAdmin) {
    console.log('Database already seeded. Skipping...');
    closeDatabase();
    return;
  }

  const adminPassword = bcrypt.hashSync('admin123', 12);
  const librarianPassword = bcrypt.hashSync('librarian123', 12);
  const studentPassword = bcrypt.hashSync('student123', 12);

  db.prepare(`
    INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)
  `).run('Admin User', 'admin@libramind.com', adminPassword, 'admin');

  db.prepare(`
    INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)
  `).run('Jane Librarian', 'librarian@libramind.com', librarianPassword, 'librarian', 'Library Sciences');

  db.prepare(`
    INSERT INTO users (name, email, password, role, department, student_id) VALUES (?, ?, ?, ?, ?, ?)
  `).run('John Student', 'student@libramind.com', studentPassword, 'student', 'Computer Science', 'STU001');

  const books = [
    { isbn: '9780743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Fiction', category: 'Classic Literature', description: 'A story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.', publisher: 'Scribner', year: 1925, pages: 180 },
    { isbn: '9780061120084', title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', category: 'Classic Literature', description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.', publisher: 'HarperCollins', year: 1960, pages: 281 },
    { isbn: '9780451524935', title: '1984', author: 'George Orwell', genre: 'Fiction', category: 'Dystopian', description: 'A dystopian social science fiction novel and cautionary tale about the future of totalitarianism.', publisher: 'Signet', year: 1949, pages: 328 },
    { isbn: '9780141439518', title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Fiction', category: 'Romance', description: 'A romantic novel of manners that follows the character development of Elizabeth Bennet.', publisher: 'Penguin', year: 1813, pages: 432 },
    { isbn: '9780544003415', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', genre: 'Fantasy', category: 'Epic Fantasy', description: 'An epic high-fantasy novel following the quest to destroy the One Ring.', publisher: 'Houghton Mifflin', year: 1954, pages: 1178 },
    { isbn: '9780316769488', title: 'The Catcher in the Rye', author: 'J.D. Salinger', genre: 'Fiction', category: 'Coming of Age', description: 'A story about teenage protagonist Holden Caulfield and his experiences in New York City.', publisher: 'Little, Brown', year: 1951, pages: 214 },
    { isbn: '9781503290563', title: 'A Brief History of Time', author: 'Stephen Hawking', genre: 'Non-Fiction', category: 'Science', description: 'A landmark book on cosmology written for the general public.', publisher: 'Bantam', year: 1988, pages: 256 },
    { isbn: '9780134685991', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', genre: 'Technical', category: 'Computer Science', description: 'A comprehensive textbook on algorithms.', publisher: 'MIT Press', year: 2009, pages: 1312 },
    { isbn: '9780262035613', title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell', genre: 'Technical', category: 'Computer Science', description: 'The leading textbook on artificial intelligence.', publisher: 'Pearson', year: 2020, pages: 1136 },
    { isbn: '9780131103627', title: 'The C Programming Language', author: 'Brian Kernighan', genre: 'Technical', category: 'Programming', description: 'The definitive guide to the C programming language.', publisher: 'Prentice Hall', year: 1988, pages: 272 },
    { isbn: '9780596007126', title: 'Head First Design Patterns', author: 'Eric Freeman', genre: 'Technical', category: 'Programming', description: 'A visually engaging guide to object-oriented design patterns.', publisher: "O'Reilly", year: 2004, pages: 638 },
    { isbn: '9781118531471', title: 'Clean Code', author: 'Robert C. Martin', genre: 'Technical', category: 'Programming', description: 'A handbook of agile software craftsmanship.', publisher: 'Prentice Hall', year: 2008, pages: 464 },
    { isbn: '9780132350884', title: 'The Clean Coder', author: 'Robert C. Martin', genre: 'Technical', category: 'Programming', description: 'A guide to professional software development.', publisher: 'Prentice Hall', year: 2011, pages: 256 },
    { isbn: '9781617295485', title: 'Grokking Algorithms', author: 'Aditya Bhargava', genre: 'Technical', category: 'Computer Science', description: 'A fully illustrated guide to algorithms for beginners.', publisher: 'Manning', year: 2016, pages: 256 },
    { isbn: '9781491952023', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', genre: 'Technical', category: 'Computer Science', description: 'A guide to designing reliable, scalable, and maintainable systems.', publisher: "O'Reilly", year: 2017, pages: 616 }
  ];

  for (const book of books) {
    const result = db.prepare(`
      INSERT INTO books (isbn, title, author, genre, category, description, publisher, published_year, pages)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(book.isbn, book.title, book.author, book.genre, book.category,
      book.description, book.publisher, book.year, book.pages);

    db.prepare('INSERT INTO book_copies (book_id, copy_code, status) VALUES (?, ?, ?)')
      .run(result.lastInsertRowid, `${book.isbn}-C001`, 'available');
    db.prepare('INSERT INTO book_copies (book_id, copy_code, status) VALUES (?, ?, ?)')
      .run(result.lastInsertRowid, `${book.isbn}-C002`, 'available');
  }

  console.log('Seed data created successfully!');
  console.log('\nTest Credentials:');
  console.log('  Admin:     admin@libramind.com / admin123');
  console.log('  Librarian: librarian@libramind.com / librarian123');
  console.log('  Student:    student@libramind.com / student123');

  closeDatabase();
}

seed().catch((err) => { console.error(err); process.exit(1); });
