const BASE_URL = 'https://MattRuedlinger.github.io/scripts';

document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const status = document.getElementById('status');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  const userRoles = document.getElementById('userRoles');
  const keyStatus = document.getElementById('keyStatus');

  let hasExistingKey = false;

  // Check if API key exists (don't show it)
  chrome.storage.local.get(['apiKey'], function(result) {
    if (result.apiKey) {
      hasExistingKey = true;
      apiKeyInput.placeholder = '••••••••-••••-••••-••••-••••••••••••';
      keyStatus.textContent = 'An API key is already saved. Enter a new key to replace it.';
      keyStatus.classList.remove('hidden');
    }
  });

  // Save API key
  saveBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      if (hasExistingKey) {
        showStatus('No changes made. Your existing API key is still saved.', 'info');
      } else {
        showStatus('Please enter an API key.', 'error');
      }
      return;
    }

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(apiKey)) {
      showStatus('Invalid API key format. Please enter a valid UUID.', 'error');
      return;
    }

    chrome.storage.local.set({ apiKey: apiKey }, function() {
      if (chrome.runtime.lastError) {
        showStatus('Failed to save API key: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus('API key saved successfully!', 'success');
        hasExistingKey = true;
        apiKeyInput.value = '';
        apiKeyInput.placeholder = '••••••••-••••-••••-••••-••••••••••••';
        keyStatus.textContent = 'An API key is already saved. Enter a new key to replace it.';
        keyStatus.classList.remove('hidden');
        userInfo.classList.add('hidden');
      }
    });
  });

  // Test connection
  testBtn.addEventListener('click', function() {
    // Use entered key if provided, otherwise use saved key
    const enteredKey = apiKeyInput.value.trim();

    if (enteredKey) {
      // Test the newly entered key
      testApiKey(enteredKey);
    } else if (hasExistingKey) {
      // Test the saved key
      chrome.storage.local.get(['apiKey'], function(result) {
        if (result.apiKey) {
          testApiKey(result.apiKey);
        } else {
          showStatus('No API key found. Please enter one.', 'error');
        }
      });
    } else {
      showStatus('Please enter an API key first.', 'error');
    }
  });

  function testApiKey(apiKey) {
    showStatus('Testing connection...', 'info');
    userInfo.classList.add('hidden');

    const cacheBuster = `?t=${Date.now()}`;
    const url = `${BASE_URL}/users/${apiKey}.json${cacheBuster}`;

    fetch(url, { cache: 'no-store' })
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Invalid API key. User not found.');
          }
          throw new Error(`HTTP error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!data.enabled) {
          showStatus('This account has been disabled. Contact your administrator.', 'error');
          return;
        }

        showStatus('Connection successful! API key is valid.', 'success');
        userName.textContent = `${data.firstName} ${data.lastName}`;
        userRoles.textContent = data.roles.join(', ');
        userInfo.classList.remove('hidden');
      })
      .catch(error => {
        showStatus(error.message, 'error');
      });
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;
  }
});
