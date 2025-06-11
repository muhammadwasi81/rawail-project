let currentTable = "";

// Initialize All Event Listeners
function initializeEventListeners() {
  console.log("Setting up all event listeners...");

  // Navigation buttons
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const section = this.dataset.section;
      console.log("Navigation button clicked for section:", section);

      if (section) {
        showSection(section);
      }
    });
  });

  // Add form buttons
  const addButtons = document.querySelectorAll('[data-action="add"]');
  addButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const type = this.dataset.type;
      console.log("Add button clicked for type:", type);

      if (type) {
        showAddForm(type);
      }
    });
  });

  // Report buttons
  const reportButtons = document.querySelectorAll('[data-action="report"]');
  reportButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const type = this.dataset.type;
      console.log("Report button clicked for type:", type);

      if (type === "overdue") {
        generateOverdueReport();
      } else if (type === "popular") {
        generatePopularBooksReport();
      }
    });
  });

  // Manage table cards
  const manageCards = document.querySelectorAll('[data-action="manage"]');
  manageCards.forEach((card) => {
    card.addEventListener("click", function (e) {
      e.preventDefault();
      const table = this.dataset.table;
      console.log("Manage card clicked for table:", table);

      if (table) {
        showManageTable(table);
      }
    });
  });

  // Close modal buttons
  const closeButtons = document.querySelectorAll('[data-action="close"]');
  closeButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Close button clicked");
      closeModal();
    });
  });

  console.log("All event listeners set up successfully!");
}

// DOM Content Loaded Event
document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM loaded, initializing application...");

  // Make sure navigation functions are available globally for onclick handlers first
  window.showSection = showSection;
  window.showAddForm = showAddForm;
  window.showManageTable = showManageTable;
  window.showManageAddForm = showManageAddForm;
  window.generateOverdueReport = generateOverdueReport;
  window.generatePopularBooksReport = generatePopularBooksReport;
  window.closeModal = closeModal;

  // Force dashboard to be visible
  const dashboard = document.getElementById("dashboard");
  if (dashboard) {
    dashboard.style.display = "block";
    dashboard.classList.add("active");
    console.log("✅ Dashboard forced to be visible");
  }

  // Initialize all event listeners
  initializeEventListeners();

  // Load initial data
  loadDashboard();
  loadBooks();
  loadMembers();
  loadLoans();

  console.log("Application initialized successfully!");
});

// Navigation Functions
function showSection(sectionName) {
  console.log("🔄 Switching to section:", sectionName);

  try {
    // Hide all sections
    const sections = document.querySelectorAll(".section");
    console.log("Found sections:", sections.length);
    sections.forEach((section) => {
      section.classList.remove("active");
    });

    // Remove active class from all nav buttons
    const navButtons = document.querySelectorAll(".nav-btn");
    console.log("Found nav buttons:", navButtons.length);
    navButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
      targetSection.classList.add("active");
      console.log("✅ Section activated:", sectionName);
    } else {
      console.error("❌ Section not found:", sectionName);
    }

    // Add active class to clicked nav button
    const clickedButton = document.querySelector(
      `[data-section="${sectionName}"]`
    );
    if (clickedButton) {
      clickedButton.classList.add("active");
      console.log("✅ Button activated");
    } else {
      console.log("⚠️ Button not found, trying alternative method");
      // Try to find button by text content
      navButtons.forEach((btn) => {
        const text = btn.textContent.toLowerCase();
        if (text.includes(sectionName.toLowerCase())) {
          btn.classList.add("active");
          console.log("✅ Button activated by text matching");
        }
      });
    }

    // Load section-specific data
    switch (sectionName) {
      case "dashboard":
        loadDashboard();
        break;
      case "books":
        loadBooks();
        break;
      case "members":
        loadMembers();
        break;
      case "loans":
        loadLoans();
        break;
      case "reports":
        console.log("📊 Reports section activated");
        break;
      case "manage":
        console.log("⚙️ Manage section activated");
        break;
      default:
        console.log("❓ Unknown section:", sectionName);
    }
  } catch (error) {
    console.error("❌ Error in showSection:", error);
  }
}

