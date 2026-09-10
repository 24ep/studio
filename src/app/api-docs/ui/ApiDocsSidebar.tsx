interface ApiDocsSidebarProps {
  selectedTag: string;
  tags: string[];
  onSelectTag: (tag: string) => void;
}

export function ApiDocsSidebar({ onSelectTag, selectedTag, tags }: ApiDocsSidebarProps) {
  return (
    <div className="lg:w-64 flex-shrink-0">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm dark:shadow-none">
        <h3 className="mb-4 text-lg font-semibold text-card-foreground">API Categories</h3>
        <div className="space-y-2">
          <ApiDocsSidebarButton
            active={selectedTag === 'all'}
            label="All Endpoints"
            onClick={() => onSelectTag('all')}
          />
          {tags.map((tag) => (
            <ApiDocsSidebarButton
              key={tag}
              active={selectedTag === tag}
              label={tag}
              onClick={() => onSelectTag(tag)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiDocsSidebarButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
