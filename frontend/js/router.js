// MailGuard AI - Client-Side SPA Router

const Router = {
  routes: {
    'dashboard': window.DashboardPage,
    'analyze': window.AnalyzePage,
    'history': window.HistoryPage,
    'performance': window.PerformancePage,
    'settings': window.SettingsPage
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  handleRoute() {
    let hash = window.location.hash.replace('#/', '').replace('#', '');
    if (!hash || !this.routes[hash]) {
      hash = 'dashboard';
      window.location.hash = '#/dashboard';
    }

    // Update active state in sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-route') === hash);
    });

    // Update breadcrumbs
    const pageName = hash.charAt(0).toUpperCase() + hash.slice(1);
    const breadcrumbEl = document.getElementById('breadcrumb-current');
    if (breadcrumbEl) breadcrumbEl.textContent = pageName;

    // Render Page View
    const pageController = this.routes[hash];
    const container = document.getElementById('page-content-area');
    if (container && pageController) {
      container.innerHTML = pageController.render();
      if (typeof pageController.init === 'function') {
        pageController.init();
      }
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }
};

window.Router = Router;
