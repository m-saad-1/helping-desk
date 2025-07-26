<?php
require_once __DIR__ . '/db/config.php';

// Start output buffering
if (ob_get_level()) ob_end_clean();

header('Content-Type: application/json');

// Check if user is authenticated
if (!isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'create':
            handleTicketCreation();
            break;
        case 'admin-list':
            handleAdminTicketList();
            break;
        case 'list':
            handleUserTicketList();
            break;
        case 'stats':
            handleTicketStats();
            break;
        case 'details':
            handleTicketDetails();
            break;
        case 'update-status':
            handleStatusUpdate();
            break;
        case 'update-priority':
            handlePriorityUpdate();
            break;
        case 'add-note':
            handleAddNote();
            break;
        case 'delete':
            handleDeleteTicket();
            break;
        case 'close-ticket':
            handleCloseTicket();
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    error_log('Database error: ' . $e->getMessage());
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    error_log('Error: ' . $e->getMessage());
}


function handleTicketCreation() {
    global $pdo;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Invalid request method");
    }
    
    // Validate required fields
    $required = ['subject', 'description', 'priority', 'category'];
    foreach ($required as $field) {
        if (empty($_POST[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Validate priority and category
    $validPriorities = ['low', 'medium', 'high'];
    if (!in_array($_POST['priority'], $validPriorities)) {
        throw new Exception("Invalid priority value");
    }
    
    $validCategories = ['technical', 'billing', 'general', 'bug'];
    if (!in_array($_POST['category'], $validCategories)) {
        throw new Exception("Invalid category value");
    }
    
    // Process file uploads
    $attachments = [];
    if (!empty($_FILES['attachments'])) {
        $uploadDir = __DIR__ . '/../uploads/';
        
        // Create upload directory if it doesn't exist
        if (!file_exists($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                throw new Exception("Failed to create upload directory");
            }
        }

        foreach ($_FILES['attachments']['tmp_name'] as $key => $tmpName) {
            if ($_FILES['attachments']['error'][$key] !== UPLOAD_ERR_OK) continue;
            
            $fileName = basename($_FILES['attachments']['name'][$key]);
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'];
            
            if (!in_array($fileExt, $allowed)) {
                continue;
            }
            
            $newName = uniqid() . '.' . $fileExt;
            $targetPath = $uploadDir . $newName;
            
            if (move_uploaded_file($tmpName, $targetPath)) {
                $attachments[] = [
                    'name' => $fileName,
                    'path' => 'uploads/' . $newName
                ];
            }
        }
    }
    
    // Generate ticket ID
    $ticketId = generateTicketId();
    
    // Create ticket
    $stmt = $pdo->prepare("
        INSERT INTO tickets (ticket_id, user_id, subject, description, priority, category) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $ticketId,
        $_SESSION['user_id'],
        sanitizeInput($_POST['subject']),
        sanitizeInput($_POST['description']),
        $_POST['priority'],
        $_POST['category']
    ]);
    
    $ticketDbId = $pdo->lastInsertId();
    
    // Add attachments
    if (!empty($attachments)) {
        $stmt = $pdo->prepare("
            INSERT INTO ticket_attachments (ticket_id, file_name, file_path)
            VALUES (?, ?, ?)
        ");
        
        foreach ($attachments as $attachment) {
            $stmt->execute([$ticketDbId, $attachment['name'], $attachment['path']]);
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Ticket created successfully',
        'ticketId' => $ticketId
    ]);
}

function handleAdminTicketList() {
    global $pdo;
    
    $status = $_GET['status'] ?? 'all';
    $category = $_GET['category'] ?? 'all';
    $priority = $_GET['priority'] ?? 'all';
    $timeFilter = $_GET['time'] ?? 'all';
    $search = $_GET['search'] ?? '';
    
    $query = "SELECT t.*, u.name as user_name, u.email as user_email FROM tickets t 
              JOIN users u ON t.user_id = u.id WHERE 1=1";
    
    $params = [];
    
    if ($status !== 'all') {
        $query .= " AND t.status = ?";
        $params[] = $status;
    }
    
    if ($category !== 'all') {
        $query .= " AND t.category = ?";
        $params[] = $category;
    }
    
    if ($priority !== 'all') {
        $query .= " AND t.priority = ?";
        $params[] = $priority;
    }
    
    if (!empty($search)) {
        $query .= " AND (t.subject LIKE ? OR t.description LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    if ($timeFilter !== 'all') {
        $dateCondition = "";
        switch ($timeFilter) {
            case 'today':
                $dateCondition = "DATE(t.created_at) = CURDATE()";
                break;
            case 'week':
                $dateCondition = "t.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                break;
            case 'month':
                $dateCondition = "t.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
                break;
        }
        if ($dateCondition) {
            $query .= " AND $dateCondition";
        }
    }
    
    $query .= " ORDER BY t.created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $tickets = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'tickets' => $tickets
    ]);
}

function handleUserTicketList() {
    global $pdo;
    
    $status = $_GET['status'] ?? 'all';
    $category = $_GET['category'] ?? 'all';
    $priority = $_GET['priority'] ?? 'all';
    $search = $_GET['search'] ?? '';
    
    // Query to show all tickets
    $query = "SELECT t.*, u.name as user_name FROM tickets t 
              JOIN users u ON t.user_id = u.id WHERE 1=1";
    
    $params = [];
    
    if ($status !== 'all') {
        $query .= " AND t.status = ?";
        $params[] = $status;
    }
    
    if ($category !== 'all') {
        $query .= " AND t.category = ?";
        $params[] = $category;
    }
    
    if ($priority !== 'all') {
        $query .= " AND t.priority = ?";
        $params[] = $priority;
    }
    
    if (!empty($search)) {
        $query .= " AND (t.subject LIKE ? OR t.description LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    $query .= " ORDER BY t.created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $tickets = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'tickets' => $tickets
    ]);
}
function handleTicketStats() {
    global $pdo;
    
    $stats = [];
    $statuses = ['open', 'in-progress', 'closed'];
    
    foreach ($statuses as $status) {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM tickets WHERE status = ?");
        $stmt->execute([$status]);
        $result = $stmt->fetch();
        $stats[$status] = $result['count'];
    }
    
    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);
}