// API Helper Functions
async function apiGet(endpoint) {
  try {
    const response = await fetch(`/api/${endpoint}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

async function apiPost(endpoint, data) {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Throw an error with the server's error message
      const errorMessage =
        responseData.error || `HTTP error! status: ${response.status}`;
      throw new Error(JSON.stringify(responseData));
    }

    return responseData;
  } catch (error) {
    console.error(`Error posting to ${endpoint}:`, error);
    throw error;
  }
}

// Dashboard Functions
async function loadDashboard() {
  try {
    console.log("📊 Loading dashboard data...");
    const stats = await apiGet("stats");
    console.log("📈 Received stats:", stats);

    if (!stats) {
      console.error("❌ No stats data received");
      return;
    }

    // Update stat cards
    const totalBooksEl = document.getElementById("totalBooks");
    const totalMembersEl = document.getElementById("totalMembers");
    const activeLoansEl = document.getElementById("activeLoans");

    console.log("📊 Updating stat cards:", {
      totalBooksEl: !!totalBooksEl,
      totalMembersEl: !!totalMembersEl,
      activeLoansEl: !!activeLoansEl,
      stats,
    });

    if (totalBooksEl) totalBooksEl.textContent = stats.totalBooks || 0;
    if (totalMembersEl) totalMembersEl.textContent = stats.totalMembers || 0;
    if (activeLoansEl) activeLoansEl.textContent = stats.activeLoans || 0;

    const pendingFinesEl = document.getElementById("pendingFines");
    if (pendingFinesEl) {
      pendingFinesEl.textContent = `$${(stats.pendingFines || 0).toFixed(2)}`;
    }

    // Render charts
    renderCharts(stats);

    console.log("✅ Dashboard loaded successfully");
  } catch (error) {
    console.error("❌ Error loading dashboard:", error);
  }
}

// Chart rendering functions
function renderCharts(stats) {
  renderGenreChart(stats.booksByGenre);
  renderStatusChart(stats.booksByStatus);
  renderMonthlyLoansChart(stats.monthlyLoans);
}

function renderGenreChart(genreData) {
  // Prepare data for ApexCharts
  const labels = genreData.map((item) => item.name);
  const series = genreData.map((item) => parseInt(item.count));

  const options = {
    chart: {
      type: "pie",
      height: 350,
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    series: series,
    labels: labels,
    colors: [
      "#3498db",
      "#e74c3c",
      "#2ecc71",
      "#f39c12",
      "#9b59b6",
      "#1abc9c",
      "#34495e",
      "#95a5a6",
    ],
    legend: {
      position: "bottom",
      fontSize: "14px",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "45%",
        },
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "12px",
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " books";
        },
      },
    },
  };

  // Clear existing chart
  const chartElement = document.querySelector("#genreChart");
  if (chartElement) {
    chartElement.innerHTML = "";
    const chart = new ApexCharts(chartElement, options);
    chart.render();
  }
}

function renderStatusChart(statusData) {
  const labels = statusData.map((item) => item.status);
  const series = statusData.map((item) => parseInt(item.count));

  const options = {
    chart: {
      type: "donut",
      height: 350,
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    series: series,
    labels: labels,
    colors: ["#2ecc71", "#e74c3c", "#f39c12", "#3498db"],
    legend: {
      position: "bottom",
      fontSize: "14px",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "60%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Books",
              fontSize: "16px",
              fontWeight: 600,
              color: "#2c3e50",
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "12px",
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " books";
        },
      },
    },
  };

  const chartElement = document.querySelector("#statusChart");
  if (chartElement) {
    chartElement.innerHTML = "";
    const chart = new ApexCharts(chartElement, options);
    chart.render();
  }
}

function renderMonthlyLoansChart(monthlyData) {
  // Process the data - convert months and sort
  const processedData = monthlyData
    .map((item) => ({
      month: new Date(item.month).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      }),
      count: parseInt(item.loan_count),
    }))
    .reverse(); // Reverse to show oldest to newest

  const labels = processedData.map((item) => item.month);
  const series = processedData.map((item) => item.count);

  const options = {
    chart: {
      type: "bar",
      height: 350,
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
      toolbar: {
        show: true,
      },
    },
    series: [
      {
        name: "Loans",
        data: series,
      },
    ],
    xaxis: {
      categories: labels,
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      title: {
        text: "Number of Loans",
        style: {
          fontSize: "14px",
          fontWeight: 600,
        },
      },
    },
    colors: ["#3498db"],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "60%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " loans";
        },
      },
    },
    grid: {
      borderColor: "#e7e7e7",
      row: {
        colors: ["#f3f3f3", "transparent"],
        opacity: 0.5,
      },
    },
  };

  const chartElement = document.querySelector("#monthlyLoansChart");
  if (chartElement) {
    chartElement.innerHTML = "";
    const chart = new ApexCharts(chartElement, options);
    chart.render();
  }
}

// Books Functions
async function loadBooks() {
  try {
    const books = await apiGet("books");
    if (!books) return;

    const tbody = document.querySelector("#booksTable tbody");
    tbody.innerHTML = "";

    books.forEach((book) => {
      const row = tbody.insertRow();
      row.innerHTML = `
                <td>${book.bookid}</td>
                <td>${book.title}</td>
                <td>${book.author_name || "Unknown"}</td>
                <td>${book.genre_name || "Unknown"}</td>
                <td>${book.isbn}</td>
                <td>${book.publicationyear || "N/A"}</td>
                <td>
                    <span class="status ${book.status.toLowerCase()}">${
        book.status
      }</span>
                </td>
            `;
    });
  } catch (error) {
    console.error("Error loading books:", error);
  }
}

// Members Functions
async function loadMembers() {
  try {
    const members = await apiGet("members");
    if (!members) return;

    const tbody = document.querySelector("#membersTable tbody");
    tbody.innerHTML = "";

    members.forEach((member) => {
      const row = tbody.insertRow();
      row.innerHTML = `
                <td>${member.memberid}</td>
                <td>${member.name}</td>
                <td>${member.email}</td>
                <td>${member.phone || "N/A"}</td>
                <td>${new Date(member.joindate).toLocaleDateString()}</td>
            `;
    });
  } catch (error) {
    console.error("Error loading members:", error);
  }
}

// Loans Functions
async function loadLoans() {
  try {
    const loans = await apiGet("loans");
    if (!loans) return;

    const tbody = document.querySelector("#loansTable tbody");
    tbody.innerHTML = "";

    loans.forEach((loan) => {
      const row = tbody.insertRow();
      row.innerHTML = `
                <td>${loan.loanid}</td>
                <td>${loan.book_title || "Unknown"}</td>
                <td>${loan.member_name || "Unknown"}</td>
                <td>${new Date(loan.issuedate).toLocaleDateString()}</td>
                <td>${
                  loan.returndate
                    ? new Date(loan.returndate).toLocaleDateString()
                    : "Not Returned"
                }</td>
                <td>
                    <span class="status ${loan.status.toLowerCase()}">${
        loan.status
      }</span>
                </td>
            `;
    });
  } catch (error) {
    console.error("Error loading loans:", error);
  }
}

// Add Form Functions
function showAddForm(type) {
  currentTable = type;
  const modal = document.getElementById("addModal");
  const modalTitle = document.getElementById("modalTitle");
  const formFields = document.getElementById("formFields");

  modalTitle.textContent = `Add New ${
    type.charAt(0).toUpperCase() + type.slice(1)
  }`;

  let fieldsHTML = "";

  switch (type) {
    case "book":
      fieldsHTML = `
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="authorid">Author ID *</label>
                    <input type="number" id="authorid" name="authorid" required>
                </div>
                <div class="form-group">
                    <label for="isbn">ISBN *</label>
                    <input type="text" id="isbn" name="isbn" required>
                </div>
                <div class="form-group">
                    <label for="genreid">Genre ID *</label>
                    <input type="number" id="genreid" name="genreid" required>
                </div>
                <div class="form-group">
                    <label for="publicationyear">Publication Year</label>
                    <input type="number" id="publicationyear" name="publicationyear">
                </div>
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" name="status">
                        <option value="Available">Available</option>
                        <option value="Borrowed">Borrowed</option>
                    </select>
                </div>
            `;
      break;
    case "member":
      fieldsHTML = `
                <div class="form-group">
                    <label for="name">Name *</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="phone">Phone</label>
                    <input type="tel" id="phone" name="phone">
                </div>
                <div class="form-group">
                    <label for="joindate">Join Date</label>
                    <input type="date" id="joindate" name="joindate" value="${
                      new Date().toISOString().split("T")[0]
                    }">
                </div>
            `;
      break;
    case "loan":
      fieldsHTML = `
                <div class="form-group">
                    <label for="bookid">Book ID *</label>
                    <input type="number" id="bookid" name="bookid" required>
                </div>
                <div class="form-group">
                    <label for="memberid">Member ID *</label>
                    <input type="number" id="memberid" name="memberid" required>
                </div>
                <div class="form-group">
                    <label for="issuedate">Issue Date *</label>
                    <input type="date" id="issuedate" name="issuedate" value="${
                      new Date().toISOString().split("T")[0]
                    }" required>
                </div>
                <div class="form-group">
                    <label for="returndate">Return Date</label>
                    <input type="date" id="returndate" name="returndate">
                </div>
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" name="status">
                        <option value="Active">Active</option>
                        <option value="Returned">Returned</option>
                    </select>
                </div>
            `;
      break;
  }

  formFields.innerHTML = fieldsHTML;
  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("addModal").style.display = "none";
  document.getElementById("addForm").reset();
}

// Form Submit Handler
document
  .getElementById("addForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    console.log("Submitting form data:", data);

    try {
      // Determine the correct endpoint
      let endpoint;
      if (currentTable === "book") {
        endpoint = "books";
      } else if (currentTable === "member") {
        endpoint = "members";
      } else if (currentTable === "loan") {
        endpoint = "loans";
      } else {
        // For manage data forms (genres, authors, etc.)
        endpoint = currentTable;
      }

      const result = await apiPost(endpoint, data);

      console.log("API response:", result);

      closeModal();

      // Reload the appropriate section
      switch (currentTable) {
        case "book":
          loadBooks();
          break;
        case "member":
          loadMembers();
          break;
        case "loan":
          loadLoans();
          break;
        default:
          // For manage data sections, reload that table
          showManageTable(currentTable);
          break;
      }

      loadDashboard(); // Refresh dashboard stats

      // Show success message
      const message = result?.message || "Data added successfully!";
      showNotification(message, "success");
    } catch (error) {
      console.error("Form submission error:", error);

      // Extract error message from the response
      let errorMessage = "Error adding data. Please try again.";

      if (error.message) {
        try {
          // Try to parse JSON error response
          const errorResponse = JSON.parse(error.message);
          errorMessage = errorResponse.error || errorMessage;
        } catch (parseError) {
          // If not JSON, use the raw message
          errorMessage = error.message;
        }
      }

      showNotification(errorMessage, "error");
    }
  });

// Manage Data Functions
async function showManageTable(tableName) {
  try {
    const data = await apiGet(tableName);
    if (!data) return;

    const container = document.getElementById("manageTableContainer");

    let tableHTML = `
            <div class="section-header">
                <h3>Manage ${
                  tableName.charAt(0).toUpperCase() + tableName.slice(1)
                }</h3>
                <button class="btn btn-primary" data-action="manage-add" data-table="${tableName}">
                    <i class="fas fa-plus"></i> Add New
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
        `;

    // Generate table headers based on data structure
    if (data.length > 0) {
      Object.keys(data[0]).forEach((key) => {
        tableHTML += `<th>${key.charAt(0).toUpperCase() + key.slice(1)}</th>`;
      });
    }

    tableHTML += `
                        </tr>
                    </thead>
                    <tbody>
        `;

    // Generate table rows
    data.forEach((item) => {
      tableHTML += "<tr>";
      Object.values(item).forEach((value) => {
        tableHTML += `<td>${value || "N/A"}</td>`;
      });
      tableHTML += "</tr>";
    });

    tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

    container.innerHTML = tableHTML;

    // Add event listener to the dynamically created button
    const addButton = container.querySelector('[data-action="manage-add"]');
    if (addButton) {
      addButton.addEventListener("click", function (e) {
        e.preventDefault();
        const table = this.dataset.table;
        console.log("Manage add button clicked for table:", table);

        if (table) {
          showManageAddForm(table);
        }
      });
    }
  } catch (error) {
    console.error(`Error loading ${tableName}:`, error);
  }
}

function showManageAddForm(tableName) {
  currentTable = tableName;
  const modal = document.getElementById("addModal");
  const modalTitle = document.getElementById("modalTitle");
  const formFields = document.getElementById("formFields");

  modalTitle.textContent = `Add New ${
    tableName.charAt(0).toUpperCase() + tableName.slice(1)
  }`;

  let fieldsHTML = "";

  switch (tableName) {
    case "genres":
    case "categories":
      fieldsHTML = `
                <div class="form-group">
                    <label for="name">Name *</label>
                    <input type="text" id="name" name="name" required>
                </div>
            `;
      break;
    case "authors":
      fieldsHTML = `
                <div class="form-group">
                    <label for="name">Name *</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="bio">Biography</label>
                    <textarea id="bio" name="bio" rows="3"></textarea>
                </div>
            `;
      break;
    case "publishers":
      fieldsHTML = `
                <div class="form-group">
                    <label for="name">Name *</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="address">Address</label>
                    <textarea id="address" name="address" rows="2"></textarea>
                </div>
            `;
      break;
    case "fines":
      fieldsHTML = `
                <div class="form-group">
                    <label for="memberid">Member ID *</label>
                    <input type="number" id="memberid" name="memberid" required>
                </div>
                <div class="form-group">
                    <label for="amount">Amount *</label>
                    <input type="number" id="amount" name="amount" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="issuedate">Issue Date *</label>
                    <input type="date" id="issuedate" name="issuedate" value="${
                      new Date().toISOString().split("T")[0]
                    }" required>
                </div>
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" name="status">
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                    </select>
                </div>
            `;
      break;
    case "reservations":
      fieldsHTML = `
                <div class="form-group">
                    <label for="bookid">Book ID *</label>
                    <input type="number" id="bookid" name="bookid" required>
                </div>
                <div class="form-group">
                    <label for="memberid">Member ID *</label>
                    <input type="number" id="memberid" name="memberid" required>
                </div>
                <div class="form-group">
                    <label for="reservationdate">Reservation Date *</label>
                    <input type="date" id="reservationdate" name="reservationdate" value="${
                      new Date().toISOString().split("T")[0]
                    }" required>
                </div>
            `;
      break;
    case "librarystaff":
      fieldsHTML = `
                <div class="form-group">
                    <label for="name">Name *</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="role">Role *</label>
                    <input type="text" id="role" name="role" required>
                </div>
                <div class="form-group">
                    <label for="contact">Contact</label>
                    <input type="tel" id="contact" name="contact">
                </div>
            `;
      break;
  }

  formFields.innerHTML = fieldsHTML;
  modal.style.display = "block";
}

// Report Functions
async function generateOverdueReport() {
  try {
    const overdueBooks = await apiGet("reports/overdue");
    if (!overdueBooks) return;

    const container = document.getElementById("reportResults");

    let reportHTML = `
            <h3>Overdue Books Report</h3>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
        `;

    if (overdueBooks.length === 0) {
      reportHTML += "<p>No overdue books found.</p>";
    } else {
      reportHTML += `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Loan ID</th>
                                <th>Book Title</th>
                                <th>Member Name</th>
                                <th>Email</th>
                                <th>Issue Date</th>
                                <th>Days Overdue</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

      overdueBooks.forEach((book) => {
        reportHTML += `
                    <tr>
                        <td>${book.loanid}</td>
                        <td>${book.title}</td>
                        <td>${book.member_name}</td>
                        <td>${book.email}</td>
                        <td>${new Date(
                          book.issuedate
                        ).toLocaleDateString()}</td>
                        <td>${book.days_overdue}</td>
                    </tr>
                `;
      });

      reportHTML += `
                        </tbody>
                    </table>
                </div>
            `;
    }

    container.innerHTML = reportHTML;
  } catch (error) {
    console.error("Error generating overdue report:", error);
  }
}

async function generatePopularBooksReport() {
  try {
    const loans = await apiGet("loans");
    if (!loans) return;

    // Count loans by book
    const bookCounts = {};
    loans.forEach((loan) => {
      const bookTitle = loan.book_title || "Unknown";
      bookCounts[bookTitle] = (bookCounts[bookTitle] || 0) + 1;
    });

    // Sort by popularity
    const popularBooks = Object.entries(bookCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const container = document.getElementById("reportResults");

    let reportHTML = `
            <h3>Popular Books Report</h3>
            <p>Top 10 most borrowed books</p>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Book Title</th>
                            <th>Times Borrowed</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    popularBooks.forEach((book, index) => {
      reportHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${book[0]}</td>
                    <td>${book[1]}</td>
                </tr>
            `;
    });

    reportHTML += `
                    </tbody>
                </table>
            </div>
        `;

    container.innerHTML = reportHTML;
  } catch (error) {
    console.error("Error generating popular books report:", error);
  }
}

// Utility Functions
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        ${type === "success" ? "background: #2ecc71;" : "background: #e74c3c;"}
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Modal click outside to close
window.onclick = function (event) {
  const modal = document.getElementById("addModal");
  if (event.target === modal) {
    closeModal();
  }
};
