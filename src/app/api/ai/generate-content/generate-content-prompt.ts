export function buildDetailedGenerateContentPrompt(applicantContext: unknown, systemPrompt: string) {
  return `
Applicant CONTEXT:
${JSON.stringify(applicantContext, null, 2)}

SYSTEM PROMPT:
${systemPrompt}

Please generate professional, well-formatted content based on the system prompt above, using all the comprehensive Applicant and job data provided. 

IMPORTANT: Pay special attention to the Applicant's education and experience data, as these are crucial for understanding their qualifications and background. Consider:

- Education history, degrees, institutions, and graduation dates
- Work experience, job titles, companies, responsibilities, and duration
- Skills and competencies demonstrated through their experience
- How their education and experience align with the position requirements
- Career progression and growth patterns
- Parsed data from resumes and documents
- Assignment justification and reasoning
- Custom attributes and additional Applicant information
- Resume file path and uploaded attachments
- Detailed transition history and stage progression
- All comments and feedback from recruiters and team members
- Job matching scores and criteria

POSITION AND OPPORTUNITY ANALYSIS:
- The Applicant's applied position and its specific requirements, including detailed match criteria
- All potential job matches with fit scores and match reasons
- Top 3 highest-scoring position matches (fit score > 70%)
- Alternative career opportunities and growth paths
- How the Applicant's profile aligns with different positions and departments
- Recommendations for position transitions or career development
- Analysis of the Applicant's fit across multiple positions and career trajectories
- Insights into the Applicant's potential for different roles and responsibilities
- Strategic recommendations for career advancement opportunities

MATCH CRITERIA AND JOB DESCRIPTION ANALYSIS:
- Detailed analysis of the applied position's match criteria and requirements
- Comparison of Applicant qualifications against specific position criteria
- Analysis of job descriptions and how they align with Applicant experience
- Evaluation of match criteria across different positions and departments
- Identification of skill gaps and areas for development
- Assessment of how well the Applicant meets each position's specific requirements
- Recommendations based on match criteria alignment and job description fit
- Strategic insights into the Applicant's suitability for different role types

Also consider the Applicant's background, position requirements, matching scores, comments, transition history, and all available context to provide the most relevant and insightful analysis.

Format the response in HTML with appropriate headings (h2, h3) and bullet points (ul, li) where appropriate. Make it comprehensive and professional.

Return ONLY the HTML-formatted content without any additional text or explanations.`;
}

export function cleanGeneratedHtml(content: string) {
  return content
    .replace(/```html\s*/gi, '')
    .replace(/```\s*$/gi, '')
    .trim();
}
