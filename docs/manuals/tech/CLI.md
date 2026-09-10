# CLI Tools & Scripts

## The Story of Maintenance Scripts

| Feature | Description |
| :--- | :--- |
| **What** | A collection of terminal-based utilities for bulk data repair, system seeding, and infrastructure migration. |
| **Who** | **DevOps Engineers** and **Backend Developers**. |
| **When** | During system upgrades, emergency data fixes, or when setting up a fresh development environment. |
| **Why** | To perform high-risk or high-volume operations with safety and logging that the UI cannot provide. |
| **Where** | Located in the project's `/scripts` directory. |
| **How** | 1. Open Terminal <br> 2. Navigate to project root <br> 3. Run script (e.g., `node scripts/fix-applicant-status-uuid.js`) <br> 4. Review terminal output for success/error counts <br> 5. Verify data changes in the UI |

## 1. Safety Procedures
- **Create Backups**: Always trigger a manual database snapshot before running repair scripts.
- **Dry Runs**: Many scripts support a `--dry-run` flag to simulate changes without actually writing to the database.

> [!CAUTION]
> CLI scripts bypass the standard Role-Based Access Control logic of the application. Only run these on production after thorough testing in a staging environment.

## 2. How to Verify (Test Case)
To verify a script:
1.  **Navigate**: Open your terminal in the project root.
2.  **Act**: Run `node scripts/check-system-health.js` (or similar informational script).
3.  **Confirm**: Ensure the script completes with a "Success" message and does not encounter any database connection errors.
