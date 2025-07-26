<?php
session_start();

$host = 'localhost';
$dbname = 'helpdesk_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

function isAuthenticated() {
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

function redirectIfNotAuthenticated() {
    if (!isAuthenticated()) {
        header("Location: login.php");
        exit();
    }
}

function redirectIfNotAdmin() {
    redirectIfNotAuthenticated();
    if (!isAdmin()) {
        header("Location: dashboard.php");
        exit();
    }
}

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function generateTicketId() {
    return 'TKT-' . strtoupper(uniqid());
}

// Create uploads directory if it doesn't exist
$uploadsDir = __DIR__ . '/../uploads/';
if (!file_exists($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}
?>