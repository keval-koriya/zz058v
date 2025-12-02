# Realtime Channels Data Fetcher

This project contains a GitHub Actions workflow to automatically fetch realtime channel data from an API and sync it to Firebase Firestore.

## Overview

- **Schedule**: Runs every 15 minutes
- **Manual Trigger**: Available via workflow_dispatch
- **Mode**: Insert/Update based on channel ID (using Firestore's merge)
- **Script**: `sync-channels.js` handles fetching and pushing data

## Project Structure

```
├── .github/workflows/
│   └── sync-channels.yml    # GitHub Actions workflow
├── sync-channels.js          # Main sync script
└── README.md
```

## Configuration Guide

### Step 1: Configure API Variables

Go to your repository **Settings** → **Secrets and variables** → **Actions** → **Variables** tab.

Add the following **Repository Variables**:

| Variable Name | Description |
|---------------|-------------|
| `VAR_API_URL` | The API endpoint URL to fetch channels |
| `VAR_REFERER` | The referer URL for the API request |
| `VAR_API_TOKEN` | The API Bearer token for authentication |

### Step 2: Configure Firebase Variables

Go to your repository **Settings** → **Secrets and variables** → **Actions** → **Variables** tab.

Add the following **Repository Variables**:

| Variable Name | Description |
|---------------|-------------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`) |
| `FIREBASE_DATABASE_URL` | Your Firebase database URL (e.g., `https://your-project.firebaseio.com`) |

### Step 3: Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the **gear icon** (⚙️) next to "Project Overview" in the left sidebar
4. Select **Project settings**
5. Click on the **Service accounts** tab at the top
6. Make sure **Firebase Admin SDK** is selected
7. Click the **Generate new private key** button at the bottom
8. Click **Generate key** in the confirmation dialog
9. A JSON file will be downloaded to your computer

10. Open the downloaded JSON file and copy these values to GitHub **Variables**:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",        ← Copy to FIREBASE_PROJECT_ID
  "private_key": "-----BEGIN PRIVATE...", ← Copy to FIREBASE_PRIVATE_KEY (entire key including BEGIN/END)
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com", ← Copy to FIREBASE_CLIENT_EMAIL
  ...
}
```

> **Important**: When copying `private_key`, include the entire value with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. Copy it exactly as-is from the JSON file (with the `\n` characters).

### Step 4: Enable Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose your preferred location
4. Start in **production mode** or **test mode** (update rules later for security)

## Firestore Collection

- **Collection**: `channels`
- **Document ID**: Channel's unique ID from API
- **Fields**: All fields from API response (excluding `lastUploadedVideos`) plus:
  - `lastUpdated`: Timestamp of last update
  - `fetchedAt`: ISO string of when the data was processed

## Manual Execution

You can manually trigger the workflow:

1. Go to **Actions** tab in your repository
2. Select **Sync Realtime Channels**
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## Local Development

You can run the sync script locally:

```bash
# Install dependencies
npm install firebase-admin

# Set environment variables
export VAR_API_URL="your-api-url"
export VAR_REFERER="your-referer"
export VAR_API_TOKEN="your-token"
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_CLIENT_EMAIL="your-client-email"
export FIREBASE_PRIVATE_KEY="your-private-key"
export FIREBASE_DATABASE_URL="your-database-url"

# Run the script
node sync-channels.js
```

## Troubleshooting

### Common Issues

1. **API fetch fails**: Check that `VAR_API_URL`, `VAR_REFERER`, and `VAR_API_TOKEN` are correctly configured
2. **Firebase push fails**: Verify all Firebase variables are correctly set, especially the private key format
3. **Permission denied**: Ensure your Firebase service account has write permissions to Firestore
