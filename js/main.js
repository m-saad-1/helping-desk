document.addEventListener('DOMContentLoaded', function() {
    // Common functionality
    if (document.getElementById('logout-btn')) {
        document.getElementById('logout-btn').addEventListener('click', logout);
    }
    
    // Registration form
    if (document.getElementById('register-form')) {
        initRegistrationForm();
    }
    
    // User dashboard
    if (document.getElementById('refresh-tickets')) {
        initUserDashboard();
    }
    
    // Admin dashboard
    if (document.getElementById('admin-search')) {
        initAdminDashboard();
    }
    
    // Ticket submission form
    if (document.getElementById('ticket-form')) {
        initTicketForm();
    }
});

function logout() {
    fetch('logout.php')
        .then(() => {
            window.location.href = 'index.php';
        })
        .catch(error => {
            console.error('Logout error:', error);
        });
}

function initRegistrationForm() {
    const form = document.getElementById('register-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = form.elements['name'].value.trim();
        const email = form.elements['email'].value.trim();
        const password = form.elements['password'].value;
        const confirmPassword = form.elements['confirm_password'].value;
        
        // Client-side validation
        let isValid = true;
        
        // Reset error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        
        if (!name) {
            document.getElementById('name-error').textContent = 'Name is required';
            isValid = false;
        }
        
        if (!email) {
            document.getElementById('email-error').textContent = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('email-error').textContent = 'Invalid email format';
            isValid = false;
        }
        
        if (!password) {
            document.getElementById('password-error').textContent = 'Password is required';
            isValid = false;
        } else if (password.length < 6) {
            document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
            isValid = false;
        }
        
        if (!confirmPassword) {
            document.getElementById('confirm-password-error').textContent = 'Please confirm password';
            isValid = false;
        } else if (password !== confirmPassword) {
            document.getElementById('confirm-password-error').textContent = 'Passwords do not match';
            isValid = false;
        }
        
        if (!isValid) return;
        
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        
        fetch('user-handler.php?action=register', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('success', 'Registration successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = 'login.php';
                }, 2000);
            } else {
                showAlert('error', data.message || 'Registration failed');
            }
        })
        .catch(error => {
            showAlert('error', 'An error occurred during registration');
            console.error(error);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Register';
        });
    });
}

function initUserDashboard() {
    // Load tickets initially
    loadTickets();
    
    // Setup refresh button
    document.getElementById('refresh-tickets').addEventListener('click', loadTickets);
    
    // Setup filters
    document.getElementById('status-filter').addEventListener('change', loadTickets);
    document.getElementById('search-tickets').addEventListener('input', function() {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(loadTickets, 500);
    });
}

