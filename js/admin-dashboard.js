document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadAdminTickets();
    loadTicketStats();
    
    // Setup event listeners
    document.getElementById('refresh-tickets').addEventListener('click', function() {
        loadAdminTickets();
        loadTicketStats();
    });
    
    // Filter event listeners
    document.getElementById('status-filter').addEventListener('change', loadAdminTickets);
    document.getElementById('category-filter').addEventListener('change', loadAdminTickets);
    document.getElementById('priority-filter').addEventListener('change', loadAdminTickets);
    document.getElementById('time-filter').addEventListener('change', loadAdminTickets);
    document.getElementById('search-tickets').addEventListener('input', function() {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(loadAdminTickets, 500);
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

function loadAdminTickets() {
    const status = document.getElementById('status-filter').value;
    const category = document.getElementById('category-filter').value;
    const priority = document.getElementById('priority-filter').value;
    const timeFilter = document.getElementById('time-filter').value;
    const search = document.getElementById('search-tickets').value;
    
    const ticketsList = document.getElementById('tickets-list');
    ticketsList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading tickets...</p></div>';
    
    let url = `ticket-handler.php?action=admin-list&status=${status}&category=${category}&priority=${priority}&time=${timeFilter}`;
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
                <h3 class="ticket-subject">${decodeHtmlEntities(ticket.subject)}</h3>
                <div class="ticket-meta">
                    <span class="ticket-category"><i class="fas fa-tag"></i> ${ticket.category}</span>
                    <span class="ticket-date"><i class="far fa-clock"></i> ${formatDate(ticket.created_at)}</span>
                </div>
                <div class="ticket-user">
                    <i class="fas fa-user"></i> ${decodeHtmlEntities(ticket.user_name)} (${decodeHtmlEntities(ticket.user_email)})
                </div>
            </div>
            <div class="ticket-actions">
                <button class="btn btn-sm btn-view" data-id="${ticket.id}">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-danger" data-id="${ticket.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        // Add click handlers
        ticketEl.querySelector('.btn-view').addEventListener('click', function() {
            viewTicketDetails(ticket.id);
        });
        
        ticketEl.querySelector('.btn-danger').addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this ticket?')) {
                deleteTicket(ticket.id);
            }
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
                
                // Calculate percentages for visualization
                const total = data.stats.open + data.stats['in-progress'] + data.stats.closed;
                if (total > 0) {
                    document.getElementById('open-progress').style.width = `${(data.stats.open / total) * 100}%`;
                    document.getElementById('in-progress-progress').style.width = `${(data.stats['in-progress'] / total) * 100}%`;
                    document.getElementById('closed-progress').style.width = `${(data.stats.closed / total) * 100}%`;
                }
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
                
                // Set ticket data - using decodeHtmlEntities for proper display
                document.getElementById('modal-title').textContent = decodeHtmlEntities(ticket.subject);
                document.getElementById('modal-ticket-id').textContent = decodeHtmlEntities(ticket.ticketId);
                document.getElementById('modal-submitter').textContent = `${decodeHtmlEntities(ticket.userName)} (${decodeHtmlEntities(ticket.userEmail)})`;
                document.getElementById('modal-date').textContent = formatDate(ticket.createdAt);
                document.getElementById('modal-status').textContent = formatStatus(ticket.status);
                document.getElementById('modal-priority').textContent = capitalizeFirstLetter(ticket.priority);
                document.getElementById('modal-category').textContent = capitalizeFirstLetter(ticket.category);
                document.getElementById('modal-description').textContent = decodeHtmlEntities(ticket.description);
                
                // Set current values in dropdowns
                document.getElementById('status-change').value = ticket.status;
                document.getElementById('priority-change').value = ticket.priority;
                
                // Store ticket ID for updates
                document.getElementById('update-status').dataset.ticketId = ticketId;
                document.getElementById('update-priority').dataset.ticketId = ticketId;
                document.getElementById('add-note').dataset.ticketId = ticketId;
                document.getElementById('delete-ticket').dataset.ticketId = ticketId;
                
                // Display attachments
                const attachmentsList = document.querySelector('#modal-attachments .attachments-list');
                attachmentsList.innerHTML = '';
                
                if (ticket.attachments && ticket.attachments.length > 0) {
                    ticket.attachments.forEach(attachment => {
                        const attachmentEl = document.createElement('div');
                        attachmentEl.className = 'attachment-item';
                        attachmentEl.innerHTML = `
                            <a href="${escapeHtml(attachment.file_path)}" target="_blank" download="${escapeHtml(attachment.file_name)}">
                                <i class="fas fa-paperclip"></i> ${decodeHtmlEntities(attachment.file_name)}
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
                                <strong>${decodeHtmlEntities(note.admin_name)}</strong>
                                <span>${formatDate(note.created_at)}</span>
                            </div>
                            <div class="note-text">${decodeHtmlEntities(note.note_text)}</div>
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

// Update ticket status
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
            document.getElementById('modal-status').textContent = formatStatus(status);
        } else {
            showAlert('error', data.message || 'Failed to update status');
        }
    })
    .catch(error => {
        showAlert('error', 'An error occurred while updating status');
        console.error('Error:', error);
    });
});

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
            loadAdminTickets();
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

// Add note to ticket
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

// Delete ticket
document.getElementById('delete-ticket')?.addEventListener('click', function() {
    const ticketId = this.dataset.ticketId;
    
    if (confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
        fetch('ticket-handler.php?action=delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `ticket_id=${ticketId}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('success', 'Ticket deleted successfully');
                document.getElementById('ticket-modal').style.display = 'none';
                loadAdminTickets();
                loadTicketStats();
            } else {
                showAlert('error', data.message || 'Failed to delete ticket');
            }
        })
        .catch(error => {
            showAlert('error', 'An error occurred while deleting ticket');
            console.error('Error:', error);
        });
    }
});

function deleteTicket(ticketId) {
    fetch('ticket-handler.php?action=delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `ticket_id=${ticketId}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('success', 'Ticket deleted successfully');
            loadAdminTickets();
            loadTicketStats();
        } else {
            showAlert('error', data.message || 'Failed to delete ticket');
        }
    })
    .catch(error => {
        showAlert('error', 'An error occurred while deleting ticket');
        console.error('Error:', error);
    });
}

// Helper functions
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

function decodeHtmlEntities(text) {
    if (!text) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
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