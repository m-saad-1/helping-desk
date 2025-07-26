<?php require_once 'db/config.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Helpdesk Ticketing System</title>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>Helpdesk System</h1>
            <nav>
                <?php if (isAuthenticated()): ?>
                    <a href="dashboard.php" class="btn">Dashboard</a>
                    <a href="logout.php" class="btn btn-secondary">Logout</a>
                <?php else: ?>
                    <a href="login.php" class="btn">Login</a>
                    <a href="register.php" class="btn btn-secondary">Register</a>
                <?php endif; ?>
            </nav>
        </div>
    </header>

    <main class="container">
        <section class="hero">
            <h2>Welcome to our Helpdesk System</h2>
            <p>Submit, track, and manage your support tickets in one place.</p>
            <?php if (!isAuthenticated()): ?>
                <div class="cta-buttons">
                    <a href="register.php" class="btn btn-primary">Get Started</a>
                    <a href="login.php" class="btn btn-secondary">Login</a>
                </div>
            <?php else: ?>
                <div class="cta-buttons">
                    <a href="dashboard.php" class="btn btn-primary">Go to Dashboard</a>
                    <a href="submit-ticket.php" class="btn btn-secondary">Submit Ticket</a>
                </div>
            <?php endif; ?>
        </section>

        <section class="features">
            <div class="feature-card">
                <i class="fas fa-ticket-alt"></i>
                <h3>Ticket Submission</h3>
                <p>Easily submit support tickets with attachments.</p>
            </div>
            <div class="feature-card">
                <i class="fas fa-tasks"></i>
                <h3>Ticket Tracking</h3>
                <p>Track your tickets with real-time status updates.</p>
            </div>
            <div class="feature-card">
                <i class="fas fa-headset"></i>
                <h3>24/7 Support</h3>
                <p>Our team is always ready to help you.</p>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; <?php echo date('Y'); ?> Helpdesk System. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>