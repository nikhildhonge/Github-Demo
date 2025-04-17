const scriptUrl = 'https://script.google.com/macros/s/AKfycbz2Dcq28o3NEUTnDBklm0QuTMONwUqIXAuOt0_v9NnmjctfAeS0YutIl9gsIV8ZwJtm/exec';
let expenses = [];

// Initialize Bootstrap components
document.addEventListener('DOMContentLoaded', function () {
    hideLoader();
    // Initialize modal
    const expenseModal = new bootstrap.Modal(document.getElementById('expense-modal'));

    // Toggle sidebar on mobile
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const mainContent = document.getElementById('mainContent');

    sidebarToggle.addEventListener('click', function () {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('sidebar-open');
        if (sidebar.classList.contains('active')) {
            sidebarBackdrop.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } else {
            sidebarBackdrop.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    sidebarBackdrop.addEventListener('click', function () {
        sidebar.classList.remove('active');
        mainContent.classList.remove('sidebar-open');
        sidebarBackdrop.style.display = 'none';
        document.body.style.overflow = '';
    });

    // Show modal for adding new receipt
    document.getElementById('btn-add-receipt').addEventListener('click', function () {
        document.getElementById('edit-expense-id').value = '';
        expenseModal.show();
    });

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
      new bootstrap.Tooltip(tooltipTriggerEl)
    })

    // Set active sidebar link based on current page
    setActiveSidebarLink();

    loadExpenses();

});



function setActiveSidebarLink() {
    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop();

    // Remove active class from all links
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    // Add active class to current page link
    switch (currentPage) {
        case 'index.html':
            document.getElementById('dashboard-link').classList.add('active');
            break;
        case 'members.html':
            document.getElementById('members-link').classList.add('active');
            break;
        case 'receipt.html':
            document.getElementById('receipt-link').classList.add('active');
            break;
        case 'expense.html':
            document.getElementById('expense-link').classList.add('active');
            break;
        default:
            // If none match, you might want to handle this case
            break;
    }
}

document.getElementById('btn-cancel').addEventListener('click', function (e) {    
    e.preventDefault();
    const expenseModal = bootstrap.Modal.getInstance(document.getElementById('expense-modal'));
    expenseModal.hide();
    resetInputs();
})

document.getElementById('btn-save').addEventListener('click', async function (e) {
    e.preventDefault();
    showLoader();

    const expenseId = document.getElementById('edit-expense-id').value;

    if (validateReceiptForm()) {
        if(expenseId) {
            await updateExpense();
        } else {
            await createExpense();
        }        
        resetInputs();
        await loadExpenses();
        const expenseModal = bootstrap.Modal.getInstance(document.getElementById('expense-modal'));
        expenseModal.hide();
    } else {
        hideLoader();
    }
})

async function loadExpenses() {
    showLoader();
    fetch(scriptUrl + '?sheet=Expenses')
        .then(response => response.json())
        .then(data => {
            if (data.records && data.records.length >= 1) {
                expenses = data.records;
                const sortedRecords = sortRecords(expenses, currentSort.field, currentSort.direction);
                renderTable(sortedRecords);
            }
            hideLoader();
        })
        .catch(error => {
            hideLoader();
            alert('Failed to load data. Please try again later.');
        });
}

function renderTable(records) {
    const tableBody = document.getElementById('members-tbody');
    tableBody.innerHTML = '';

    const isMobile = window.innerWidth <= 768;

    records.forEach((record, index) => {
        const id = `#${String(index + 1).padStart(3, '0')}`;
        const recordId = record.expense_id || index;
        const memberId = record.member_id || '';
        const memberName = record.member_name || '';
        const expenseAmount = record.expense_amount || '';
        const expenseDate = new Date(record.expense_date) || '';
        const expenseNote = record.expense_note || '';
        const createdDate = new Date(record.created_date) || '';

        if (isMobile) {
            const mobileCard = document.createElement('tr');
            const expenseDateFormatted = formatDate(expenseDate);
            const createdDateFormatted = formatDate(createdDate);
            
            mobileCard.innerHTML = `
                <td colspan="100%">
                    <div class="mobile-card">
                        <!-- Expense Header -->
                        <div class="card-header">
                            <span class="card-id">
                                <i class="fas fa-receipt"></i> Expense No:- ${recordId}
                            </span>
                        </div>
            
                        <!-- Expense Info -->
                        <div class="card-field">
                            <div class="card-field-left">
                                <i class="far fa-calendar-alt"></i>
                                <span class='card-cust-label'>Expense Date:</span>
                            </div>
                            <div class="card-field-right">${expenseDateFormatted}</div>
                        </div>
            
                        <div class="card-field highlight">
                            <div class="card-field-left">
                                <i class="fas fa-rupee-sign"></i>
                                <span class='card-cust-label'>Amount:</span>
                            </div>
                            <div class="card-field-right">₹${expenseAmount}</div>
                        </div>
            
                        <div class="card-field">
                            <div class="card-field-left">
                                <i class="fas fa-user"></i>
                                <span class='card-cust-label'>Expense By:</span>
                            </div>
                            <div class="card-field-right">${memberName}</div>
                        </div>
            
                        <div class="card-field">
                            <div class="card-field-left">
                                <i class="fas fa-sticky-note"></i>
                                <span class='card-cust-label'>Note:</span>
                            </div>
                            <div class="card-field-right">${expenseNote || '—'}</div>
                        </div>
            
                        <!-- Action Buttons -->
                        <div class="card-actions">
                            <button class="btn view-btn" data-id="${recordId}" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn edit-btn" data-id="${recordId}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn delete-btn" data-id="${recordId}" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </td>
            `;
            tableBody.appendChild(mobileCard);
        } else {
            // Desktop row remains the same
            const row = document.createElement('tr');
            row.innerHTML = `
        <td>${formatDate(expenseDate)}</td>
        <td>₹${expenseAmount}</td>
        <td>${memberName}</td>
        <td>${expenseNote}</td>
         <td>${formatDate(createdDate)}</td>
        <td class="text-end">
            <div class="d-flex justify-content-end gap-2">
              <button class="action-btn view-btn" title="View" data-id="${recordId}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" title="Edit" data-id="${recordId}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete" data-id="${recordId}">
                    <i class="fas fa-trash"></i>
                </button>              
            </div>
        </td>
    `;
            tableBody.appendChild(row);
        }
    });

    addActionListeners();
}

function addActionListeners() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const expenseId = e.currentTarget.getAttribute('data-id');
            editRecord(parseInt(expenseId), 'view');
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const expenseId = e.currentTarget.getAttribute('data-id');
            editRecord(parseInt(expenseId), 'edit');
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const expenseId = e.currentTarget.getAttribute('data-id');
            const isConfirmed = confirm("Are you sure you want to delete this record?");
            if (isConfirmed) {
                deleteRecord(parseInt(expenseId));
            }
        });
    });
}

