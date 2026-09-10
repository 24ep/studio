# System Prompts (AI Tuning)

## The Story of AI Personalization

| Feature | Description |
| :--- | :--- |
| **What** | A configuration interface for fine-tuning the instructions and personality of the Google Gemini AI integration. |
| **Who** | **Prompt Engineers** and **System Administrators**. |
| **When** | When the AI is consistently over-scoring or under-scoring applicants for a specific department. |
| **Why** | To allow non-technical staff to adjust the "logic" of the AI without writing a single line of code. |
| **Where** | **Settings > System Prompts**. |
| **How** | 1. Go to **Settings > System Prompts** <br> 2. Select a category (e.g., "Evaluation") <br> 3. Locate the **"System Instruction"** block <br> 4. Modify the text to be more strict or lenient <br> 5. Click **"Save & Deploy"** to update all active AI agents |

## 1. Using Variables
You can inject dynamic data into your prompts by using double curly braces:
- `{{applicant_name}}`: Replaced by the name on the resume.
- `{{position_title}}`: Replaced by the job title the AI is matching against.

> [!TIP]
> Always include a few "Examples" in your system prompt to show the AI exactly what a "Good Match" looks like for your organization.

## 2. How to Verify (Test Case)
To test prompt dynamic variables:
1.  **Navigate**: Create an "Evaluation" prompt that starts with: "Identify if {{applicant_name}} is good for {{position_title}}".
2.  **Act**: Go to a applicant profile and click **"Generative AI"**.
3.  **Confirm**: Select your new prompt and click **"Generate"**. The AI response should correctly name the applicant and the job title in its analysis.
