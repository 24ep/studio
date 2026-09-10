export const DEFAULT_JOB_DESCRIPTION_PROMPT = `Generate a professional job description for a \${positionLevel || 'professional'} \${title} position in the \${department} department.

Please include:
1. Job Summary
2. Key Responsibilities (5-8 bullet points)
3. Required Qualifications
4. Preferred Qualifications
5. Key Competencies

Format the response in HTML with h2 and h3 headings and bullet points (ul, li). Make it professional and comprehensive.

Return ONLY the HTML-formatted job description without any additional text or explanations.`;

export const DEFAULT_APPLICANT_EVALUATION_PROMPT = `Evaluate the Applicant against the position requirements using the configured expertise skills, personality traits, interviewer scores, and written feedback.

Please consider:
1. Evidence from the Applicant's resume and parsed profile
2. Alignment with the position's evaluation criteria
3. Consistency across interviewer ratings
4. Strengths, risks, and follow-up questions
5. A concise hiring recommendation

Use practical recruiting language. Be fair, specific, and evidence-based. Avoid unsupported assumptions.

Return a structured evaluation summary with clear sections for strengths, concerns, score rationale, and recommendation.`;
