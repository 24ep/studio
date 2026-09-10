export type HeadcountAttachmentsRouteContext = {
  params: Promise<{ id: string }>;
};

export type HeadcountAttachmentSessionUser = {
  id: string;
};

export type ParsedHeadcountAttachmentUpload = {
  file: File;
  label: string;
};
