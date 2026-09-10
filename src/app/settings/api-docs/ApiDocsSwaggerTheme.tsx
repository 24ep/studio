export function ApiDocsSwaggerTheme() {
  return (
    <style jsx global>{`
      .swagger-ui {
        font-family: var(--font-family-primary) !important;
      }
      
      .swagger-ui .servers {
        background: hsl(var(--card)) !important;
        border: 1px solid hsl(var(--border)) !important;
        border-radius: var(--radius) !important;
      }
      
      .swagger-ui .servers .servers-title,
      .swagger-ui .servers .servers-title label,
      .swagger-ui .info .title,
      .swagger-ui .opblock .opblock-section-header h4,
      .swagger-ui .opblock .opblock-section-header label,
      .swagger-ui .parameter__name,
      .swagger-ui .response-col_description__inner p {
        color: hsl(var(--foreground)) !important;
      }
      
      .swagger-ui .servers select,
      .swagger-ui .topbar .download-url-wrapper input,
      .swagger-ui .auth-container input,
      .swagger-ui .opblock .opblock-section-header input,
      .swagger-ui .opblock .opblock-section-header select,
      .swagger-ui .opblock .opblock-section-header textarea {
        background: hsl(var(--popover)) !important;
        color: hsl(var(--popover-foreground)) !important;
        border: 1px solid hsl(var(--border)) !important;
        border-radius: var(--radius) !important;
      }
      
      .swagger-ui .servers select:focus {
        border-color: hsl(var(--ring)) !important;
        box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2) !important;
      }
      
      .swagger-ui .topbar {
        background: hsl(var(--card)) !important;
        border-bottom: 1px solid hsl(var(--border)) !important;
      }
      
      .swagger-ui .info,
      .swagger-ui .scheme-container,
      .swagger-ui .auth-container,
      .swagger-ui .opblock,
      .swagger-ui .opblock .opblock-summary {
        background: hsl(var(--card)) !important;
      }
      
      .swagger-ui .scheme-container,
      .swagger-ui .auth-container,
      .swagger-ui .opblock {
        border: 1px solid hsl(var(--border)) !important;
      }
      
      .swagger-ui .info,
      .swagger-ui .info .description,
      .swagger-ui .opblock .opblock-summary-description,
      .swagger-ui .response-col_links,
      .swagger-ui .model,
      .swagger-ui .model .property.primitive,
      .swagger-ui .parameter__type {
        color: hsl(var(--muted-foreground)) !important;
      }
      
      .swagger-ui .opblock .opblock-section-header,
      .swagger-ui .model,
      .swagger-ui .highlight-code,
      .swagger-ui .highlight-code .microlight,
      .swagger-ui .response-col_description__inner code {
        background: hsl(var(--muted)) !important;
      }
      
      .swagger-ui .opblock .opblock-section-header {
        border-bottom: 1px solid hsl(var(--border)) !important;
      }
      
      .swagger-ui .btn,
      .swagger-ui .btn.execute {
        background: hsl(var(--primary)) !important;
        color: hsl(var(--primary-foreground)) !important;
        border: 1px solid hsl(var(--primary)) !important;
        border-radius: var(--radius) !important;
      }
      
      .swagger-ui .btn:hover,
      .swagger-ui .btn.execute:hover {
        background: hsl(var(--primary) / 0.9) !important;
      }
      
      .swagger-ui .response-col_status,
      .swagger-ui .model .property {
        color: hsl(var(--foreground)) !important;
      }
      
      .swagger-ui .parameter__deprecated {
        color: hsl(var(--destructive)) !important;
      }
      
      .swagger-ui .highlight-code .microlight,
      .swagger-ui .response-col_description__inner code {
        color: hsl(var(--muted-foreground)) !important;
      }
      
      .dark .swagger-ui .servers,
      .dark .swagger-ui .topbar,
      .dark .swagger-ui .info,
      .dark .swagger-ui .opblock,
      .dark .swagger-ui .opblock .opblock-summary {
        background: hsl(var(--card)) !important;
      }
      
      .dark .swagger-ui .servers select {
        background: hsl(var(--popover)) !important;
        color: hsl(var(--popover-foreground)) !important;
      }
      
      .dark .swagger-ui .opblock .opblock-section-header {
        background: hsl(var(--muted)) !important;
      }
      
      .tag-filter-container {
        position: relative;
      }
      
      .tag-filter-container [data-radix-popper-content-wrapper] {
        z-index: 50 !important;
      }
      
      .tag-filter-container .select-trigger {
        background: hsl(var(--background)) !important;
        color: hsl(var(--foreground)) !important;
        border-color: hsl(var(--input)) !important;
      }
      
      .tag-filter-container .select-trigger:hover {
        background: hsl(var(--accent)) !important;
        color: hsl(var(--accent-foreground)) !important;
      }
      
      .tag-filter-container .select-trigger:focus {
        border-color: hsl(var(--ring)) !important;
        box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2) !important;
      }
      
      .tag-filter-container .select-content {
        background: hsl(var(--popover)) !important;
        border-color: hsl(var(--border)) !important;
      }
      
      .tag-filter-container .select-item {
        color: hsl(var(--popover-foreground)) !important;
      }
      
      .tag-filter-container .select-item:hover {
        background: hsl(var(--accent)) !important;
        color: hsl(var(--accent-foreground)) !important;
      }
      
      .tag-filter-container .select-item[data-state="checked"] {
        background: hsl(var(--primary)) !important;
        color: hsl(var(--primary-foreground)) !important;
      }
    `}</style>
  );
}
