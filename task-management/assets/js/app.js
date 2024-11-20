// API Base URL - adjust this to match your Django backend URL
const API_BASE_URL = 'http://localhost:8000/api';

// Register Form Handler
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            console.log('Sending registration data:', userData);
            const response = await fetch(`${API_BASE_URL}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            console.log('Registration response:', data);

            if (response.ok) {
                alert('Registration successful! Please login.');
                window.location.href = 'index.html';
            } else {
                const errorMessage = data.error || data.message || Object.values(data)[0]?.[0] || 'Registration failed';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Registration failed. Please try again.');
        }
    });
}

// Login Form Handler
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const loginData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            console.log('Sending login data:', loginData);
            const response = await fetch(`${API_BASE_URL}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                localStorage.setItem('user', JSON.stringify({
                    token: data.token,
                    user: data.user
                }));
                window.location.href = 'dashboard.html';
            } else {
                const errorMessage = data.message || data.error || 'Login failed';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Login failed. Please try again.');
        }
    });
}

// Dashboard Protection
if (window.location.href.includes('dashboard.html')) {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) return;

    const status = document.getElementById('statusFilter')?.value || 'all';
    const priority = document.getElementById('priorityFilter')?.value || 'all';
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;

    try {
        let url = `${API_BASE_URL}/tasks/?status=${status}&priority=${priority}`;
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const tasks = await response.json();
            updateDashboardStats(tasks);
            populateTaskTable(tasks);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update dashboard statistics
function updateDashboardStats(tasks) {
    if (!tasks) return;
    
    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('completedTasks').textContent = 
        tasks.filter(task => task.status === 'completed').length;
    document.getElementById('inProgressTasks').textContent = 
        tasks.filter(task => task.status === 'in-progress').length;
}

// Populate task table
function populateTaskTable(tasks) {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        taskList.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${task.title}</td>
                <td>${task.status}</td>
                <td>${task.priority}</td>
                <td>${task.deadline}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editTask(${task.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

// Load dashboard data when on dashboard page
if (window.location.href.includes('dashboard.html')) {
    loadDashboardData();
}

// Task Form Handler
if (document.getElementById('taskForm')) {
    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            window.location.href = 'index.html';
            return;
        }

        const taskData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            status: document.getElementById('status').value,
            priority: document.getElementById('priority').value,
            deadline: document.getElementById('deadline').value
        };

        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get('id');
        const isEditing = !!taskId;

        try {
            const url = isEditing ? `${API_BASE_URL}/tasks/${taskId}/` : `${API_BASE_URL}/tasks/`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify(taskData)
            });

            const data = await response.json();
            console.log('Response:', response);
            console.log('Response data:', data);

            if (response.ok) {
                alert(isEditing ? 'Task updated successfully!' : 'Task created successfully!');
                window.location.href = 'dashboard.html';
            } else {
                const errorMessage = data.error || data.detail || 'Failed to save task';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to save task. Please try again.');
        }
    });
}

// Add event listeners for filters
if (document.getElementById('statusFilter')) {
    document.getElementById('statusFilter').addEventListener('change', loadDashboardData);
}
if (document.getElementById('priorityFilter')) {
    document.getElementById('priorityFilter').addEventListener('change', loadDashboardData);
}
if (document.getElementById('startDate')) {
    document.getElementById('startDate').addEventListener('change', loadDashboardData);
}
if (document.getElementById('endDate')) {
    document.getElementById('endDate').addEventListener('change', loadDashboardData);
}

// Add these functions for editing and deleting tasks
async function editTask(taskId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) return;

    // Redirect to task detail page with task ID
    window.location.href = `task-detail.html?id=${taskId}`;
}

async function deleteTask(taskId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) return;

    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (response.ok) {
            alert('Task deleted successfully!');
            loadDashboardData(); // Refresh the task list
        } else {
            alert('Failed to delete task. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete task. Please try again.');
    }
}

// Add this to your existing app.js file or create a new one

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Get all form values
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        password: document.getElementById('password').value
    };

    try {
        // Validate form data
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.dateOfBirth) {
            alert('Please fill in all required fields');
            return;
        }

        // Validate phone number format (10 digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(formData.phone)) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }

        // Get existing users from localStorage or initialize empty array
        let users = JSON.parse(localStorage.getItem('users')) || [];

        // Check if email already exists
        if (users.some(user => user.email === formData.email)) {
            alert('Email already registered');
            return;
        }

        // Add new user to array
        users.push(formData);

        // Save updated users array to localStorage
        localStorage.setItem('users', JSON.stringify(users));

        // Optional: Save to your backend database
        // const response = await fetch('your-backend-api/register', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(formData)
        // });

        // if (!response.ok) {
        //     throw new Error('Registration failed');
        // }

        alert('Registration successful!');
        window.location.href = 'index.html'; // Redirect to login page

    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
});

// Add password strength checker
document.getElementById('password').addEventListener('input', function(e) {
    const password = e.target.value;
    const strengthDiv = document.getElementById('passwordStrength');
    let strength = 0;
    let message = '';

    // Check password length
    if (password.length >= 8) strength += 1;
    // Check for numbers
    if (/\d/.test(password)) strength += 1;
    // Check for lowercase letters
    if (/[a-z]/.test(password)) strength += 1;
    // Check for uppercase letters
    if (/[A-Z]/.test(password)) strength += 1;
    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    switch (strength) {
        case 0:
        case 1:
            message = '<span style="color: #e74c3c;">Weak</span>';
            break;
        case 2:
        case 3:
            message = '<span style="color: #f39c12;">Medium</span>';
            break;
        case 4:
        case 5:
            message = '<span style="color: #27ae60;">Strong</span>';
            break;
    }

    strengthDiv.innerHTML = message;
});

// Confirm password validation
document.getElementById('confirmPassword').addEventListener('input', function(e) {
    const password = document.getElementById('password').value;
    const confirmPassword = e.target.value;
    
    if (password !== confirmPassword) {
        e.target.setCustomValidity("Passwords don't match");
    } else {
        e.target.setCustomValidity('');
    }
});