function handleTicketDetails() {
    global $pdo;
    
    $ticketId = $_GET['id'] ?? 0;
    
    // Get ticket info
    $stmt = $pdo->prepare("
        SELECT t.*, u.name as user_name, u.email as user_email 
        FROM tickets t JOIN users u ON t.user_id = u.id 
        WHERE t.id = ?
    ");
    $stmt->execute([$ticketId]);
    $ticket = $stmt->fetch();
    
    if (!$ticket) {
        throw new Exception("Ticket not found");
    }
    
    // Get attachments
    $stmt = $pdo->prepare("SELECT * FROM ticket_attachments WHERE ticket_id = ?");
    $stmt->execute([$ticketId]);
    $attachments = $stmt->fetchAll();
    
    // Get notes
    $stmt = $pdo->prepare("
        SELECT tn.*, u.name as admin_name 
        FROM ticket_notes tn JOIN users u ON tn.admin_id = u.id 
        WHERE tn.ticket_id = ? 
        ORDER BY tn.created_at DESC
    ");
    $stmt->execute([$ticketId]);
    $notes = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'ticket' => [
            'id' => $ticket['id'],
            'ticketId' => $ticket['ticket_id'],
            'subject' => $ticket['subject'],
            'description' => $ticket['description'],
            'priority' => $ticket['priority'],
            'category' => $ticket['category'],
            'status' => $ticket['status'],
            'createdAt' => $ticket['created_at'],
            'userName' => $ticket['user_name'],
            'userEmail' => $ticket['user_email'],
            'attachments' => $attachments,
            'notes' => $notes
        ]
    ]);
}

function handleStatusUpdate() {
    global $pdo;
    
    if (!isAdmin()) {
        throw new Exception("Unauthorized");
    }
    
    $ticketId = $_POST['ticket_id'] ?? 0;
    $status = $_POST['status'] ?? '';
    
    if (!in_array($status, ['open', 'in-progress', 'closed'])) {
        throw new Exception("Invalid status");
    }
    
    $stmt = $pdo->prepare("UPDATE tickets SET status = ? WHERE id = ?");
    $stmt->execute([$status, $ticketId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Status updated'
    ]);
}

function handlePriorityUpdate() {
    global $pdo;
    
    $ticketId = $_POST['ticket_id'] ?? 0;
    $priority = $_POST['priority'] ?? '';
    
    if (!in_array($priority, ['low', 'medium', 'high'])) {
        throw new Exception("Invalid priority");
    }
    
    $stmt = $pdo->prepare("UPDATE tickets SET priority = ? WHERE id = ?");
    $stmt->execute([$priority, $ticketId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Priority updated'
    ]);
}

function handleAddNote() {
    global $pdo;
    
    if (!isAdmin()) {
        throw new Exception("Unauthorized");
    }
    
    $ticketId = $_POST['ticket_id'] ?? 0;
    $noteText = $_POST['note_text'] ?? '';
    
    if (empty($noteText)) {
        throw new Exception("Note text is required");
    }
    
    $stmt = $pdo->prepare("INSERT INTO ticket_notes (ticket_id, admin_id, note_text) VALUES (?, ?, ?)");
    $stmt->execute([
        $ticketId,
        $_SESSION['user_id'],
        sanitizeInput($noteText)
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Note added'
    ]);
}

function handleDeleteTicket() {
    global $pdo;
    
    if (!isAdmin()) {
        throw new Exception("Unauthorized");
    }
    
    $ticketId = $_POST['ticket_id'] ?? 0;
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Delete attachments
        $stmt = $pdo->prepare("DELETE FROM ticket_attachments WHERE ticket_id = ?");
        $stmt->execute([$ticketId]);
        
        // Delete notes
        $stmt = $pdo->prepare("DELETE FROM ticket_notes WHERE ticket_id = ?");
        $stmt->execute([$ticketId]);
        
        // Delete ticket
        $stmt = $pdo->prepare("DELETE FROM tickets WHERE id = ?");
        $stmt->execute([$ticketId]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Ticket deleted'
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function handleCloseTicket() {
    global $pdo;
    
    $ticketId = $_POST['ticket_id'] ?? 0;
    
    $stmt = $pdo->prepare("UPDATE tickets SET status = 'closed' WHERE id = ? AND user_id = ?");
    $stmt->execute([$ticketId, $_SESSION['user_id']]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Ticket closed'
        ]);
    } else {
        throw new Exception("Failed to close ticket");
    }
}