function loadTickets() {
    const status = document.getElementById('status-filter').value;
    const search = document.getElementById('search-tickets').value;
    
    const ticketsList = document.getElementById('tickets-list');
    ticketsList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading tickets...</p></div>';
    
    let url = `ticket-handler.php?action=list&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayTickets(data.tickets);
            } else {
                showAlert('error', data.message || 'Failed to load tickets');
            }
        })
        .catch(error => {
            showAlert('error', 'An error occurred while loading tickets');
            console.error('Error:', error);
        });
}

function displayTickets(tickets) {
    const ticketsList = document.getElementById('tickets-list');
    
    if (!tickets || tickets.length === 0) {
        ticketsList.innerHTML = '<div class="no-tickets">No tickets found</div>';
        return;
    }
    
    ticketsList.innerHTML = '';
    
    tickets.forEach(ticket => {
        const ticketEl = document.createElement('div');
        ticketEl.className = `ticket-card ${ticket.status}`;
        ticketEl.innerHTML = `
            <div class="ticket-header">
                <span class="ticket-id">${ticket.ticket_id}</span>
                <span class="ticket-status ${ticket.status}">${formatStatus(ticket.status)}</span>
            </div>
            <div class="ticket-body">
                <h3 class="ticket-subject">${decodeAndSanitizeHtml(ticket.subject)}</h3>
                <div class="ticket-meta">
                    <span class="ticket-priority ${ticket.priority}"><i class="fas fa-exclamation-circle"></i> ${ticket.priority}</span>
                    <span class="ticket-category"><i class="fas fa-tag"></i> ${ticket.category}</span>
                    <span class="ticket-date"><i class="far fa-clock"></i> ${formatDate(ticket.created_at)}</span>
                </div>
                ${ticket.user_name ? `<div class="ticket-user">
                    <i class="fas fa-user"></i> ${decodeAndSanitizeHtml(ticket.user_name)}
                </div>` : ''}
            </div>
        `;
        
        // Add click handler if user is admin
        if (document.getElementById('admin-search')) {
            ticketEl.addEventListener('click', function() {
                viewTicketDetails(ticket.id);
            });
        }
        
        ticketsList.appendChild(ticketEl);
    });
}

// Add this new function if not already present
function decodeAndSanitizeHtml(text) {
    if (!text) return '';
    
    // Create a temporary div element
    const temp = document.createElement('div');
    // Set the HTML content
    temp.innerHTML = text;
    // Get the text content (automatically decoded)
    let decoded = temp.textContent || temp.innerText || '';
    
    // Basic sanitization to prevent XSS
    decoded = decoded.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return decoded;
}

function initAdminDashboard() {
    // Load tickets and stats initially
    loadAdminTickets();
    loadTicketStats();
    
    // Setup refresh button
    document.getElementById('refresh-tickets').addEventListener('click', function() {
        loadAdminTickets();
        loadTicketStats();
    });
    
    // Setup filters
    document.getElementById('status-filter').addEventListener('change', loadAdminTickets);
    document.getElementById('time-filter').addEventListener('change', loadAdminTickets);
    document.getElementById('search-tickets').addEventListener('input', function() {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(loadAdminTickets, 500);
    });
    
    // Setup modal
    const modal = document.getElementById('ticket-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.close-modal');
        
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Status update handler
        document.getElementById('update-status')?.addEventListener('click', function() {
            const ticketId = this.dataset.ticketId;
            const status = document.getElementById('status-change').value;
            
            fetch('ticket-handler.php?action=update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `ticket_id=${ticketId}&status=${status}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('success', 'Status updated successfully');
                    loadAdminTickets();
                    loadTicketStats();
                } else {
                    showAlert('error', data.message || 'Failed to update status');
                }
            })
            .catch(error => {
                showAlert('error', 'An error occurred while updating status');
                console.error('Error:', error);
            });
        });
        
        // Add note handler
        document.getElementById('add-note')?.addEventListener('click', function() {
            const ticketId = this.dataset.ticketId;
            const noteText = document.getElementById('new-note').value.trim();
            
            if (!noteText) {
                showAlert('error', 'Note text cannot be empty');
                return;
            }
            
            fetch('ticket-handler.php?action=add-note', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `ticket_id=${ticketId}&note_text=${encodeURIComponent(noteText)}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('success', 'Note added successfully');
                    document.getElementById('new-note').value = '';
                    viewTicketDetails(ticketId); // Refresh the view
                } else {
                    showAlert('error', data.message || 'Failed to add note');
                }
            })
            .catch(error => {
                showAlert('error', 'An error occurred while adding note');
                console.error('Error:', error);
            });
        });
    }
}

function loadAdminTickets() {
    const status = document.getElementById('status-filter').value;
    const timeFilter = document.getElementById('time-filter').value;
    const search = document.getElementById('search-tickets').value;
    
    const ticketsList = document.getElementById('tickets-list');
    ticketsList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading tickets...</p></div>';
    
    let url = `ticket-handler.php?action=admin-list&status=${status}&time=${timeFilter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayAdminTickets(data.tickets);
            } else {
                showAlert('error', data.message || 'Failed to load tickets');
            }
        })
        .catch(error => {
            showAlert('error', 'An error occurred while loading tickets');
            console.error('Error:', error);
        });
}

function displayAdminTickets(tickets) {
    const ticketsList = document.getElementById('tickets-list');
    
    if (!tickets || tickets.length === 0) {
        ticketsList.innerHTML = '<div class="no-tickets">No tickets found</div>';
        return;
    }
    
    ticketsList.innerHTML = '';
    
    tickets.forEach(ticket => {
        const ticketEl = document.createElement('div');
        ticketEl.className = `ticket-card ${ticket.status}`;
        ticketEl.innerHTML = `
            <div class="ticket-header">
                <span class="ticket-id">${ticket.ticket_id}</span>
                <span class="ticket-status ${ticket.status}">${formatStatus(ticket.status)}</span>
            </div>
            <div class="ticket-body">
                <h3 class="ticket-subject">${escapeHtml(ticket.subject)}</h3>
                <div class="ticket-meta">
                    <span class="ticket-priority ${ticket.priority}"><i class="fas fa-exclamation-circle"></i> ${ticket.priority}</span>
                    <span class="ticket-category"><i class="fas fa-tag"></i> ${ticket.category}</span>
                    <span class="ticket-date"><i class="far fa-clock"></i> ${formatDate(ticket.created_at)}</span>
                </div>
                <div class="ticket-user">
                    <i class="fas fa-user"></i> ${escapeHtml(ticket.user_name)} (${escapeHtml(ticket.user_email)})
                </div>
            </div>
        `;
        
        ticketEl.addEventListener('click', function() {
            viewTicketDetails(ticket.id);
        });
        
        ticketsList.appendChild(ticketEl);
    });
}

