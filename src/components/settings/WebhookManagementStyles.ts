export const WEBHOOK_SCROLLBAR_STYLES = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgb(203 213 225);
    border-radius: 3px;
    transition: background 0.2s ease;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgb(148 163 184);
  }
  .custom-scrollbar.dark::-webkit-scrollbar-thumb {
    background: rgb(71 85 105);
  }
  .custom-scrollbar.dark::-webkit-scrollbar-thumb:hover {
    background: rgb(100 116 139);
  }
`;
