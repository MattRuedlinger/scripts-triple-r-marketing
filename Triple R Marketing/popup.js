let cannedReplies = [];
let selectedCategory = "all";
let currentUser = null;

// Save selected category to chrome.storage.local
function saveCategory(category) {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ selectedCategory: category }, () => {
      if (chrome.runtime.lastError) {
        console.error('Storage save error:', chrome.runtime.lastError);
      }
    });
  }
}

// Load selected category from chrome.storage.local
function loadCategory(callback) {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['selectedCategory'], function(result) {
      if (chrome.runtime.lastError) {
        console.error('Storage load error:', chrome.runtime.lastError);
        callback("all");
      } else {
        callback(result.selectedCategory || "all");
      }
    });
  } else {
    callback("all");
  }
}

function copyToClipboard(text) {
  console.log('ORIGINAL HTML:', text);

  // Clean HTML - preserve only basic formatting
  const cleanHTML = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const allowedTags = ['p', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    console.log('Starting cleanup...');

    // Keep processing until no more unwanted elements remain
    let iterations = 0;
    let changed = true;
    while (changed && iterations < 100) {
      iterations++;
      changed = false;
      const allElements = tempDiv.querySelectorAll('*');

      console.log(`Iteration ${iterations}: Found ${allElements.length} elements`);

      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        if (!el || !el.parentNode) continue; // Skip if already removed

        const tagName = el.tagName.toLowerCase();
        console.log(`Processing: ${tagName}`);

        if (!allowedTags.includes(tagName)) {
          console.log(`Removing: ${tagName}`);

          // For block elements like <p>, <div>, <br>, add line breaks
          if (tagName === 'p' || tagName === 'div' || tagName === 'br') {
            const textNode = document.createTextNode('\n');
            el.parentNode.insertBefore(textNode, el);
          }

          // Replace element with its content
          while (el.firstChild) {
            el.parentNode.insertBefore(el.firstChild, el);
          }
          el.parentNode.removeChild(el);
          changed = true;
          break; // Restart the loop
        } else {
          // Remove all attributes except href for links, and handle paragraph styling
          if (tagName === 'p') {
            // Remove ALL attributes from paragraphs
            const attributes = Array.from(el.attributes);
            attributes.forEach(attr => {
              el.removeAttribute(attr.name);
            });
            // PARAGRAPH STYLING: Add margin and font size to all <p> tags
            el.setAttribute('style', 'margin:12px 0; font-size:16px; background:transparent;');
          } else {
            // For other allowed tags, remove all attributes except href for links
            const attributes = Array.from(el.attributes);
            attributes.forEach(attr => {
              if (!(tagName === 'a' && attr.name === 'href')) {
                el.removeAttribute(attr.name);
              }
            });
          }
        }
      }
    }

    console.log(`Cleanup complete after ${iterations} iterations`);

    // Remove empty paragraphs
    const emptyParagraphs = tempDiv.querySelectorAll('p');
    emptyParagraphs.forEach(p => {
      const content = p.innerHTML.trim();
      if (content === '' || content === '&nbsp;' || content === ' ') {
        p.parentNode.removeChild(p);
      }
    });

    console.log('CLEANED HTML:', tempDiv.innerHTML);

    return tempDiv.innerHTML;
  };

  // Create a temporary div to hold the cleaned HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = cleanHTML(text);
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  document.body.appendChild(tempDiv);

  // Select the content
  const range = document.createRange();
  range.selectNodeContents(tempDiv);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  // Copy with formatting
  try {
    document.execCommand('copy');
    console.log('Copied to clipboard with HTML formatting');

    // Debug: Show what was actually copied
    console.log('Content that was selected and copied:');
    console.log(tempDiv.innerHTML);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }

  // Clean up
  selection.removeAllRanges();
  document.body.removeChild(tempDiv);
}

function getUniqueCategories(data) {
  const categories = new Set();
  data.forEach(item => {
    if (item.Category) categories.add(item.Category);
  });
  return Array.from(categories).sort();
}

function populateCategoryDropdown(categories, selected) {
  const dropdown = document.getElementById('categoryDropdown');
  dropdown.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    if (cat === selected) option.selected = true;
    dropdown.appendChild(option);
  });

  // Hide dropdown if only one category (single role)
  if (categories.length <= 1) {
    dropdown.classList.add('hidden');
  } else {
    dropdown.classList.remove('hidden');
  }

  // Attach the event listener here, after dropdown is populated
  dropdown.onchange = function() {
    selectedCategory = this.value;
    saveCategory(selectedCategory);
    renderReplies(document.getElementById('searchInput').value, selectedCategory);
  };
}

function closeAllAccordions() {
  // Close all open accordions
  document.querySelectorAll('.reply-title').forEach(title => {
    title.classList.add('collapsed');
    const content = title.nextElementSibling;
    content.classList.remove('open');
  });
}

function toggleAccordion(titleElement) {
  const content = titleElement.nextElementSibling;
  const isCollapsed = titleElement.classList.contains('collapsed');

  if (isCollapsed) {
    // Close all other accordions first
    closeAllAccordions();

    // Open this accordion
    titleElement.classList.remove('collapsed');
    content.classList.add('open');
  } else {
    // Close this accordion
    titleElement.classList.add('collapsed');
    content.classList.remove('open');
  }
}

