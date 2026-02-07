# Claude Code Instructions

This file contains instructions for Claude Code when working on this repository.

## Trigger Keywords

**Read this file when the user mentions any combination of:**
- "manage" + "scripts", "faqs", "faq", "users", "roles"
- "add script", "create script", "new script"
- "add user", "create user", "new user"
- "show users", "list users"
- "show scripts", "list scripts"

## General

- When the user provides new directives or preferences, ask if they should be saved to this file for future sessions.

## Script Formatting

- All script content must use HTML formatting, not markdown
- Allowed HTML tags:
  - `<p>` for paragraphs
  - `<strong>` for bold
  - `<em>` for italics
  - `<ol>` and `<ul>` with `<li>` for lists
- Use `<p>` instead of `<br>` for line breaks (including when user does shift+return)

## Adding Scripts

When asking the user for script details, request:
- **Title**
- **Category**
- **Subject Line**
- **Content**
- **Role** (which role's FAQ file this script belongs to)

If the user specifies a role that doesn't exist, confirm with them before creating the new role.

## Adding Roles

**IMPORTANT:** When creating a new role, you must **always** do both of these steps:
1. Add the role entry to `roles.json` (id, name, description)
2. Create the corresponding `faqs/{role-id}.json` file (initialize as `[]` if empty)

The Chrome extension relies on `roles.json` to know which FAQ files to fetch for admin users. If a role has a FAQ file in `faqs/` but is missing from `roles.json`, admin users will **not** be able to see those scripts.

## User Tables

When displaying users in a table, include these columns in order:
1. **#** - Row number
2. **Name** - First and last name
3. **API Key** - The user's UUID
4. **Roles** - Comma-separated list of roles
5. **Admin** - Yes/No based on whether user has admin role
6. **Enabled** - Yes/No

## Roles

- Admin users have access to scripts from all roles
- Non-admin users only see scripts for their assigned roles
- The "general" role is typically assigned to all users

## Repository Structure

- `users/` - User JSON files (filename is the API key UUID)
- `faqs/` - Script JSON files organized by role (e.g., `general.json`, `admin.json`)
- `roles.json` - List of available roles
- `Triple R Ambassador Program/` - Chrome extension source code

---

# Initial Setup for New Repositories

Follow these steps to set up this script management system in a new repository.

## 1. Create Directory Structure

```
your-repo/
├── CLAUDE.md              # Copy this file
├── roles.json             # Role definitions
├── users/                 # User API key files
│   └── {uuid}.json
├── faqs/                  # Scripts organized by role
│   └── general.json
└── Triple R Ambassador Program/
    ├── manifest.json
    ├── background.js
    ├── popup.html
    ├── popup.js
    ├── popup.css
    ├── options.html
    ├── options.js
    ├── options.css
    └── icons...
```

## 2. Create roles.json

```json
[
  {
    "id": "general",
    "name": "General",
    "description": "FAQs visible to all authenticated users"
  },
  {
    "id": "admin",
    "name": "Admin",
    "description": "Administrators with access to all scripts"
  }
]
```

## 3. Create Initial FAQ Files

Create `faqs/general.json`:
```json
[]
```

Create `faqs/admin.json`:
```json
[]
```

## 4. Create First Admin User

Create `users/{generated-uuid}.json`:
```json
{
  "firstName": "Admin",
  "lastName": "User",
  "roles": ["general", "admin"],
  "enabled": true
}
```

Generate UUID using: `python3 -c "import uuid; print(uuid.uuid4())"`

## 5. Update Chrome Extension

In `background.js`, update the BASE_URL:
```javascript
const BASE_URL = 'https://{your-github-username}.github.io/{repo-name}';
```

In `options.js`, update the BASE_URL:
```javascript
const BASE_URL = 'https://{your-github-username}.github.io/{repo-name}';
```

## 6. Enable GitHub Pages

1. Go to repository Settings > Pages
2. Set Source to "Deploy from a branch"
3. Select `main` branch and `/ (root)` folder
4. Save

## 7. Update Extension Branding (Optional)

- Replace logo images in the extension folder
- Update `manifest.json` with your extension name and description
- Update logo URL in `options.html`

## 8. Load Extension in Chrome

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `Triple R Ambassador Program` folder

## Key Features

- **API Key Authentication**: Users authenticate with UUID-based API keys
- **Role-Based Access**: Users only see scripts for their assigned roles
- **Admin Override**: Admin users can see all scripts from all roles
- **Hidden API Keys**: API keys are treated like passwords (not displayed after saving)
- **GitHub Pages Hosting**: Data served via GitHub Pages (free hosting)
- **Claude Code Management**: Manage users, scripts, and roles via natural language
