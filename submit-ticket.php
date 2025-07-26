<?php
require_once 'db/config.php';
redirectIfNotAuthenticated();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Submit Ticket - Helpdesk System</title>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>Helpdesk System</h1>
            <nav>
                <span class="welcome">Welcome, <?php echo htmlspecialchars($_SESSION['name']); ?></span>
                <a href="dashboard.php" class="btn">Dashboard</a>
                <a href="logout.php" class="btn btn-secondary">Logout</a>
            </nav>
        </div>
    </header>

    <main class="container">
        <section class="ticket-form-container">
            <h2>Submit New Ticket</h2>
            
            <form id="ticket-form" method="POST" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="subject">Subject</label>
                    <input type="text" id="subject" name="subject" required maxlength="100">
                    <small class="error-message" id="subject-error"></small>
                </div>
                
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description" rows="5" required></textarea>
                    <small class="error-message" id="description-error"></small>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="priority">Priority</label>
                        <select id="priority" name="priority" required>
                            <option value="">Select Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <small class="error-message" id="priority-error"></small>
                    </div>
                    
                    <div class="form-group">
                        <label for="category">Category</label>
                        <select id="category" name="category" required>
                            <option value="">Select Category</option>
                            <option value="technical">Technical</option>
                            <option value="billing">Billing</option>
                            <option value="general">General Inquiry</option>
                            <option value="bug">Bug Report</option>
                        </select>
                        <small class="error-message" id="category-error"></small>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="attachments">Attachments (optional)</label>
                    <input type="file" id="attachments" name="attachments[]" multiple>
                    <small>Max file size: 5MB per file (JPG, PNG, PDF, DOC, TXT)</small>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Submit Ticket</button>
                    <a href="dashboard.php" class="btn btn-secondary">Cancel</a>
                </div>
            </form>
        </section>
    </main>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('ticket-form');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateTicketForm()) {
                submitTicketForm();
            }
        });
        
        function validateTicketForm() {
            let isValid = true;
            
            // Reset error messages
            document.querySelectorAll('.error-message').forEach(el => {
                el.textContent = '';
            });
            
            // Validate subject
            const subject = document.getElementById('subject').value.trim();
            if (!subject) {
                document.getElementById('subject-error').textContent = 'Subject is required';
                isValid = false;
            } else if (subject.length > 100) {
                document.getElementById('subject-error').textContent = 'Subject must be 100 characters or less';
                isValid = false;
            }
            
            // Validate description
            const description = document.getElementById('description').value.trim();
            if (!description) {
                document.getElementById('description-error').textContent = 'Description is required';
                isValid = false;
            }
            
            // Validate priority
            const priority = document.getElementById('priority').value;
            if (!priority) {
                document.getElementById('priority-error').textContent = 'Priority is required';
                isValid = false;
            }
            
            // Validate category
            const category = document.getElementById('category').value;
            if (!category) {
                document.getElementById('category-error').textContent = 'Category is required';
                isValid = false;
            }
            
            return isValid;
        }
        
        function submitTicketForm() {
            const form = document.getElementById('ticket-form');
            const submitBtn = form.querySelector('button[type="submit"]');
            const formData = new FormData(form);
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            
            fetch('ticket-handler.php?action=create', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showAlert('success', `Ticket created successfully! ID: ${data.ticketId}`);
                    form.reset();
                    setTimeout(() => {
                        window.location.href = 'dashboard.php';
                    }, 2000);
                } else {
                    showAlert('error', data.message || 'Failed to create ticket');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('error', 'An error occurred while submitting the ticket');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit Ticket';
            });
        }

        function showAlert(type, message) {
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.textContent = message;
            
            document.body.appendChild(alert);
            
            setTimeout(() => {
                alert.classList.add('fade-out');
                setTimeout(() => {
                    alert.remove();
                }, 500);
            }, 3000);
        }
    });
    </script>
</body>
</html>