// Path: design-prototype/app.js
// Purpose: Tab switching, context-aware search placeholders, theme toggling, and layout toggles.

document.addEventListener('DOMContentLoaded', () => {
    // --- Context-Aware Search Logic ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabViews = document.querySelectorAll('.tab-view');
    const searchInput = document.getElementById('global-search');

    // Placeholders for each view
    const searchPlaceholders = {
        'dashboard-view': 'Search all pipelines...',
        'storage-view': 'Search files, folders, departments...',
        'tenders-view': 'Search tenders, clients, compliance...',
        'invoices-view': 'Search invoices, quotes, clients...',
        'projects-view': 'Search projects, tasks, milestones...',
        'tasks-view': 'Search tasks, assignees, tags...'
    };

    // --- Tab Switching Logic ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all nav items and tabs
            navItems.forEach(nav => nav.classList.remove('active'));
            tabViews.forEach(tab => tab.classList.remove('active'));

            // Add active class to clicked nav item
            item.classList.add('active');

            // Show the corresponding tab view
            const targetId = item.getAttribute('data-tab');
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.add('active');
            }

            // Update Search Placeholder
            if (searchPlaceholders[targetId]) {
                searchInput.placeholder = searchPlaceholders[targetId];
            }
        });
    });

    // --- Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    const moonPath = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>';
    const sunPath = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>';

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        
        // Swap icon based on mode
        if (document.body.classList.contains('light-mode')) {
            themeIcon.innerHTML = sunPath;
        } else {
            themeIcon.innerHTML = moonPath;
        }
    });

    // --- Help Menu Logic ---
    const helpBtn = document.getElementById('help-btn');
    const helpDropdown = document.getElementById('help-dropdown');

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent closing immediately
        helpDropdown.classList.toggle('show');
    });

    // Close help menu if clicked outside
    document.addEventListener('click', (e) => {
        if (!helpDropdown.contains(e.target) && e.target !== helpBtn) {
            helpDropdown.classList.remove('show');
        }
    });

    // --- Storage Layout Toggle (Grid / List) ---
    const layoutToggleBtn = document.getElementById('layout-toggle');
    const storageContainers = document.querySelectorAll('.storage-files');

    layoutToggleBtn.addEventListener('click', () => {
        let isList = storageContainers[0].classList.contains('grid-view');
        
        storageContainers.forEach(container => {
            if (isList) {
                container.classList.remove('grid-view');
                container.classList.add('list-view');
            } else {
                container.classList.remove('list-view');
                container.classList.add('grid-view');
            }
        });

        layoutToggleBtn.textContent = isList ? 'Switch to Grid View' : 'Switch to List View';
    });
});