<?php
require_once 'config.php';

// Create tables if they don't exist
$pdo->exec("
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
");

$pdo->exec("
    CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id VARCHAR(20) NOT NULL UNIQUE,
        subject VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        priority ENUM('low', 'medium', 'high') NOT NULL,
        category ENUM('technical', 'billing', 'general', 'bug') NOT NULL,
        status ENUM('open', 'in-progress', 'closed') NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        user_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
");

$pdo->exec("
    CREATE TABLE IF NOT EXISTS ticket_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    )
");

$pdo->exec("
    CREATE TABLE IF NOT EXISTS ticket_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        note_text TEXT NOT NULL,
        admin_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
    )
");

// Create admin user if not exists
$adminEmail = 'admin@helpdesk.com';
$adminPassword = password_hash('admin123', PASSWORD_DEFAULT);

$stmt = $pdo->prepare("
    INSERT INTO users (name, email, password, role) 
    VALUES (:name, :email, :password, :role)
    ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password)
");

$stmt->execute([
    ':name' => 'Admin User',
    ':email' => $adminEmail,
    ':password' => $adminPassword,
    ':role' => 'admin'
]);

// Create regular user if not exists
$userEmail = 'user@helpdesk.com';
$userPassword = password_hash('user123', PASSWORD_DEFAULT);

$stmt->execute([
    ':name' => 'Regular User',
    ':email' => $userEmail,
    ':password' => $userPassword,
    ':role' => 'user'
]);

echo "Database initialized successfully!<br>";
echo "Admin: admin@helpdesk.com / admin123<br>";
echo "User: user@helpdesk.com / user123";
?>