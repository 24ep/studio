# API Documentation

## The Story of Technical Connectivity

| Feature | Description |
| :--- | :--- |
| **What** | An interactive developer portal for exploring and testing the platform's REST API. |
| **Who** | **System Integrators**, **Backend Developers**, and **IT Personnel**. |
| **When** | During the initial integration phase or when building custom data automation scripts. |
| **Why** | To provide a "Sandboxed" environment for validating API calls without affecting production data. |
| **Where** | Found under **Settings > API Documentation**. |
| **How** | 1. Go to **Settings > API Documentation** <br> 2. Click **"Authorize"** <br> 3. Enter your `sk_live_...` key <br> 4. Select an endpoint (e.g., `GET /applicants`) <br> 5. Click **"Try it out"** and view JSON response |

## 1. Interactive Testing (Swagger UI)
The documentation page functions as a live HTTP client.
1.  **Authorize**: Click the green **Authorize** button at the top right.
    *   Value: `Bearer sk_live_...` (your API key).
2.  **Select Endpoint**: Click to expand a path (e.g., `GET /v1/applicants`).
3.  **Execute**:
    *   Click **"Try it out"**.
    *   Edit parameters if needed.
    *   Click **"Execute"**.
4.  **Result**: View the "Response Body" and "Response Code" directly below.

> [!TIP]
> Use the **"Download JSON Spec"** button to import the HRI API definitions into tools like Postman or Insomnia.

## 2. How to Verify (Test Case)
To verify the API portal:
1.  **Navigate**: Go to **"Settings > API Documentation"**.
2.  **Act**: Locate the `GET /health` endpoint and click **"Try it out"**, then **"Execute"**.
3.  **Confirm**: Ensure you receive a `200 OK` response with a JSON body indicating `status: "healthy"`.
