// Constants
const API_BASE_URL = 'http://127.0.0.1:8000/api';  // Make sure this matches your backend URL

document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) {
        window.location.href = 'index.html';
        return;
    }

    // Load initial user data and statistics
    loadInitialUserData();
    loadTaskStatistics();

    // Profile Update Form Handler
    if (document.getElementById('profileForm')) {
        document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    }

    // Password Change Form Handler
    if (document.getElementById('passwordForm')) {
        document.getElementById('passwordForm').addEventListener('submit', handlePasswordChange);
    }
});

function loadInitialUserData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.user) {
        document.getElementById('username').value = user.user.username || '';
        document.getElementById('email').value = user.user.email || '';
    }
}

async function loadTaskStatistics() {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/statistics/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load statistics');
        }

        const data = await response.json();
        updateStatisticsDisplay(data);
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function updateStatisticsDisplay(data) {
    document.getElementById('totalTasks').textContent = data.total || 0;
    document.getElementById('completedTasks').textContent = data.completed || 0;
    document.getElementById('pendingTasks').textContent = data.pending || 0;
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    
    const profileData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/profile/update/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();
        
        if (response.ok) {
            // Update stored user data
            const updatedUser = {
                ...user,
                user: {
                    ...user.user,
                    username: profileData.username,
                    email: profileData.email
                }
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            alert('Profile updated successfully!');
        } else {
            throw new Error(data.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert(error.message || 'Failed to update profile. Please try again.');
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    const passwordData = {
        current_password: document.getElementById('currentPassword').value,
        new_password: newPassword
    };

    try {
        const response = await fetch(`${API_BASE_URL}/profile/change-password/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(passwordData)
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Password changed successfully!');
            document.getElementById('passwordForm').reset();
        } else {
            throw new Error(data.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert(error.message || 'Failed to change password. Please try again.');
    }
}

// Add error handling for fetch calls
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});