function renderReplies(filter = "", category = "all") {
  const container = document.getElementById('repliesList');
  container.innerHTML = "";

  if (cannedReplies.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#888;">No replies available</div>';
    return;
  }

  let filtered = cannedReplies;

  if (category !== "all") {
    filtered = filtered.filter(item => item.Category === category);
  }

  if (filter.trim() !== "") {
    const search = filter.toLowerCase();
    filtered = filtered.filter(item =>
      item.Title.toLowerCase().includes(search) ||
      item["Subject Line"].toLowerCase().includes(search) ||
      item.Content.toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#888;">No replies match your search</div>';
    return;
  }

  filtered.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'reply-card';

    div.innerHTML = `
      <div class="reply-title collapsed">${item.Title}</div>
      <div class="reply-content">
        <div class="reply-subject"><strong>Subject:</strong> ${item["Subject Line"]}</div>
        <div class="email-body">${item.Content}</div>
        <div class="button-row">
          <button class="copy-btn copy-subject" data-subject="${encodeURIComponent(item["Subject Line"])}">Copy Subject Line</button>
          <button class="copy-btn copy-body" data-body="${encodeURIComponent(item.Content)}">Copy Email Body</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  // Add event listeners for accordion titles
  document.querySelectorAll('.reply-title').forEach(title => {
    title.addEventListener('click', function() {
      toggleAccordion(this);
    });
  });

  // Add event listeners for copy buttons
  document.querySelectorAll('.copy-subject').forEach(btn => {
    btn.addEventListener('click', function() {
      const subject = decodeURIComponent(this.getAttribute('data-subject'));
      copyToClipboard(subject);
    });
  });
  document.querySelectorAll('.copy-body').forEach(btn => {
    btn.addEventListener('click', function() {
      const body = decodeURIComponent(this.getAttribute('data-body'));
      copyToClipboard(body);
    });
  });
}

function hideSearchControls() {
  document.getElementById('categoryDropdown').classList.add('hidden');
  document.getElementById('searchInput').classList.add('hidden');
}

function showSearchControls() {
  document.getElementById('categoryDropdown').classList.remove('hidden');
  document.getElementById('searchInput').classList.remove('hidden');
}

function showError(message, showSettingsLink = false) {
  hideSearchControls();
  const container = document.getElementById('repliesList');
  let html = `<div style="text-align:center;color:#c00;padding:20px;">
    <p>${message}</p>`;
  if (showSettingsLink) {
    html += `<p style="margin-top:15px;"><a href="#" id="openSettings" style="color:#002E5D;">Open Settings</a></p>`;
  }
  html += `</div>`;
  container.innerHTML = html;

  if (showSettingsLink) {
    document.getElementById('openSettings').addEventListener('click', function(e) {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
}

function showLoading() {
  hideSearchControls();
  const container = document.getElementById('repliesList');
  container.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">Loading...</div>';
}

function updateGreeting(user) {
  const greeting = document.getElementById('greeting');
  if (user && user.firstName) {
    greeting.textContent = `Hi ${user.firstName}!`;
  } else {
    greeting.textContent = 'Welcome!';
  }
}

function loadDataAndRender() {
  showLoading();

  // First, get the API key from storage
  chrome.storage.local.get(['apiKey'], function(result) {
    if (chrome.runtime.lastError) {
      showError('Failed to access storage.', true);
      return;
    }

    const apiKey = result.apiKey;
    if (!apiKey) {
      updateGreeting(null);
      showError('No API key configured. Please set up your API key in settings.', true);
      return;
    }

    // Fetch user data to validate API key and get roles
    chrome.runtime.sendMessage(
      { action: "fetchUserData", apiKey: apiKey },
      (response) => {
        if (chrome.runtime.lastError) {
          showError('Failed to connect. Please check your internet connection.', false);
          return;
        }

        if (!response || !response.success) {
          const error = response ? response.error : 'Unknown error';
          if (error === 'INVALID_API_KEY') {
            updateGreeting(null);
            showError('Invalid API key. Please check your settings.', true);
          } else if (error === 'ACCOUNT_DISABLED') {
            updateGreeting(null);
            showError('Your account has been disabled. Contact your administrator.', false);
          } else {
            showError('Failed to authenticate: ' + error, true);
          }
          return;
        }

        currentUser = response.data;
        updateGreeting(currentUser);

        // Now fetch FAQs based on user's roles
        chrome.runtime.sendMessage(
          { action: "fetchFAQsForRoles", roles: currentUser.roles },
          (faqResponse) => {
            if (chrome.runtime.lastError) {
              showError('Failed to load FAQs.', false);
              return;
            }

            if (!faqResponse || !faqResponse.success) {
              showError('Failed to load FAQs.', false);
              return;
            }

            cannedReplies = faqResponse.data;
            const categories = getUniqueCategories(cannedReplies);
            loadCategory(function(savedCategory) {
              selectedCategory = savedCategory;
              populateCategoryDropdown(categories, selectedCategory);
              showSearchControls();
              renderReplies(document.getElementById('searchInput').value, selectedCategory);
            });
          }
        );
      }
    );
  });
}

// Search event listener (this is safe to attach immediately)
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('searchInput').addEventListener('input', function() {
    renderReplies(this.value, document.getElementById('categoryDropdown').value);
  });

  // Load data when popup opens
  loadDataAndRender();
});