async function deleteRecord(expenseId) {
    showLoader();
    const expenseData = {
        action: 'deleteexpense',
        expense_id: expenseId        
    };

    try {
        const response = await fetch(scriptUrl + '?sheet=Expenses', {
            method: 'POST',
            body: JSON.stringify(expenseData),
            mode: "no-cors",
            headers: {
                'Content-Type': 'application/json'
            }
        });
        resetInputs();
        await loadExpenses();
    } catch (error) {
        hideLoader();
        console.error('Error saving receipt:', error);
    }
}

function editRecord(expenseId, action) {
    removeDisabledAttribute();
    const expense = expenses.find(record => record.expense_id === expenseId);
    if(expense) {
        document.getElementById('edit-expense-id').value = expense.expense_id;
        document.getElementById('expense-date').value = new Date(expense.expense_date).toISOString().split('T')[0];
        document.getElementById('expense-member-name').value = expense.member_name;
        document.getElementById('expense-member-id').value = expense.member_id;
        document.getElementById('expense-amount').value = expense.expense_amount;
        document.getElementById('expense-note').value = expense.expense_note;

        if(action === 'view') {
            disableModalInputs();
        }

        const expenseModal = new bootstrap.Modal(document.getElementById('expense-modal'));
        expenseModal.show();
    }
}

function removeDisabledAttribute() {
    document.getElementById('expense-date').removeAttribute('disabled');
    document.getElementById('expense-member-name').removeAttribute('disabled');
    document.getElementById('expense-amount').removeAttribute('disabled');
    document.getElementById('expense-note').removeAttribute('disabled');
    document.getElementById('btn-save').removeAttribute('disabled');
}

