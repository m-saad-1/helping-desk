<?php
require_once 'db/config.php';
redirectIfNotAdmin();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Helpdesk System</title>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>Helpdesk System</h1>
            <nav>
                <span class="welcome">Welcome, <?php echo htmlspecialchars($_SESSION['name']); ?> (Admin)</span>
                <a href="dashboard.php" class="btn">User View</a>
                <a href="logout.php" class="btn btn-secondary">Logout</a>
            </nav>
        </div>
    </header>

    <main class="container">
        <section class="dashboard-header">
            <h2>Admin Dashboard</h2>
            <div class="actions">
                <button id="refresh-tickets" class="btn btn-secondary">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        </section>

        <section class="stats-cards">
            <div class="stat-card open">
                <h3>Open Tickets</h3>
                <p id="open-count">0</p>
                <div class="stat-progress" id="open-progress"></div>
            </div>
            <div class="stat-card in-progress">
                <h3>In Progress</h3>
                <p id="in-progress-count">0</p>
                <div class="stat-progress" id="in-progress-progress"></div>
            </div>
            <div class="stat-card closed">
                <h3>Closed</h3>
                <p id="closed-count">0</p>
                <div class="stat-progress" id="closed-progress"></div>
            </div>
        </section>

        <section class="tickets-container">
            <div class="filters">
                <select id="status-filter" class="form-control">
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="closed">Closed</option>
                </select>
                <select id="category-filter" class="form-control">
                    <option value="all">All Categories</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="general">General</option>
                    <option value="bug">Bug</option>
                </select>
                <select id="priority-filter" class="form-control">
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                <select id="time-filter" class="form-control">
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                </select>
                <input type="text" id="search-tickets" placeholder="Search tickets..." class="form-control">
            </div>

            <div id="tickets-list" class="tickets-list">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading tickets...</p>
                </div>
            </div>
        </section>
    </main>

    <!-- Ticket Details Modal -->
    <div id="ticket-modal" class="modal">
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2 id="modal-title">Ticket Details</h2>
            <div class="modal-body">
                <div class="ticket-info">
                    <p><strong>Ticket ID:</strong> <span id="modal-ticket-id"></span></p>
                    <p><strong>Submitted by:</strong> <span id="modal-submitter"></span></p>
                    <p><strong>Date:</strong> <span id="modal-date"></span></p>
                    <p><strong>Status:</strong> <span id="modal-status"></span></p>
                    <p><strong>Priority:</strong> <span id="modal-priority"></span></p>
                    <p><strong>Category:</strong> <span id="modal-category"></span></p>
                </div>
                
                <div class="ticket-description">
                    <h3>Description</h3>
                    <p id="modal-description"></p>
                </div>
                
                <div class="ticket-attachments" id="modal-attachments">
                    <h3>Attachments</h3>
                    <div class="attachments-list"></div>
                </div>
                
                <div class="ticket-actions">
                    <div class="action-group">
                        <label for="status-change">Change Status:</label>
                        <select id="status-change" class="form-control">
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="closed">Closed</option>
                        </select>
                        <button id="update-status" class="btn btn-primary">Update</button>
                    </div>
                    <div class="action-group">
                        <label for="priority-change">Change Priority:</label>
                        <select id="priority-change" class="form-control">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <button id="update-priority" class="btn btn-primary">Update</button>
                    </div>
                    <button id="delete-ticket" class="btn btn-danger">Delete Ticket</button>
                </div>
                
                <div class="ticket-notes">
                    <h3>Admin Notes</h3>
                    <div id="notes-list"></div>
                    <textarea id="new-note" placeholder="Add a note..." class="form-control"></textarea>
                    <button id="add-note" class="btn btn-secondary">Add Note</button>
                </div>
            </div>
        </div>
    </div>

    <script src="js/admin-dashboard.js"></script>
</body>
</html>