<?php
require_once __DIR__ . '/../db/config.php';

function generateTicketId() {
    return 'TKT-' . strtoupper(uniqid());
}

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function sendEmailNotification($to, $subject, $message) {
    $headers = "From: helpdesk@yourdomain.com\r\n";
    $headers .= "Reply-To: helpdesk@yourdomain.com\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    return mail($to, $subject, $message, $headers);
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
        header("Location: index.html");
        exit();
    }
}

// MySQL specific helper functions
function getPDO() {
    global $pdo;
    return $pdo;
}

function getUserById($userId) {
    $pdo = getPDO();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    return $stmt->fetch();
}

function getUserByEmail($email) {
    $pdo = getPDO();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    return $stmt->fetch();
}
?>