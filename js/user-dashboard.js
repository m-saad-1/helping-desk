document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadUserTickets();
    
    // Setup event listeners
    document.getElementById('refresh-tickets').addEventListener('click', loadUserTickets);
    
    // Filter event listeners
    document.getElementById('status-filter').addEventListener('change', loadUserTickets);
    document.getElementById('category-filter').addEventListener('change', loadUserTickets);
    document.getElementById('priority-filter').addEventListener('change', loadUserTickets);
    document.getElementById('search-tickets').addEventListener('input', function() {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(loadUserTickets, 500);
    });
    
    // Modal setup
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
    }
});

function loadUserTickets() {
    const status = document.getElementById('status-filter').value;
    const category = document.getElementById('category-filter').value;
    const priority = document.getElementById('priority-filter').value;
    const search = document.getElementById('search-tickets').value;
    
    const ticketsList = document.getElementById('tickets-list');
    ticketsList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading tickets...</p></div>';
    
    let url = `ticket-handler.php?action=list&status=${status}&category=${category}&priority=${priority}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayUserTickets(data.tickets);
            } else {
                showAlert('error', data.message || 'Failed to load tickets');
            }
        })
        .catch(error => {
            showAlert('error', 'An error occurred while loading tickets');
            console.error('Error:', error);
        });
}

function displayUserTickets(tickets) {
    const ticketsList = document.getElementById('tickets-list');
    
    if (!tickets || tickets.length === 0) {
        ticketsList.innerHTML = '<div class="no-tickets">No tickets found matching your criteria</div>';
        return;
    }
    
    ticketsList.innerHTML = '';
    
    tickets.forEach(ticket => {
        const ticketEl = document.createElement('div');
        ticketEl.className = `ticket-card ${ticket.status}`;
        ticketEl.innerHTML = `
            <div class="ticket-header">
                <span class="ticket-id">#${ticket.ticket_id}</span>
                <span class="ticket-status ${ticket.status}">${formatStatus(ticket.status)}</span>
                <span class="ticket-priority-badge ${ticket.priority}">${ticket.priority}</span>
            </div>
            <div class="ticket-body">
                <h3 class="ticket-subject">${escapeHtml(ticket.subject)}</h3>
                <div class="ticket-meta">
                    <span class="ticket-category"><i class="fas fa-tag"></i> ${ticket.category}</span>
                    <span class="ticket-date"><i class="far fa-clock"></i> ${formatDate(ticket.created_at)}</span>
                </div>
            </div>
            <div class="ticket-actions">
                <button class="btn btn-sm btn-view" data-id="${ticket.id}">
                    <i class="fas fa-eye"></i> View
                </button>
                ${ticket.status !== 'closed' ? `
                <button class="btn btn-sm btn-close" data-id="${ticket.id}">
                    <i class="fas fa-check"></i> Mark Resolved
                </button>
                ` : ''}
            </div>
        `;
        
        // Add click handlers
        ticketEl.querySelector('.btn-view').addEventListener('click', function() {
            viewTicketDetails(ticket.id);
        });
        
        const closeBtn = ticketEl.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                if (confirm('Mark this ticket as resolved?')) {
                    closeTicket(ticket.id);
                }
            });
        }
        
        ticketsList.appendChild(ticketEl);
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
                
                // Set ticket data
                document.getElementById('modal-title').textContent = escapeHtml(ticket.subject);
                document.getElementById('modal-ticket-id').textContent = escapeHtml(ticket.ticketId);
                document.getElementById('modal-status').textContent = formatStatus(ticket.status);
                document.getElementById('modal-priority').textContent = capitalizeFirstLetter(ticket.priority);
                document.getElementById('modal-category').textContent = capitalizeFirstLetter(ticket.category);
                document.getElementById('modal-date').textContent = formatDate(ticket.createdAt);
                document.getElementById('modal-description').innerHTML = ticket.description;
                
                // Set current values in dropdowns
                document.getElementById('priority-change').value = ticket.priority;
                
                // Store ticket ID for updates
                document.getElementById('update-priority').dataset.ticketId = ticketId;
                document.getElementById('close-ticket').dataset.ticketId = ticketId;
                
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
                    notesList.innerHTML = '<p>No admin notes yet</p>';
                }
                
                // Show/hide close button based on status
                document.getElementById('close-ticket').style.display = 
                    ticket.status === 'closed' ? 'none' : 'block';
                
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

const editBtn = document.createElement('button');
editBtn.className = 'btn btn-edit';
editBtn.textContent = 'Edit Ticket';
editBtn.addEventListener('click', () => enableTicketEditing(ticketId));
document.querySelector('.modal-actions').prepend(editBtn);

// Add these new functions
function enableTicketEditing(ticketId) {
    // Replace subject with input
    const subjectEl = document.getElementById('modal-title');
    const subjectInput = document.createElement('input');
    subjectInput.type = 'text';
    subjectInput.value = subjectEl.textContent;
    subjectEl.replaceWith(subjectInput);
    
    // Replace description with textarea
    const descEl = document.getElementById('modal-description');
    const descTextarea = document.createElement('textarea');
    descTextarea.value = descEl.textContent;
    descEl.replaceWith(descTextarea);
    
    // Add save/cancel buttons
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-save';
    saveBtn.textContent = 'Save Changes';
    saveBtn.addEventListener('click', () => saveTicketChanges(ticketId, subjectInput.value, descTextarea.value));
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => viewTicketDetails(ticketId));
    
    const editControls = document.createElement('div');
    editControls.className = 'edit-controls';
    editControls.append(saveBtn, cancelBtn);
    document.querySelector('.modal-body').append(editControls);
}

function saveTicketChanges(ticketId, newSubject, newDescription) {
    fetch('ticket-handler.php?action=update-ticket', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `ticket_id=${ticketId}&subject=${encodeURIComponent(newSubject)}&description=${encodeURIComponent(newDescription)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('success', 'Ticket updated successfully');
            viewTicketDetails(ticketId); // Refresh the view
        } else {
            showAlert('error', data.message || 'Failed to update ticket');
        }
    })
    .catch(error => {
        showAlert('error', 'An error occurred while updating ticket');
        console.error('Error:', error);
    });
}
// Update ticket priority
document.getElementById('update-priority')?.addEventListener('click', function() {
    const ticketId = this.dataset.ticketId;
    const priority = document.getElementById('priority-change').value;
    
    fetch('ticket-handler.php?action=update-priority', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `ticket_id=${ticketId}&priority=${priority}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('success', 'Priority updated successfully');
            loadUserTickets();
            document.getElementById('modal-priority').textContent = capitalizeFirstLetter(priority);
        } else {
            showAlert('error', data.message || 'Failed to update priority');
        }
    })
    .catch(error => {
        showAlert('error', 'An error occurred while updating priority');
        console.error('Error:', error);
    });
});

// Close ticket
document.getElementById('close-ticket')?.addEventListener('click', function() {
    const ticketId = this.dataset.ticketId;
    
    if (confirm('Are you sure you want to mark this ticket as resolved?')) {
        fetch('ticket-handler.php?action=close-ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `ticket_id=${ticketId}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('success', 'Ticket marked as resolved');
                document.getElementById('ticket-modal').style.display = 'none';
                loadUserTickets();
            } else {
                showAlert('error', data.message || 'Failed to close ticket');
            }
        })
        .catch(error => {
            showAlert('error', 'An error occurred while closing ticket');
            console.error('Error:', error);
        });
    }
});

function closeTicket(ticketId) {
    fetch('ticket-handler.php?action=close-ticket', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `ticket_id=${ticketId}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('success', 'Ticket marked as resolved');
            loadUserTickets();
        } else {
            showAlert('error', data.message || 'Failed to close ticket');
        }
    })
    .catch(error => {
        showAlert('error', 'An error occurred while closing ticket');
        console.error('Error:', error);
    });
}

// Helper functions (same as in admin-dashboard.js)
function formatStatus(status) {
    const statusMap = {
        'open': 'Open',
        'in-progress': 'In Progress',
        'closed': 'Closed'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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