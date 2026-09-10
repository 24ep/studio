export type UploadQueueItemRouteContext = {
  params: Promise<{ id: string }>;
};

export type UploadQueuePatchBuildResult =
  | {
      ok: true;
      fields: string[];
      values: unknown[];
    }
  | {
      ok: false;
      invalidFields: string[];
    };