function disableModalInputs() {
    document.getElementById('expense-date').setAttribute('disabled', true);
    document.getElementById('expense-member-name').setAttribute('disabled', true);
    document.getElementById('expense-amount').setAttribute('disabled', true);
    document.getElementById('expense-note').setAttribute('disabled', true);
    document.getElementById('btn-save').setAttribute('disabled', true);
}

function formatDate(dateInput) {
    const date = new Date(dateInput);   
    return date.toLocaleDateString("en-IN");
}

async function createExpense() {
    showLoader();
    const originalDate = new Date();
    const year = originalDate.getFullYear();
    const month = String(originalDate.getMonth() + 1).padStart(2, '0');
    const day = String(originalDate.getDate()).padStart(2, '0');
    const dateString2 = `${year}-${month}-${day}`;
    const expenseData = {
        action: 'createexpense',
        expense_id: generateExpenseId(),
        member_id: parseInt(document.getElementById('expense-member-id').value) || 0,
        member_name: String(document.getElementById('expense-member-name').value).trim(),
        expense_amount: parseFloat(parseFloat(document.getElementById('expense-amount').value).toFixed(2)),
        expense_date: document.getElementById('expense-date').value,
        expense_note: String(document.getElementById('expense-note').value).trim(),
        created_date: dateString2
    };

    try {
        const response = await fetch(scriptUrl + '?sheet=Expenses', {
            method: 'POST',
            body: JSON.stringify(expenseData),
            mode: "no-cors",
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        hideLoader();
        console.error('Error saving receipt:', error);
    }
}

async function updateExpense() {
    showLoader();

    const originalDate = new Date();
    const year = originalDate.getFullYear();
    const month = String(originalDate.getMonth() + 1).padStart(2, '0');
    const day = String(originalDate.getDate()).padStart(2, '0');
    const updatedDate = `${year}-${month}-${day}`;

    const expenseId = document.getElementById('edit-expense-id').value;

    if(expenseId) {
        const expenseData = {
            action: 'updateexpense',
            expense_id: expenseId,
            member_id: parseInt(document.getElementById('expense-member-id').value) || 0,
            member_name: String(document.getElementById('expense-member-name').value).trim(),
            expense_amount: parseFloat(parseFloat(document.getElementById('expense-amount').value).toFixed(2)),
            expense_date: document.getElementById('expense-date').value,
            expense_note: String(document.getElementById('expense-note').value).trim(),
            updated_date: updatedDate
        };
    
        try {
            const response = await fetch(scriptUrl + '?sheet=Expenses', {
                method: 'POST',
                body: JSON.stringify(expenseData),
                mode: "no-cors",
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            hideLoader();
            console.error('Error saving receipt:', error);
        }
    }else {

    }    
}


function validateReceiptForm() {
    const expenseDateinput = document.getElementById('expense-date');
    const memberNameInput = document.getElementById('expense-member-name');
    const memberIdInput = document.getElementById('expense-member-id');
    const expectedAmountInput = document.getElementById('expense-amount');
    const expenseNoteInput = document.getElementById('expense-note');

    // Reset all custom validity messages
    expenseDateinput.setCustomValidity('');
    memberNameInput.setCustomValidity('');
    memberIdInput.setCustomValidity('');
    expectedAmountInput.setCustomValidity('');
    expenseNoteInput.setCustomValidity('');

    if (!expenseDateinput.value) {
        expenseDateinput.setCustomValidity('Please select a date');
        expenseDateinput.reportValidity();
        return false;
    }

    const today = new Date();
    const todayDate = today.toISOString().split('T')[0]; //
    const expenseDate = new Date(expenseDateinput.value).toISOString().split('T')[0]; // e.g., "2025-04-16"

    if (expenseDate > todayDate) {  // Future dates are invalid
        expenseDateinput.setCustomValidity('Expense date cannot be in the future');
        expenseDateinput.reportValidity();
        return false;
    } 

    // Validate expected amount
    if (!expectedAmountInput.value.trim()) {
        expectedAmountInput.setCustomValidity('Expected amount is required');
        expectedAmountInput.reportValidity();
        return false;
    }

    const expectedAmount = parseFloat(expectedAmountInput.value);
    if (isNaN(expectedAmount)) {
        expectedAmountInput.setCustomValidity('Please enter a valid number');
        expectedAmountInput.reportValidity();
        return false;
    }

    if (expectedAmount < 0) {
        expectedAmountInput.setCustomValidity('Expected amount cannot be negative');
        expectedAmountInput.reportValidity();
        return false;
    }

     // Validate member name is selected (and member ID is set)
     if (!memberNameInput.value.trim()) {
        memberNameInput.setCustomValidity('Please select a member');
        memberNameInput.reportValidity();
        return false;
    }

    if (!expenseNoteInput.value.trim()) {
        expenseNoteInput.setCustomValidity('Please add note for expense');
        expenseNoteInput.reportValidity();
        return false;
    }

    return true;
}

function resetInputs() {
    document.getElementById('expense-date').value = '';
    document.getElementById('expense-member-name').value = '';
    document.getElementById('expense-member-id').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-note').value = '';
    hideLoader();
}

// Show loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}
// Hide loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

function generateExpenseId() {
    const randomPart = Math.floor(100000000 + Math.random() * 900000000); // 9-digit random
    const timestampPart = Date.now() % 10; // Last digit of timestamp
    const memberId = parseInt(`${randomPart}${timestampPart}`); // Combine and convert to number
    return memberId; // Returns a number (e.g., 1234567895)
}

// Add this at the beginning of your script section
let currentSort = {
    field: 'cdate',
    direction: 'desc'
};

// Add this after your renderTable function
function sortRecords(records, field, direction) {
    return [...records].sort((a, b) => {
        let valueA, valueB;

        switch (field) {
            case 'name':
                valueA = a.member_name?.toLowerCase() || '';
                valueB = b.member_name?.toLowerCase() || '';
                break;
            case 'date':
                valueA = a.expense_date;
                valueB = b.expense_date;
                break;
            case 'amount':
                valueA = parseFloat(a.expense_amount) || 0;
                valueB = parseFloat(b.expense_amount) || 0;
                break;
            case 'note':
                valueA = a.expense_note?.toLowerCase() || '';
                valueB = b.expense_note?.toLowerCase() || '';
                break;
            case 'cdate':
            default:
                valueA = a.created_date || 0;
                valueB = b.created_date || 0;
                break;
        }

        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function handleSort(field) {
    // If clicking the same field, toggle direction
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // New field, default to ascending
        currentSort.field = field;
        currentSort.direction = 'asc';
    }

    // Update UI
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('active', 'asc', 'desc');
        if (header.getAttribute('data-sort') === field) {
            header.classList.add('active', currentSort.direction);
        }
    });

    // Sort and re-render
    const sortedRecords = sortRecords(expenses, currentSort.field, currentSort.direction);
    renderTable(sortedRecords);
}

// Add this to your DOMContentLoaded event listener
document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', () => {
        const field = header.getAttribute('data-sort');
        handleSort(field);
    });
});

