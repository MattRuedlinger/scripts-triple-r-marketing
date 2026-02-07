# FAQ System

A role-based FAQ/canned email reply system with Chrome extension and GitHub Pages hosting.

## Structure

```
faq-system/
├── users/                    # User configuration files (API keys)
│   └── {uuid}.json          # Each user has their own file
├── faqs/                     # FAQ files organized by role
│   ├── general.json         # FAQs visible to all authenticated users
│   └── {role}.json          # Role-specific FAQs
├── roles.json               # Role definitions
├── index.html               # Landing page for unauthorized access
└── Triple R Ambassador Program/ # Chrome extension source
```

## Setup

### 1. Enable GitHub Pages

1. Go to your repository settings
2. Navigate to Pages
3. Set source to "Deploy from a branch"
4. Select the `main` branch and `/ (root)` folder
5. Save

Your site will be available at: `https://weblytica-llc.github.io/faq-system/`

### 2. Install the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `Triple R Ambassador Program` folder
5. The extension will appear in your toolbar

### 3. Configure a User

Users need an API key (UUID) to access the system. See the management section below.

## Managing the System

Use Claude Code with prompts like "faq" or "FAQ" to access the management menu:

1. Add a new FAQ
2. Edit an existing FAQ
3. Delete an existing FAQ
4. Add a User (Get an API Key)
5. Edit a User's access or role(s)
6. Disable a user's access
7. Create a new user role

## Data Formats

### User File (`users/{uuid}.json`)

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "roles": ["support", "sales"],
  "enabled": true
}
```

### FAQ File (`faqs/{role}.json`)

```json
[
  {
    "Title": "Reply Name",
    "Category": "Category Name",
    "Subject Line": "Email subject line",
    "Content": "<p>HTML formatted email body</p>"
  }
]
```

### Roles File (`roles.json`)

```json
[
  {
    "id": "general",
    "name": "General",
    "description": "FAQs visible to all authenticated users"
  },
  {
    "id": "support",
    "name": "Support",
    "description": "Customer support team FAQs"
  }
]
```

## Security

This system uses security through obscurity:
- API keys are UUIDs that serve as filenames
- Without knowing the exact UUID, users cannot access the data
- Disabled users (`"enabled": false`) are blocked even with valid keys

This provides reasonable protection against casual access by former employees but is not suitable for highly sensitive data.
