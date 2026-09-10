export function getSelectedApplicantsDescription(count: number, action: 'status' | 'recruiter') {
  const applicantLabel = `selected Applicant${count !== 1 ? 's' : ''}`;
  return action === 'status'
    ? `Change the status for ${count} ${applicantLabel}.`
    : `Assign a recruiter to ${count} ${applicantLabel}.`;
}

export function getSelectedApplicantIds(selectedApplicantIds: Set<string>) {
  return Array.from(selectedApplicantIds);
}
