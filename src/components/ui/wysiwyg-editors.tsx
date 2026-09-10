"use client";

import dynamic from "next/dynamic";

export type { TiptapEditorProps } from "./tiptap-editor";

const TiptapLoadingFallback = () => (
  <div className="min-h-[100px] rounded-lg border bg-muted/30" />
);

export const TiptapEditor = dynamic(
  () => import("./tiptap-editor").then((module) => module.TiptapEditor),
  {
    ssr: false,
    loading: TiptapLoadingFallback,
  },
) as typeof import("./tiptap-editor").TiptapEditor;

export const TiptapEditorWithExpand = dynamic(
  () => import("./tiptap-editor-with-expand").then((module) => module.TiptapEditorWithExpand),
  {
    ssr: false,
    loading: TiptapLoadingFallback,
  },
) as typeof import("./tiptap-editor-with-expand").TiptapEditorWithExpand;

export const TiptapFullscreenModal = dynamic(
  () => import("./tiptap-fullscreen-modal").then((module) => module.TiptapFullscreenModal),
  {
    ssr: false,
    loading: TiptapLoadingFallback,
  },
) as typeof import("./tiptap-fullscreen-modal").TiptapFullscreenModal;

export default TiptapEditorWithExpand;
