export function getV1ApplicantImportTemplate() {
  return {
    applicants: [
      {
        name: 'Sample Applicant',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        status: 'Applied',
        positionId: null,
        recruiterId: null,
        fitScore: 85,
        custom_attributes: {},
        parsedData: null,
        resumePath: null,
      },
    ],
  };
}
