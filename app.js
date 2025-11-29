document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const views = {
        dashboard: document.getElementById('dashboard-view'),
        history: document.getElementById('history-view'),
        analytics: document.getElementById('analytics-view'),
        settings: document.getElementById('settings-view')
    };
    const navLinks = document.querySelectorAll('.sidebar-link');
    const pageTitle = document.getElementById('pageTitle');
    const userDisplayName = document.getElementById('userDisplayName');

    // Upload & Post Elements
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const platformCards = document.querySelectorAll('.platform-card');
    const postBtn = document.getElementById('postBtn');
    const dashboardHistoryList = document.getElementById('dashboardHistoryList');
    const fullHistoryList = document.getElementById('fullHistoryList');
    const toast = document.getElementById('toast');

    // Settings Elements
    const settingName = document.getElementById('settingName');
    const settingEmail = document.getElementById('settingEmail');
    const settingPlatform = document.getElementById('settingPlatform');
    const settingAutoSave = document.getElementById('settingAutoSave');
    const settingNotifications = document.getElementById('settingNotifications');
    const settingPrivacy = document.getElementById('settingPrivacy');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    // Analytics Elements
    const statReach = document.getElementById('statReach');
    const statEngagement = document.getElementById('statEngagement');
    const analyticsChart = document.getElementById('analyticsChart');

    // History Search
    const historySearch = document.getElementById('historySearch');

    // --- State ---
    let selectedFiles = [];
    let selectedPlatforms = new Set();
    let postHistory = JSON.parse(localStorage.getItem('cpp_history')) || [];
    let userSettings = JSON.parse(localStorage.getItem('cpp_settings')) || {
        name: 'User',
        email: '',
        defaultPlatform: '',
        autoSave: true,
        notifications: true,
        privacy: 'public'
    };

    // --- Initialization ---
    init();

    function init() {
        // Load Settings
        userDisplayName.innerText = userSettings.name;
        settingName.value = userSettings.name;
        settingEmail.value = userSettings.email || '';
        settingPlatform.value = userSettings.defaultPlatform;
        settingAutoSave.checked = userSettings.autoSave !== false;
        settingNotifications.checked = userSettings.notifications !== false;
        settingPrivacy.value = userSettings.privacy || 'public';

        // Auto-select default platform
        if (userSettings.defaultPlatform) {
            const card = document.querySelector(`.platform-card[data-platform="${userSettings.defaultPlatform}"]`);
            if (card) {
                card.classList.add('selected');
                selectedPlatforms.add(userSettings.defaultPlatform);
            }
        }

        // Render History
        renderHistory();

        // Load Analytics
        loadAnalytics();

        // Setup History Search
        if (historySearch) {
            historySearch.addEventListener('input', (e) => filterHistory(e.target.value));
        }

        // Check disconnected platforms
        checkPlatformConnections();
    }

    // --- Navigation Logic ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.dataset.view;
            if (!targetView) return;

            // Update Active Link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Update View
            Object.values(views).forEach(view => view.classList.remove('active'));
            views[targetView].classList.add('active');

            // Update Title
            pageTitle.innerText = link.innerText.trim();
        });
    });

    // --- Upload Logic ---
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
        if (files.length > 0) {
            selectedFiles = Array.from(files);
            updateFileList();
        }
    }

    function updateFileList() {
        if (selectedFiles.length === 0) {
            fileList.style.display = 'none';
            return;
        }
        fileList.style.display = 'block';
        fileList.innerHTML = selectedFiles.map(file => `
            <div style="display: flex; align-items: center; gap: 1rem; background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <i class="fa-solid ${file.type.startsWith('video') ? 'fa-video' : 'fa-image'}" style="color: var(--text-secondary);"></i>
                <div style="flex: 1; overflow: hidden;">
                    <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); font-size: 0.9rem;">${file.name}</p>
                    <p style="font-size: 0.75rem;">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button class="btn-outline" style="border: none; padding: 0.25rem;" onclick="removeFile('${file.name}')">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `).join('');
    }

    window.removeFile = (fileName) => {
        selectedFiles = selectedFiles.filter(f => f.name !== fileName);
        updateFileList();
    };

    // --- Platform Selection ---
    platformCards.forEach(card => {
        card.addEventListener('click', () => {
            const platform = card.dataset.platform;
            const isConnected = card.dataset.connected === 'true';

            if (!isConnected) {
                showToast('Please connect this platform first!');
                return;
            }

            if (selectedPlatforms.has(platform)) {
                selectedPlatforms.delete(platform);
                card.classList.remove('selected');
            } else {
                selectedPlatforms.add(platform);
                card.classList.add('selected');
            }
        });
    });

    // --- Post Logic ---
    postBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) { alert('Please select a file.'); return; }
        if (selectedPlatforms.size === 0) { alert('Please select a platform.'); return; }

        const originalText = postBtn.innerHTML;
        postBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Posting...';
        postBtn.disabled = true;

        await new Promise(resolve => setTimeout(resolve, 1500));

        // Save to History
        const newPost = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            platforms: Array.from(selectedPlatforms),
            files: selectedFiles.map(f => f.name)
        };
        postHistory.unshift(newPost);
        localStorage.setItem('cpp_history', JSON.stringify(postHistory));
        renderHistory();

        showToast('Content posted successfully!');

        // Reset
        postBtn.innerHTML = originalText;
        postBtn.disabled = false;
        selectedFiles = [];
        selectedPlatforms.clear();
        updateFileList();
        platformCards.forEach(c => c.classList.remove('selected'));

        // Restore default platform if set
        if (userSettings.defaultPlatform) {
            const card = document.querySelector(`.platform-card[data-platform="${userSettings.defaultPlatform}"]`);
            if (card) {
                card.classList.add('selected');
                selectedPlatforms.add(userSettings.defaultPlatform);
            }
        }
    });

    // --- History Logic ---
    function renderHistory() {
        const renderItem = (post) => `
            <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 0.5rem; border-left: 3px solid var(--success); margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-weight: 600; color: var(--text-primary);">Post #${post.id.toString().slice(-4)}</span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">${post.date}</span>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${post.platforms.map(p => `<span style="font-size: 0.75rem; background: rgba(99, 102, 241, 0.2); color: var(--accent-primary); padding: 0.1rem 0.5rem; border-radius: 1rem; text-transform: capitalize;">${p}</span>`).join('')}
                </div>
            </div>
        `;

        if (postHistory.length === 0) {
            dashboardHistoryList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;"><p>No recent posts</p></div>';
            fullHistoryList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;"><p>No history found</p></div>';
        } else {
            // Dashboard shows last 3
            dashboardHistoryList.innerHTML = postHistory.slice(0, 3).map(renderItem).join('');
            // Full history shows all
            fullHistoryList.innerHTML = postHistory.map(renderItem).join('');
        }
    }

    window.clearHistory = () => {
        if (confirm('Are you sure you want to clear all history?')) {
            postHistory = [];
            localStorage.removeItem('cpp_history');
            renderHistory();
            showToast('History cleared.');
        }
    };

    // --- Settings Logic ---
    saveSettingsBtn.addEventListener('click', () => {
        userSettings = {
            name: settingName.value || 'User',
            email: settingEmail.value || '',
            defaultPlatform: settingPlatform.value,
            autoSave: settingAutoSave.checked,
            notifications: settingNotifications.checked,
            privacy: settingPrivacy.value
        };
        localStorage.setItem('cpp_settings', JSON.stringify(userSettings));
        userDisplayName.innerText = userSettings.name;
        showToast('Settings saved.');
    });

    // --- Analytics Logic ---
    async function loadAnalytics() {
        try {
            const response = await fetch('data/analytics.json');
            const data = await response.json();

            statReach.innerText = data.total_reach.toLocaleString();
            statEngagement.innerText = data.engagement_rate;

            // Render Chart
            const maxVal = Math.max(...data.weekly_stats);
            analyticsChart.innerHTML = data.weekly_stats.map((val, index) => `
                <div class="bar" style="height: ${(val / maxVal) * 100}%">
                    <span>Day ${index + 1}</span>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading analytics:', error);
            statReach.innerText = 'Error';
        }
    }

    // --- Utilities ---
    function showToast(msg) {
        toast.querySelector('p').innerText = msg;
        toast.style.transform = 'translateY(0)';
        setTimeout(() => { toast.style.transform = 'translateY(150%)'; }, 3000);
    }

    // History Export
    window.exportHistory = () => {
        if (postHistory.length === 0) {
            alert('No history to export.');
            return;
        }
        const dataStr = JSON.stringify(postHistory, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `crosspost-history-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('History exported!');
    };

    // History Filter
    function filterHistory(query) {
        const filtered = query
            ? postHistory.filter(post =>
                post.platforms.some(p => p.toLowerCase().includes(query.toLowerCase())) ||
                post.date.toLowerCase().includes(query.toLowerCase())
            )
            : postHistory;

        const renderItem = (post) => `
            <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 0.5rem; border-left: 3px solid var(--success); margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-weight: 600; color: var(--text-primary);">Post #${post.id.toString().slice(-4)}</span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">${post.date}</span>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${post.platforms.map(p => `<span style="font-size: 0.75rem; background: rgba(99, 102, 241, 0.2); color: var(--accent-primary); padding: 0.1rem 0.5rem; border-radius: 1rem; text-transform: capitalize;">${p}</span>`).join('')}
                </div>
            </div>
        `;

        if (filtered.length === 0) {
            fullHistoryList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;"><p>No matching history found</p></div>';
        } else {
            fullHistoryList.innerHTML = filtered.map(renderItem).join('');
        }
    }

    // Platform Connection Check
    function checkPlatformConnections() {
        platformCards.forEach(card => {
            const isConnected = card.dataset.connected === 'true';
            if (!isConnected) {
                card.style.opacity = '0.5';
                card.style.cursor = 'not-allowed';
            }
        });
    }
});

