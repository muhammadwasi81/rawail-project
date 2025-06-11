const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const pool = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
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
    console.log("📚 Received book creation request:", req.body);
    const { title, authorid, isbn, genreid, publicationyear, status } =
      req.body;

    // Validation
    if (!title || title.trim().length === 0) {
      console.log("❌ Validation failed: Title is required");
      return res.status(400).json({ error: "Title is required" });
    }

    if (!authorid || isNaN(parseInt(authorid))) {
      console.log("❌ Validation failed: Invalid Author ID");
      return res.status(400).json({ error: "Valid Author ID is required" });
    }

    if (!genreid || isNaN(parseInt(genreid))) {
      console.log("❌ Validation failed: Invalid Genre ID");
      return res.status(400).json({ error: "Valid Genre ID is required" });
    }

    // Validate and truncate ISBN to 13 characters if needed
    let validatedISBN = isbn ? isbn.toString().trim() : "";
    if (validatedISBN.length > 13) {
      validatedISBN = validatedISBN.substring(0, 13);
      console.log(`ISBN truncated from "${isbn}" to "${validatedISBN}"`);
    }

    // Validate publication year
    const currentYear = new Date().getFullYear();
    const year = parseInt(publicationyear);
    if (
      publicationyear &&
      (isNaN(year) || year < 1000 || year > currentYear + 1)
    ) {
      return res.status(400).json({
        error: `Publication year must be between 1000 and ${currentYear + 1}`,
      });
    }

    console.log("✅ Validation passed, attempting database insert");
    console.log("📊 Insert parameters:", [
      title.trim(),
      parseInt(authorid),
      validatedISBN,
      parseInt(genreid),
      year || null,
      status || "Available",
    ]);

    const result = await pool.query(
      "INSERT INTO Books (Title, AuthorID, ISBN, GenreID, PublicationYear, Status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        title.trim(),
        parseInt(authorid),
        validatedISBN,
        parseInt(genreid),
        year || null,
        status || "Available",
      ]
    );

    console.log("✅ Book added successfully:", result.rows[0]);
    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error adding book:", err);

    // Handle specific database errors
    if (err.code === "23503") {
      // Foreign key violation
      if (err.constraint && err.constraint.includes("authorid")) {
        return res.status(400).json({ error: "Author ID does not exist" });
      }
      if (err.constraint && err.constraint.includes("genreid")) {
        return res.status(400).json({ error: "Genre ID does not exist" });
      }
      return res.status(400).json({ error: "Invalid reference ID provided" });
    }

    if (err.code === "23505") {
      // Unique constraint violation
      return res.status(400).json({ error: "ISBN already exists" });
    }

    if (err.code === "22001") {
      // Value too long
      return res.status(400).json({
        error: "One or more values are too long for database constraints",
      });
    }

    res.status(500).json({
      error: "Failed to add book",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
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
    console.log("👤 Received member creation request:", req.body);
    const { name, email, phone, joindate } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      console.log("❌ Validation failed: Name is required");
      return res.status(400).json({ error: "Name is required" });
    }

    if (!email || email.trim().length === 0) {
      console.log("❌ Validation failed: Email is required");
      return res.status(400).json({ error: "Email is required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.log("❌ Validation failed: Invalid email format");
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate and clean phone if provided
    let validatedPhone = null;
    if (phone && phone.trim().length > 0) {
      // Remove all non-numeric characters for length validation
      const cleanPhone = phone.replace(/[^\d]/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        console.log("❌ Validation failed: Invalid phone number length");
        return res.status(400).json({
          error: "Phone number must contain 10-15 digits",
        });
      }

      // Keep the original format but ensure it fits in VARCHAR(15)
      validatedPhone = phone.trim();
      if (validatedPhone.length > 15) {
        console.log("❌ Validation failed: Phone number too long for database");
        return res.status(400).json({
          error:
            "Phone number is too long (max 15 characters including formatting)",
        });
      }
    }

    // Validate name length (typically VARCHAR(100) or similar)
    if (name.trim().length > 100) {
      console.log("❌ Validation failed: Name too long");
      return res.status(400).json({
        error: "Name is too long (max 100 characters)",
      });
    }

    // Validate email length (typically VARCHAR(255))
    if (email.trim().length > 255) {
      console.log("❌ Validation failed: Email too long");
      return res.status(400).json({
        error: "Email is too long (max 255 characters)",
      });
    }

    // Validate join date if provided
    let validatedJoinDate = joindate;
    if (joindate) {
      const dateObj = new Date(joindate);
      if (isNaN(dateObj.getTime())) {
        console.log("❌ Validation failed: Invalid join date");
        return res.status(400).json({ error: "Invalid join date format" });
      }

      // Check if date is not in the future
      if (dateObj > new Date()) {
        console.log("❌ Validation failed: Join date cannot be in the future");
        return res.status(400).json({
          error: "Join date cannot be in the future",
        });
      }
    } else {
      validatedJoinDate = new Date().toISOString().split("T")[0];
    }

    console.log("✅ Validation passed, attempting database insert");
    console.log("📊 Insert parameters:", [
      name.trim(),
      email.trim().toLowerCase(),
      validatedPhone,
      validatedJoinDate,
    ]);

    const result = await pool.query(
      "INSERT INTO Members (Name, Email, Phone, JoinDate) VALUES ($1, $2, $3, $4) RETURNING *",
      [
        name.trim(),
        email.trim().toLowerCase(),
        validatedPhone,
        validatedJoinDate,
      ]
    );

    console.log("✅ Member added successfully:", result.rows[0]);
    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error adding member:", err);

    // Handle specific database errors
    if (err.code === "23505") {
      // Unique constraint violation (duplicate email)
      if (err.constraint && err.constraint.includes("email")) {
        return res.status(400).json({
          error: "Email address already exists. Please use a different email.",
        });
      }
      return res.status(400).json({ error: "Duplicate entry found" });
    }

    if (err.code === "22001") {
      // Value too long - provide specific guidance
      console.log("❌ Database constraint error - value too long:", err.detail);
      return res.status(400).json({
        error:
          "Phone number is too long for database (max 15 characters). Please use a shorter format like: 1234567890",
      });
    }

    if (err.code === "23514") {
      // Check constraint violation
      return res.status(400).json({
        error: "Data validation failed. Please check your input values.",
      });
    }

    res.status(500).json({
      error: "Failed to add member",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
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
    console.log("📖 Received loan creation request:", req.body);
    const { bookid, memberid, issuedate, returndate, status } = req.body;

    // Validation
    if (!bookid || isNaN(parseInt(bookid))) {
      console.log("❌ Validation failed: Valid Book ID is required");
      return res.status(400).json({ error: "Valid Book ID is required" });
    }

    if (!memberid || isNaN(parseInt(memberid))) {
      console.log("❌ Validation failed: Valid Member ID is required");
      return res.status(400).json({ error: "Valid Member ID is required" });
    }

    // Validate issue date
    let validatedIssueDate = issuedate;
    if (issuedate) {
      const dateObj = new Date(issuedate);
      if (isNaN(dateObj.getTime())) {
        console.log("❌ Validation failed: Invalid issue date");
        return res.status(400).json({ error: "Invalid issue date format" });
      }
    } else {
      validatedIssueDate = new Date().toISOString().split("T")[0];
    }

    // Validate return date if provided
    let validatedReturnDate = returndate;
    if (returndate) {
      const returnDateObj = new Date(returndate);
      const issueDateObj = new Date(validatedIssueDate);

      if (isNaN(returnDateObj.getTime())) {
        console.log("❌ Validation failed: Invalid return date");
        return res.status(400).json({ error: "Invalid return date format" });
      }

      if (returnDateObj <= issueDateObj) {
        console.log(
          "❌ Validation failed: Return date must be after issue date"
        );
        return res.status(400).json({
          error: "Return date must be after issue date",
        });
      }
    }

    console.log("✅ Validation passed, attempting database insert");
    console.log("📊 Insert parameters:", [
      parseInt(bookid),
      parseInt(memberid),
      validatedIssueDate,
      validatedReturnDate,
      status || "Active",
    ]);

    const result = await pool.query(
      "INSERT INTO Loans (BookID, MemberID, IssueDate, ReturnDate, Status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        parseInt(bookid),
        parseInt(memberid),
        validatedIssueDate,
        validatedReturnDate,
        status || "Active",
      ]
    );

    console.log("✅ Loan added successfully:", result.rows[0]);
    res.status(201).json({
      success: true,
      message: "Loan added successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error adding loan:", err);

    // Handle specific database errors
    if (err.code === "23503") {
      // Foreign key violation
      if (err.constraint && err.constraint.includes("bookid")) {
        return res.status(400).json({ error: "Book ID does not exist" });
      }
      if (err.constraint && err.constraint.includes("memberid")) {
        return res.status(400).json({ error: "Member ID does not exist" });
      }
      return res.status(400).json({ error: "Invalid reference ID provided" });
    }

    if (err.code === "23505") {
      // Unique constraint violation
      return res.status(400).json({ error: "Duplicate loan entry" });
    }

    if (err.code === "22001") {
      // Value too long
      return res.status(400).json({
        error: "One or more values are too long for database constraints",
      });
    }

    res.status(500).json({
      error: "Failed to add loan",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
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
