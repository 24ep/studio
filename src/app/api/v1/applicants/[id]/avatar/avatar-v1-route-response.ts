export function buildAvatarV1UploadResponse({
  applicantId,
  applicantName,
  avatarUrl,
}: {
  applicantId: string;
  applicantName: string;
  avatarUrl: string;
}) {
  return {
    message: 'Avatar uploaded successfully',
    avatar_url: avatarUrl,
    applicant: {
      id: applicantId,
      name: applicantName,
      avatarUrl,
    },
  };
}
