const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const pool = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// ===== GENRES API ENDPOINTS =====
// GET all genres
app.get("/api/genres", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Genres ORDER BY Name");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new genre
app.post("/api/genres", async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      "INSERT INTO Genres (Name) VALUES ($1) RETURNING *",
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== AUTHORS API ENDPOINTS =====
// GET all authors
app.get("/api/authors", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Authors ORDER BY Name");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new author
app.post("/api/authors", async (req, res) => {
  try {
    const { name, bio } = req.body;
    const result = await pool.query(
      "INSERT INTO Authors (Name, Bio) VALUES ($1, $2) RETURNING *",
      [name, bio]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== PUBLISHERS API ENDPOINTS =====
// GET all publishers
app.get("/api/publishers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Publishers ORDER BY Name");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new publisher
app.post("/api/publishers", async (req, res) => {
  try {
    const { name, address } = req.body;
    const result = await pool.query(
      "INSERT INTO Publishers (Name, Address) VALUES ($1, $2) RETURNING *",
      [name, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== CATEGORIES API ENDPOINTS =====
// GET all categories
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Categories ORDER BY Name");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new category
app.post("/api/categories", async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      "INSERT INTO Categories (Name) VALUES ($1) RETURNING *",
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== BOOKS API ENDPOINTS =====
// GET all books with related data
app.get("/api/books", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.*, 
        a.name as author_name, 
        g.name as genre_name 
      FROM Books b
      LEFT JOIN Authors a ON b.authorid = a.authorid
      LEFT JOIN Genres g ON b.genreid = g.genreid
      ORDER BY b.title
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new book
app.post("/api/books", async (req, res) => {
  try {
    const { title, authorid, isbn, genreid, publicationyear, status } =
      req.body;
    const result = await pool.query(
      "INSERT INTO Books (Title, AuthorID, ISBN, GenreID, PublicationYear, Status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, authorid, isbn, genreid, publicationyear, status || "Available"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== MEMBERS API ENDPOINTS =====
// GET all members
app.get("/api/members", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Members ORDER BY Name");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new member
app.post("/api/members", async (req, res) => {
  try {
    const { name, email, phone, joindate } = req.body;
    const result = await pool.query(
      "INSERT INTO Members (Name, Email, Phone, JoinDate) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, phone, joindate || new Date().toISOString().split("T")[0]]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== LOANS API ENDPOINTS =====
// GET all loans with related data
app.get("/api/loans", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.*, 
        b.title as book_title, 
        m.name as member_name 
      FROM Loans l
      LEFT JOIN Books b ON l.bookid = b.bookid
      LEFT JOIN Members m ON l.memberid = m.memberid
      ORDER BY l.issuedate DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new loan
app.post("/api/loans", async (req, res) => {
  try {
    const { bookid, memberid, issuedate, returndate, status } = req.body;
    const result = await pool.query(
      "INSERT INTO Loans (BookID, MemberID, IssueDate, ReturnDate, Status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [bookid, memberid, issuedate, returndate, status || "Active"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== FINES API ENDPOINTS =====
// GET all fines with member data
app.get("/api/fines", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.*, 
        m.name as member_name 
      FROM Fines f
      LEFT JOIN Members m ON f.memberid = m.memberid
      ORDER BY f.issuedate DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new fine
app.post("/api/fines", async (req, res) => {
  try {
    const { memberid, amount, issuedate, status } = req.body;
    const result = await pool.query(
      "INSERT INTO Fines (MemberID, Amount, IssueDate, Status) VALUES ($1, $2, $3, $4) RETURNING *",
      [memberid, amount, issuedate, status || "Pending"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== RESERVATIONS API ENDPOINTS =====
// GET all reservations with related data
app.get("/api/reservations", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*, 
        b.title as book_title, 
        m.name as member_name 
      FROM Reservations r
      LEFT JOIN Books b ON r.bookid = b.bookid
      LEFT JOIN Members m ON r.memberid = m.memberid
      ORDER BY r.reservationdate DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new reservation
app.post("/api/reservations", async (req, res) => {
  try {
    const { bookid, memberid, reservationdate } = req.body;
    const result = await pool.query(
      "INSERT INTO Reservations (BookID, MemberID, ReservationDate) VALUES ($1, $2, $3) RETURNING *",
      [bookid, memberid, reservationdate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== LIBRARY STAFF API ENDPOINTS =====
// GET all library staff
app.get("/api/librarystaff", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM LibraryStaff ORDER BY Name");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new library staff
app.post("/api/librarystaff", async (req, res) => {
  try {
    const { name, role, contact } = req.body;
    const result = await pool.query(
      "INSERT INTO LibraryStaff (Name, Role, Contact) VALUES ($1, $2, $3) RETURNING *",
      [name, role, contact]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== REPORTS AND ANALYTICS ENDPOINTS =====
// GET library statistics for dashboard
app.get("/api/stats", async (req, res) => {
  try {
    const stats = {};

    // Total counts
    const totalBooks = await pool.query("SELECT COUNT(*) FROM Books");
    const totalMembers = await pool.query("SELECT COUNT(*) FROM Members");
    const activeLoans = await pool.query(
      "SELECT COUNT(*) FROM Loans WHERE Status = 'Active'"
    );
    const pendingFines = await pool.query(
      "SELECT SUM(Amount) FROM Fines WHERE Status = 'Pending'"
    );

    // Books by genre
    const booksByGenre = await pool.query(`
      SELECT g.name, COUNT(b.bookid) as count 
      FROM Genres g 
      LEFT JOIN Books b ON g.genreid = b.genreid 
      GROUP BY g.name 
      ORDER BY count DESC
    `);

    // Books by status
    const booksByStatus = await pool.query(`
      SELECT Status, COUNT(*) as count 
      FROM Books 
      GROUP BY Status
    `);

    // Monthly loan statistics
    const monthlyLoans = await pool.query(`
      SELECT 
        DATE_TRUNC('month', IssueDate) as month,
        COUNT(*) as loan_count
      FROM Loans 
      GROUP BY DATE_TRUNC('month', IssueDate)
      ORDER BY month DESC
      LIMIT 12
    `);

    stats.totalBooks = parseInt(totalBooks.rows[0].count);
    stats.totalMembers = parseInt(totalMembers.rows[0].count);
    stats.activeLoans = parseInt(activeLoans.rows[0].count);
    stats.pendingFines = parseFloat(pendingFines.rows[0].sum || 0);
    stats.booksByGenre = booksByGenre.rows;
    stats.booksByStatus = booksByStatus.rows;
    stats.monthlyLoans = monthlyLoans.rows;

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET overdue books report
app.get("/api/reports/overdue", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.loanid,
        b.title,
        m.name as member_name,
        m.email,
        l.issuedate,
        CURRENT_DATE - l.issuedate as days_overdue
      FROM Loans l
      JOIN Books b ON l.bookid = b.bookid
      JOIN Members m ON l.memberid = m.memberid
      WHERE l.status = 'Active' 
        AND l.issuedate < CURRENT_DATE - INTERVAL '14 days'
      ORDER BY days_overdue DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Test database connection before starting server
async function testDatabaseConnection() {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

// Start server
async function startServer() {
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log("⚠️  Starting server without database connection...");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Library Management System server running on port ${PORT}`);
    console.log(`📚 Access the application at http://localhost:${PORT}`);
    console.log(`🔧 API endpoints available at http://localhost:${PORT}/api/`);
  });
}

startServer();

module.exports = app;
