const BASE_URL = 'https://mattruedlinger.github.io/scripts-triple-r-marketing';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchUserData") {
    const apiKey = request.apiKey;
    const cacheBuster = `?t=${Date.now()}`;
    const url = `${BASE_URL}/users/${apiKey}.json${cacheBuster}`;

    fetch(url, { cache: 'no-store' })
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('INVALID_API_KEY');
          }
          throw new Error(`HTTP error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!data.enabled) {
          sendResponse({ success: false, error: 'ACCOUNT_DISABLED' });
        } else {
          sendResponse({ success: true, data: data });
        }
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === "fetchFAQsForRoles") {
    const roles = request.roles;
    const cacheBuster = `?t=${Date.now()}`;
    const isAdmin = roles.includes('admin');

    // Function to fetch FAQs for a list of roles
    const fetchFAQsForRoleList = (rolesToFetch) => {
      const uniqueRoles = [...new Set(rolesToFetch)];
      const fetchPromises = uniqueRoles.map(role => {
        const url = `${BASE_URL}/faqs/${role}.json${cacheBuster}`;
        return fetch(url, { cache: 'no-store' })
          .then(response => {
            if (!response.ok) {
              return [];
            }
            return response.json();
          })
          .catch(() => []);
      });

      return Promise.all(fetchPromises).then(results => results.flat());
    };

    // If user is admin, fetch all roles first, then get all FAQs
    if (isAdmin) {
      const rolesUrl = `${BASE_URL}/roles.json${cacheBuster}`;
      fetch(rolesUrl, { cache: 'no-store' })
        .then(response => response.ok ? response.json() : [])
        .then(allRoles => {
          const allRoleIds = allRoles.map(r => r.id);
          return fetchFAQsForRoleList(allRoleIds);
        })
        .then(allFAQs => {
          sendResponse({ success: true, data: allFAQs });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
    } else {
      // Non-admin: fetch only user's roles (always include general)
      const rolesToFetch = ['general', ...roles.filter(r => r !== 'general')];
      fetchFAQsForRoleList(rolesToFetch)
        .then(allFAQs => {
          sendResponse({ success: true, data: allFAQs });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
    }
    return true;
  }
});