const expenseMemberNameInput = document.getElementById('expense-member-name');
const datalist = document.getElementById('members-list');
let debounceTimer;

function debounce(func, delay) {
    return function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(func, delay);
    };
}

async function searchMembers(searchTerm) {
    if (searchTerm.length < 2) return;

    showLoader();
    try {
        fetch(scriptUrl + '?sheet=sheet2&search=' + searchTerm)
            .then(response => response.json())
            .then(data => {
                if (data.records && data.records.length > 0) {
                    datalist.innerHTML = '';
                    data.records.forEach(record => {
                        const option = document.createElement('option');
                        option.value = record.fullname;
                        option.setAttribute('data-id', record.memberid);
                        datalist.appendChild(option);
                    });
                } else {
                    alert('Members not found with this name!');
                }
                hideLoader();
            })
            .catch(error => {
                console.error('Error loading data:', error);
                hideLoader();
            });
    } catch (error) {
        console.error('Error fetching members:', error);
        hideLoader();
    }
}

expenseMemberNameInput.addEventListener('input', debounce(async function () {
    await searchMembers(expenseMemberNameInput.value.trim());
}, 300));

expenseMemberNameInput.addEventListener('change', async function () {
    const selectedName = this.value;
    const selectedOption = Array.from(datalist.options).find(opt => opt.value === selectedName);
    if (selectedOption) {
        document.getElementById('expense-member-id').value = selectedOption.getAttribute('data-id');
    }
});