function loadTicketStats() {
    fetch('ticket-handler.php?action=stats')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                document.getElementById('open-count').textContent = data.stats.open;
                document.getElementById('in-progress-count').textContent = data.stats['in-progress'];
                document.getElementById('closed-count').textContent = data.stats.closed;
            }
        })
        .catch(error => {
            console.error('Error loading stats:', error);
        });
}

function viewTicketDetails(ticketId) {
    fetch(`ticket-handler.php?action=details&id=${ticketId}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const ticket = data.ticket;
                const modal = document.getElementById('ticket-modal');
                
                if (!modal) return;
                
                // Set ticket data
                document.getElementById('modal-title').textContent = escapeHtml(ticket.subject);
                document.getElementById('modal-ticket-id').textContent = escapeHtml(ticket.ticketId);
                document.getElementById('modal-submitter').textContent = `${escapeHtml(ticket.userName)} (${escapeHtml(ticket.userEmail)})`;
                document.getElementById('modal-date').textContent = formatDate(ticket.createdAt);
                document.getElementById('modal-status').textContent = formatStatus(ticket.status);
                document.getElementById('modal-priority').textContent = escapeHtml(ticket.priority);
                document.getElementById('modal-category').textContent = escapeHtml(ticket.category);
                document.getElementById('modal-description').textContent = escapeHtml(ticket.description);
                
                // Set current status in dropdown
                document.getElementById('status-change').value = ticket.status;
                
                // Store ticket ID for updates
                document.getElementById('update-status').dataset.ticketId = ticketId;
                document.getElementById('add-note').dataset.ticketId = ticketId;
                
                // Display attachments
                const attachmentsList = document.querySelector('#modal-attachments .attachments-list');
                attachmentsList.innerHTML = '';
                
                if (ticket.attachments && ticket.attachments.length > 0) {
                    ticket.attachments.forEach(attachment => {
                        const attachmentEl = document.createElement('div');
                        attachmentEl.className = 'attachment-item';
                        attachmentEl.innerHTML = `
                            <a href="${escapeHtml(attachment.file_path)}" target="_blank" download="${escapeHtml(attachment.file_name)}">
                                <i class="fas fa-paperclip"></i> ${escapeHtml(attachment.file_name)}
                            </a>
                        `;
                        attachmentsList.appendChild(attachmentEl);
                    });
                } else {
                    attachmentsList.innerHTML = '<p>No attachments</p>';
                }
                
                // Display notes
                const notesList = document.getElementById('notes-list');
                notesList.innerHTML = '';
                
                if (ticket.notes && ticket.notes.length > 0) {
                    ticket.notes.forEach(note => {
                        const noteEl = document.createElement('div');
                        noteEl.className = 'note-item';
                        noteEl.innerHTML = `
                            <div class="note-header">
                                <strong>${escapeHtml(note.admin_name)}</strong>
                                <span>${formatDate(note.created_at)}</span>
                            </div>
                            <div class="note-text">${escapeHtml(note.note_text)}</div>
                        `;
                        notesList.appendChild(noteEl);
                    });
                } else {
                    notesList.innerHTML = '<p>No notes yet</p>';
                }
                
                // Show modal
                modal.style.display = 'block';
            } else {
                showAlert('error', data.message || 'Failed to load ticket details');
            }
        })
        .catch(error => {
            showAlert('error', 'An error occurred while loading ticket details');
            console.error('Error:', error);
        });
}

function initTicketForm() {
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
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                // Handle validation errors
                if (data.errors) {
                    Object.entries(data.errors).forEach(([field, error]) => {
                        const errorElement = document.getElementById(`${field}-error`);
                        if (errorElement) {
                            errorElement.textContent = error;
                        }
                    });
                }
                throw new Error(data.message || 'Failed to create ticket');
            }
            return data;
        })
        .then(data => {
            if (data.success) {
                showAlert('success', `Ticket created successfully! ID: ${data.ticketId}`);
                form.reset();
                setTimeout(() => {
                    window.location.href = 'dashboard.php';
                }, 2000);
            } else {
                throw new Error(data.message || 'Failed to create ticket');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('error', error.message || 'An error occurred while submitting the ticket');
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
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    
    // First decode any existing HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = unsafe;
    let decoded = textarea.value;
    
    // Only escape the absolutely necessary characters to prevent XSS
    return decoded
        .replace(/</g, "&lt;")  // Only escape < to prevent HTML injection
        .replace(/>/g, "&gt;");  // Only escape > for symmetry and good practice
}