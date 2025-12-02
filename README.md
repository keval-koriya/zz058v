# zz058v

This repository includes an automated workflow that fetches API data every minute.

## API Fetch Workflow

The workflow in `.github/workflows/fetch-api.yml`:
- Runs every 1 minute (cron schedule: `* * * * *`)
- Fetches data from a sample API (JSONPlaceholder)
- Commits and pushes the result to the `data/` directory

### Files
- `data/api-result.json` - Contains the fetched API data
- `data/last-fetch.txt` - Contains the timestamp of the last fetch

### Customization
To use your own API, edit `.github/workflows/fetch-api.yml` and replace the URL in the `curl` command with your desired API endpoint.
