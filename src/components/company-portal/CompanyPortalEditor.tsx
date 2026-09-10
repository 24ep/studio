"use client";

import * as React from 'react';
import {
  Bell,
  Copy,
  Database,
  FileText,
  GripVertical,
  Heading1,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Minus,
  MoveDown,
  MoveUp,
  PanelTop,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Table2,
  Type,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ui/image-upload';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  COMPANY_PORTAL_BUTTON_ACTIONS,
  COMPANY_PORTAL_ITEM_CLICK_ACTIONS,
  getCompanyPortalActionField,
} from '@/lib/company-portal-actions';
import {
  createCompanyPortalBlock,
  createCompanyPortalCmsCollection,
  resolveCompanyPortalBlockStyle,
  type CompanyPortalBlock,
  type CompanyPortalBlockStyle,
  type CompanyPortalBlockType,
  type CompanyPortalButtonAction,
  type CompanyPortalCmsCollection,
  type CompanyPortalDocument,
  type CompanyPortalItemClickAction,
  type CompanyPortalPage,
  type CompanyPortalVersion,
} from '@/lib/company-portal-builder';
import type { PolicyDocument } from '@/lib/policy-documents';
import { cn } from '@/lib/utils';
import { CompanyPortalCmsDialog } from './CompanyPortalCmsDialog';
import {
  CompanyPortalRenderer,
  type CompanyPortalRendererVariant,
} from './CompanyPortalRenderer';
import {
  insertItemAt,
  moveItemToInsertionIndex,
} from './company-portal-editor-utils';

type PortalEditorDragSource =
  | { kind: 'library'; blockType: CompanyPortalBlockType }
  | { kind: 'canvas'; blockId: string };

type PortalAsset = {
  name: string;
  size: number;
  updatedAt: string | null;
  url: string;
};

const COMPONENT_LIBRARY: Array<{
  type: CompanyPortalBlockType;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: 'hero', label: 'Hero', category: 'Content', icon: PanelTop },
  { type: 'rich-text', label: 'Text', category: 'Content', icon: Type },
  { type: 'image', label: 'Image', category: 'Content', icon: ImageIcon },
  { type: 'announcement', label: 'Announcement', category: 'Information', icon: Bell },
  { type: 'quick-links', label: 'Quick links', category: 'Navigation', icon: LayoutGrid },
  { type: 'metrics', label: 'Metrics', category: 'Information', icon: Heading1 },
  { type: 'data-list', label: 'List', category: 'Data', icon: List },
  { type: 'data-table', label: 'Table', category: 'Data', icon: Table2 },
  { type: 'data-cards', label: 'Cards', category: 'Data', icon: LayoutGrid },
  { type: 'divider', label: 'Divider', category: 'Layout', icon: Minus },
];

export function CompanyPortalEditor({
  document,
  isDirty,
  isSaving,
  onChange,
  onClose,
  onRestore,
  onSave,
  portalVariant = 'job',
  revision,
  versions,
}: {
  document: CompanyPortalDocument;
  isDirty: boolean;
  isSaving: boolean;
  onChange: (document: CompanyPortalDocument) => void;
  onClose: () => void;
  onRestore: (versionId: string) => void;
  onSave: (note: string) => void;
  portalVariant?: CompanyPortalRendererVariant;
  revision: number;
  versions: CompanyPortalVersion[];
}) {
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(
    document.blocks[0]?.id || null,
  );
  const [selectedPageId, setSelectedPageId] = React.useState<string>('homepage');
  const [dragSource, setDragSource] = React.useState<PortalEditorDragSource | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const [cmsDialogCollection, setCmsDialogCollection] = React.useState<CompanyPortalCmsCollection | null>(null);
  const [isNewCmsCollection, setIsNewCmsCollection] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [policyDocuments, setPolicyDocuments] = React.useState<PolicyDocument[]>([]);
  const [portalAssets, setPortalAssets] = React.useState<PortalAsset[]>([]);
  const portalPages = document.pages;
  const selectedPage = portalPages.find(page => page.id === selectedPageId) || null;
  const activeBlocks = selectedPage?.blocks ?? document.blocks;
  const activePageTitle = selectedPage?.title ?? document.title;
  const selectedBlock = activeBlocks.find(block => block.id === selectedBlockId) || null;
  const selectedButtonActionField = selectedBlock
    ? getCompanyPortalActionField(selectedBlock.buttonAction)
    : null;
  const selectedMetricCollection = selectedBlock?.type === 'metrics'
    ? document.collections.find(collection => collection.id === selectedBlock.dataCollectionId) || null
    : null;
  const selectedDataCollection = selectedBlock && ['data-list', 'data-table', 'data-cards'].includes(selectedBlock.type)
    ? document.collections.find(collection => collection.id === selectedBlock.dataCollectionId) || null
    : null;
  const metricValueFields = selectedMetricCollection?.fields.filter(
    field => field.type === 'number',
  ) || [];
  const metricLabelFields = selectedMetricCollection?.fields.filter(
    field => ['text', 'rich-text', 'date'].includes(field.type),
  ) || [];

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/company-portal/assets', { credentials: 'include', cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Asset listing failed')))
      .then((payload: { assets?: PortalAsset[] }) => {
        if (!cancelled) setPortalAssets(payload.assets || []);
      })
      .catch(() => {
        if (!cancelled) setPortalAssets([]);
      });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    let active = true;
    fetch('/api/policy-documents')
      .then(response => response.ok ? response.json() : { documents: [] })
      .then(data => {
        if (active) {
          setPolicyDocuments(Array.isArray(data.documents) ? data.documents : []);
        }
      })
      .catch(() => {
        if (active) setPolicyDocuments([]);
      });
    return () => { active = false; };
  }, []);

  const openNewCmsCollection = () => {
    setIsNewCmsCollection(true);
    setCmsDialogCollection(createCompanyPortalCmsCollection(crypto.randomUUID()));
  };

  const openCmsCollection = (collection: CompanyPortalCmsCollection) => {
    setIsNewCmsCollection(false);
    setCmsDialogCollection(collection);
  };

  const saveCmsCollection = (collection: CompanyPortalCmsCollection) => {
    const collections = isNewCmsCollection
      ? [...document.collections, collection]
      : document.collections.map(item => item.id === collection.id ? collection : item);
    onChange({ ...document, collections });
    setCmsDialogCollection(null);
    setIsNewCmsCollection(false);
  };

  const addPage = () => {
    const usedSlugs = new Set(portalPages.map(page => page.slug));
    let pageNumber = portalPages.length + 1;
    let slug = `/page-${pageNumber}`;
    while (usedSlugs.has(slug)) {
      pageNumber += 1;
      slug = `/page-${pageNumber}`;
    }

    const page: CompanyPortalPage = {
      id: crypto.randomUUID(),
      title: `New page ${pageNumber}`,
      slug,
      blocks: [],
    };
    onChange({ ...document, pages: [...portalPages, page] });
    setSelectedPageId(page.id);
    setSelectedBlockId(null);
  };

  const removePage = (pageId: string) => {
    onChange({
      ...document,
      pages: portalPages.filter(page => page.id !== pageId),
    });
    if (selectedPageId === pageId) {
      setSelectedPageId('homepage');
      setSelectedBlockId(document.blocks[0]?.id || null);
    }
  };

  const updateActiveBlocks = (blocks: CompanyPortalBlock[]) => {
    if (!selectedPage) {
      onChange({ ...document, blocks });
      return;
    }
    onChange({
      ...document,
      pages: portalPages.map(page => page.id === selectedPage.id ? { ...page, blocks } : page),
    });
  };

  const selectPage = (pageId: string) => {
    const page = portalPages.find(item => item.id === pageId);
    const blocks = page?.blocks ?? document.blocks;
    setSelectedPageId(pageId);
    setSelectedBlockId(blocks[0]?.id || null);
    finishDrag();
  };

  const addBlock = (type: CompanyPortalBlockType) => {
    const block = createCompanyPortalBlock(type, crypto.randomUUID());
    updateActiveBlocks([...activeBlocks, block]);
    setSelectedBlockId(block.id);
  };

  const addBlockAt = (type: CompanyPortalBlockType, insertionIndex: number) => {
    const block = createCompanyPortalBlock(type, crypto.randomUUID());
    onChange({
      ...document,
      ...(selectedPage
        ? { pages: portalPages.map(page => page.id === selectedPage.id
          ? { ...page, blocks: insertItemAt(activeBlocks, block, insertionIndex) }
          : page) }
        : { blocks: insertItemAt(activeBlocks, block, insertionIndex) }),
    });
    setSelectedBlockId(block.id);
  };

  const updateSelectedBlock = (patch: Partial<CompanyPortalBlock>) => {
    if (!selectedBlockId) return;
    onChange({
      ...document,
      ...(selectedPage
        ? { pages: portalPages.map(page => page.id === selectedPage.id
          ? {
            ...page,
            blocks: page.blocks.map(block => (
              block.id === selectedBlockId ? { ...block, ...patch } : block
            )),
          }
          : page) }
        : {
          blocks: document.blocks.map(block => (
            block.id === selectedBlockId ? { ...block, ...patch } : block
          )),
        }),
    });
  };

  const selectMetricCollection = (collectionId: string) => {
    const collection = document.collections.find(item => item.id === collectionId);
    updateSelectedBlock({
      dataCollectionId: collectionId,
      metricValueFieldKey: collection?.fields.find(field => field.type === 'number')?.key || '',
      metricLabelFieldKey: collection?.fields.find(
        field => ['text', 'rich-text', 'date'].includes(field.type),
      )?.key || '',
    });
  };

  const addQuickLink = () => {
    if (!selectedBlock || selectedBlock.type !== 'quick-links' || selectedBlock.links.length >= 12) {
      return;
    }

    updateSelectedBlock({
      links: [...selectedBlock.links, {
        id: crypto.randomUUID(),
        label: 'New link',
        anchor: '#section',
      }],
    });
  };

  const updateQuickLink = (
    linkId: string,
    patch: Partial<CompanyPortalBlock['links'][number]>,
  ) => {
    if (!selectedBlock || selectedBlock.type !== 'quick-links') return;
    updateSelectedBlock({
      links: selectedBlock.links.map(link => (
        link.id === linkId ? { ...link, ...patch } : link
      )),
    });
  };

  const removeQuickLink = (linkId: string) => {
    if (!selectedBlock || selectedBlock.type !== 'quick-links') return;
    updateSelectedBlock({
      links: selectedBlock.links.filter(link => link.id !== linkId),
    });
  };

  const moveBlock = (id: string, offset: number) => {
    const currentIndex = activeBlocks.findIndex(block => block.id === id);
    const nextIndex = currentIndex + offset;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= activeBlocks.length) return;
    const blocks = [...activeBlocks];
    const [block] = blocks.splice(currentIndex, 1);
    blocks.splice(nextIndex, 0, block);
    updateActiveBlocks(blocks);
  };

  const removeBlock = (id: string) => {
    const blocks = activeBlocks.filter(block => block.id !== id);
    updateActiveBlocks(blocks);
    setSelectedBlockId(blocks[0]?.id || null);
  };

  const duplicateBlock = (block: CompanyPortalBlock) => {
    const copy = {
      ...block,
      id: crypto.randomUUID(),
      title: `${block.title} copy`,
      links: block.links.map(link => ({ ...link, id: crypto.randomUUID() })),
    };
    const index = activeBlocks.findIndex(item => item.id === block.id);
    const blocks = [...activeBlocks];
    blocks.splice(index + 1, 0, copy);
    updateActiveBlocks(blocks);
    setSelectedBlockId(copy.id);
  };

  const finishDrag = () => {
    setDragSource(null);
    setDropIndex(null);
  };

  const dropAt = (insertionIndex: number) => {
    if (!dragSource) return;

    if (dragSource.kind === 'library') {
      addBlockAt(dragSource.blockType, insertionIndex);
    } else {
      const sourceIndex = activeBlocks.findIndex(block => block.id === dragSource.blockId);
      const blocks = moveItemToInsertionIndex(activeBlocks, sourceIndex, insertionIndex);
      if (blocks !== activeBlocks) {
        updateActiveBlocks(blocks);
        setSelectedBlockId(dragSource.blockId);
      }
    }
    finishDrag();
  };

  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b px-4 py-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">Job Portal Builder</h1>
            <span className="text-xs text-muted-foreground">Version {revision}</span>
            {isDirty && <span className="h-2 w-2 rounded-full bg-amber-500" aria-label="Unsaved changes" />}
          </div>
          <p className="text-xs text-muted-foreground">{document.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={note}
            onChange={event => setNote(event.target.value)}
            placeholder="Version note"
            className="hidden w-56 lg:block"
          />
          <Button
            type="button"
            onClick={() => onSave(note)}
            disabled={!isDirty || isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save version'}
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={onClose} aria-label="Close editor">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid flex-1 lg:grid-cols-[210px_minmax(0,1fr)_290px]">
        <aside className="overflow-y-auto border-b bg-background p-3 lg:border-b-0 lg:border-r">
          <p className="px-1 text-xs font-semibold uppercase text-muted-foreground">Components</p>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {COMPONENT_LIBRARY.map(component => {
              const Icon = component.icon;
              return (
                <button
                  key={component.type}
                  type="button"
                  onClick={() => addBlock(component.type)}
                  draggable
                  onDragStart={event => {
                    event.dataTransfer.effectAllowed = 'copy';
                    event.dataTransfer.setData('text/plain', component.type);
                    setDragSource({ kind: 'library', blockType: component.type });
                  }}
                  onDragEnd={finishDrag}
                  className={cn(
                    'flex min-h-14 cursor-grab items-center gap-3 rounded-md border bg-background px-3 text-left active:cursor-grabbing',
                    'hover:border-primary/40 hover:bg-accent',
                    dragSource?.kind === 'library'
                      && dragSource.blockType === component.type
                      && 'border-primary bg-primary/5 opacity-70',
                  )}
                  title={`Drag ${component.label} to the canvas or click to add`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">{component.label}</span>
                    <span className="block text-[10px] text-muted-foreground">{component.category}</span>
                  </span>
                  <GripVertical className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>

          <Accordion type="multiple" defaultValue={['pages', 'assets', 'cms']} className="mt-4 border-t">
            <AccordionItem value="pages">
              <AccordionTrigger className="h-10 border-b-0 px-1 py-0 text-xs hover:no-underline">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Pages
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {portalPages.length + 1}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-1 bg-transparent pb-3 pt-1">
                <button
                  type="button"
                  onClick={() => selectPage('homepage')}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[4px] px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800',
                    selectedPageId === 'homepage' && 'bg-primary/10 text-primary',
                  )}
                >
                  <PanelTop className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold">Homepage</span>
                    <span className="block truncate text-[10px] text-muted-foreground">/</span>
                  </span>
                </button>
                {portalPages.map(page => (
                  <div
                      key={page.id}
                      className={cn(
                        'flex items-center gap-1 rounded-[4px] hover:bg-slate-50 dark:hover:bg-slate-800',
                        selectedPageId === page.id && 'bg-primary/10 text-primary',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => selectPage(page.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium">{page.title}</span>
                          <span className="block truncate text-[10px] text-muted-foreground">
                            {page.slug}
                          </span>
                        </span>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removePage(page.id)}
                        aria-label={`Remove ${page.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                <Button type="button" size="sm" variant="outline" className="mt-2 h-8 w-full text-xs" onClick={addPage}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add page
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="assets">
              <AccordionTrigger className="h-10 border-b-0 px-1 py-0 text-xs hover:no-underline">
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Assets
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {portalAssets.length}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-1 bg-transparent pb-3 pt-1">
                {portalAssets.length ? portalAssets.map(asset => (
                  <div
                    key={asset.name}
                    className="flex items-center gap-2 rounded-[4px] px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ImageIcon className="h-4 w-4 shrink-0 text-blue-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium">{asset.name}</span>
                      <span className="block text-[10px] text-muted-foreground">{formatAssetSize(asset.size)}</span>
                    </span>
                    {selectedBlock ? <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => updateSelectedBlock({ imageUrl: asset.url })}>Use</Button> : null}
                  </div>
                )) : <p className="px-2 py-3 text-[10px] leading-4 text-muted-foreground">Uploaded portal images will appear here.</p>}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cms">
              <AccordionTrigger className="h-10 border-b-0 px-1 py-0 text-xs hover:no-underline">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  Data modules
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {document.collections.length}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-1 bg-transparent pb-3 pt-1">
                {document.collections.length === 0 ? (
                  <div className="rounded-[6px] border border-dashed p-3 text-center">
                    <p className="text-[11px] font-medium">No data modules</p>
                    <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                      Create structured content for portal components.
                    </p>
                    <Button type="button" size="sm" className="mt-3 h-8 w-full text-xs" onClick={openNewCmsCollection}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add data module
                    </Button>
                  </div>
                ) : (
                  <>
                    {document.collections.map(collection => (
                      <button
                        key={collection.id}
                        type="button"
                        onClick={() => openCmsCollection(collection)}
                        className="flex w-full items-center gap-2 rounded-[4px] px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Database className="h-4 w-4 shrink-0 text-blue-600" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium">{collection.name}</span>
                          <span className="block text-[10px] text-muted-foreground">
                            {collection.fields.length} fields - {collection.records.length} records
                          </span>
                        </span>
                      </button>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="mt-2 h-8 w-full text-xs" onClick={openNewCmsCollection}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add data module
                    </Button>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>

        <main className="min-w-0 bg-[#e9edf3] p-4 dark:bg-[#07111f] lg:p-7">
          <div className="mx-auto max-w-[900px] overflow-hidden border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-300">{activePageTitle} canvas</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{activeBlocks.length} components</span>
            </div>
            {activeBlocks.length === 0 ? (
              <div
                onDragOver={event => {
                  if (!dragSource) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = dragSource.kind === 'library' ? 'copy' : 'move';
                  setDropIndex(0);
                }}
                onDragLeave={() => setDropIndex(null)}
                onDrop={event => {
                  event.preventDefault();
                  dropAt(0);
                }}
                className={cn(
                  'grid min-h-96 w-full place-items-center border-2 border-dashed border-transparent text-sm text-slate-500 transition-colors',
                  dropIndex === 0 && 'border-blue-500 bg-blue-50/70 text-blue-700',
                )}
              >
                <div className="text-center">
                  <p className="font-medium">
                    {dragSource ? 'Drop component here' : 'Drag a component to the canvas'}
                  </p>
                  <Button type="button" variant="link" size="sm" onClick={() => addBlock('hero')}>
                    Or add a hero component
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <CanvasDropZone
                  active={dropIndex === 0}
                  visible={Boolean(dragSource)}
                  onDragEnter={() => setDropIndex(0)}
                  onDrop={() => dropAt(0)}
                  source={dragSource}
                />
                {activeBlocks.map((block, index) => (
                  <React.Fragment key={block.id}>
                    <div
                      draggable
                      onDragStart={event => {
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', block.id);
                        setDragSource({ kind: 'canvas', blockId: block.id });
                        setSelectedBlockId(block.id);
                      }}
                      onDragEnd={finishDrag}
                      className={cn(
                        'group relative cursor-grab active:cursor-grabbing',
                        selectedBlockId === block.id && 'z-10',
                        dragSource?.kind === 'canvas'
                          && dragSource.blockId === block.id
                          && 'opacity-50',
                      )}
                    >
                      <CompanyPortalRenderer
                        document={{
                          title: activePageTitle,
                          blocks: [block],
                          collections: document.collections,
                          pages: document.pages,
                        }}
                        editable
                        variant={portalVariant}
                        selectedBlockId={selectedBlockId}
                        onSelectBlock={setSelectedBlockId}
                      />
                      {selectedBlockId === block.id && (
                        <div className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-md border bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                          <GripVertical className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <IconButton
                            label="Move up"
                            disabled={index === 0}
                            onClick={() => moveBlock(block.id, -1)}
                            icon={MoveUp}
                          />
                          <IconButton
                            label="Move down"
                            disabled={index === activeBlocks.length - 1}
                            onClick={() => moveBlock(block.id, 1)}
                            icon={MoveDown}
                          />
                          <IconButton label="Duplicate" onClick={() => duplicateBlock(block)} icon={Copy} />
                          <IconButton label="Delete" onClick={() => removeBlock(block.id)} icon={Trash2} destructive />
                        </div>
                      )}
                    </div>
                    <CanvasDropZone
                      active={dropIndex === index + 1}
                      visible={Boolean(dragSource)}
                      onDragEnter={() => setDropIndex(index + 1)}
                      onDrop={() => dropAt(index + 1)}
                      source={dragSource}
                    />
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </main>

        <aside className="border-t bg-background p-4 lg:border-l lg:border-t-0">
          <Tabs defaultValue="properties">
            <TabsList variant="subnav" className="grid w-full grid-cols-2">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
            </TabsList>
            <TabsContent value="properties" className="mt-4 space-y-4">
              <Field label="Page title">
                <Input
                  value={activePageTitle}
                  onChange={event => {
                    const title = event.target.value;
                    if (!selectedPage) {
                      onChange({ ...document, title });
                      return;
                    }
                    onChange({
                      ...document,
                      pages: portalPages.map(page => page.id === selectedPage.id
                        ? { ...page, title }
                        : page),
                    });
                  }}
                />
              </Field>
              {selectedBlock ? (
                <>
                  {selectedBlock.type !== 'divider' && (
                    <Field label="Title">
                      <Input
                        value={selectedBlock.title}
                        onChange={event => updateSelectedBlock({ title: event.target.value })}
                      />
                    </Field>
                  )}
                  {!['divider', 'metrics', 'quick-links', 'data-list', 'data-table', 'data-cards'].includes(selectedBlock.type) && (
                    <Field label="Content">
                      <Textarea
                        value={selectedBlock.body}
                        onChange={event => updateSelectedBlock({ body: event.target.value })}
                        rows={6}
                      />
                    </Field>
                  )}
                  <ComponentStyleControls
                    block={selectedBlock}
                    onChange={style => updateSelectedBlock({ style })}
                  />
                  {selectedBlock.type === 'quick-links' && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold">Links</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Add a label and anchor for each link.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 shrink-0 text-xs"
                          onClick={addQuickLink}
                          disabled={selectedBlock.links.length >= 12}
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Add link
                        </Button>
                      </div>

                      {selectedBlock.links.length === 0 ? (
                        <div className="border border-dashed px-3 py-6 text-center">
                          <p className="text-xs font-medium">No links yet</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Use Add link to create the first item.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y border">
                          {selectedBlock.links.map((link, index) => (
                            <div key={link.id} className="space-y-3 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                  Link {index + 1}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => removeQuickLink(link.id)}
                                  aria-label={`Remove ${link.label || `link ${index + 1}`}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <Field label="Link label">
                                <Input
                                  value={link.label}
                                  onChange={event => updateQuickLink(link.id, {
                                    label: event.target.value,
                                  })}
                                  placeholder="Open roles"
                                />
                              </Field>
                              <Field label="Anchor">
                                <Input
                                  value={link.anchor}
                                  onChange={event => updateQuickLink(link.id, {
                                    anchor: event.target.value,
                                  })}
                                  placeholder="#open-roles"
                                />
                              </Field>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedBlock.type === 'metrics' && (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <p className="flex items-center gap-2 text-xs font-semibold">
                          <Database className="h-4 w-4 text-primary" />
                          Metrics data
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Each record in the selected data module becomes one metric.
                        </p>
                      </div>

                      {document.collections.length === 0 ? (
                        <div className="border border-dashed p-3 text-center">
                          <p className="text-xs font-medium">Create a data module first</p>
                          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                            Add a number field for the value and a text field for the label.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 h-8 w-full text-xs"
                            onClick={openNewCmsCollection}
                          >
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Add data module
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Field label="Data module">
                            <Select
                              value={selectedBlock.dataCollectionId || undefined}
                              onValueChange={selectMetricCollection}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a data module" />
                              </SelectTrigger>
                              <SelectContent>
                                {document.collections.map(collection => (
                                  <SelectItem key={collection.id} value={collection.id}>
                                    {collection.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>

                          {selectedMetricCollection && (
                            <>
                              <Field label="Value field">
                                <Select
                                  value={selectedBlock.metricValueFieldKey || undefined}
                                  onValueChange={metricValueFieldKey => updateSelectedBlock({
                                    metricValueFieldKey,
                                  })}
                                  disabled={metricValueFields.length === 0}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a number field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {metricValueFields.map(field => (
                                      <SelectItem key={field.id} value={field.key}>
                                        {field.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </Field>

                              <Field label="Label field">
                                <Select
                                  value={selectedBlock.metricLabelFieldKey || undefined}
                                  onValueChange={metricLabelFieldKey => updateSelectedBlock({
                                    metricLabelFieldKey,
                                  })}
                                  disabled={metricLabelFields.length === 0}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a text field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {metricLabelFields.map(field => (
                                      <SelectItem key={field.id} value={field.key}>
                                        {field.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </Field>

                              <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                                <span>
                                  {selectedMetricCollection.records.length}{' '}
                                  {selectedMetricCollection.records.length === 1 ? 'record' : 'records'}
                                </span>
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs"
                                  onClick={() => openCmsCollection(selectedMetricCollection)}
                                >
                                  Configure data
                                </Button>
                              </div>

                              {(metricValueFields.length === 0 || metricLabelFields.length === 0) && (
                                <p className="text-xs leading-5 text-amber-700">
                                  This module needs a number field and a text field before it can display metrics.
                                </p>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {['data-list', 'data-table', 'data-cards'].includes(selectedBlock.type) && (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <p className="flex items-center gap-2 text-xs font-semibold">
                          <Database className="h-4 w-4 text-primary" /> Component data
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Select a data model and choose the properties this component displays.
                        </p>
                      </div>
                      {document.collections.length === 0 ? (
                        <Button type="button" variant="outline" size="sm" className="w-full" onClick={openNewCmsCollection}>
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add data module
                        </Button>
                      ) : (
                        <>
                          <Field label="Data module">
                            <Select
                              value={selectedBlock.dataCollectionId || undefined}
                              onValueChange={dataCollectionId => {
                                const collection = document.collections.find(item => item.id === dataCollectionId);
                                updateSelectedBlock({
                                  dataCollectionId,
                                  displayFieldKeys: collection?.fields.slice(0, 3).map(field => field.key) || [],
                                });
                              }}
                            >
                              <SelectTrigger><SelectValue placeholder="Select a data module" /></SelectTrigger>
                              <SelectContent>{document.collections.map(collection => <SelectItem key={collection.id} value={collection.id}>{collection.name}{collection.sourceModel ? ` · ${collection.sourceModel}` : ''}</SelectItem>)}</SelectContent>
                            </Select>
                          </Field>
                          {selectedDataCollection && (
                            <>
                              <div className="space-y-2">
                                <p className="text-xs font-medium">Properties to show</p>
                                <div className="max-h-52 space-y-1 overflow-y-auto border p-2">
                                  {selectedDataCollection.fields.map(field => (
                                    <label key={field.key} className="flex items-center gap-2 px-1 py-1.5 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={selectedBlock.displayFieldKeys.includes(field.key)}
                                        onChange={event => updateSelectedBlock({
                                          displayFieldKeys: event.target.checked
                                            ? [...selectedBlock.displayFieldKeys, field.key].slice(0, 12)
                                            : selectedBlock.displayFieldKeys.filter(key => key !== field.key),
                                        })}
                                      />
                                      <span className="min-w-0 flex-1 truncate">{field.name}</span>
                                      <span className="text-[10px] text-muted-foreground">{field.type}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <Field label="Maximum items">
                                <Input type="number" min={1} max={100} value={selectedBlock.maxItems} onChange={event => updateSelectedBlock({ maxItems: Math.min(100, Math.max(1, Number(event.target.value) || 1)) })} />
                              </Field>
                              <div className="space-y-3 border-t pt-4">
                                <div>
                                  <p className="text-xs font-semibold">Item click action</p>
                                  <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                                    Make each card, list item, or table row open a target stored on its record.
                                  </p>
                                </div>
                                <Field label="On click">
                                  <Select
                                    value={selectedBlock.itemClickAction || 'none'}
                                    onValueChange={(itemClickAction: CompanyPortalItemClickAction) => updateSelectedBlock({
                                      itemClickAction,
                                      itemClickFieldKey: itemClickAction === 'none' ? '' : selectedBlock.itemClickFieldKey,
                                    })}
                                  >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {COMPANY_PORTAL_ITEM_CLICK_ACTIONS.map(action => (
                                        <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </Field>
                                {(selectedBlock.itemClickAction || 'none') !== 'none' && (
                                  <Field label="Target field">
                                    <Select
                                      value={selectedBlock.itemClickFieldKey || undefined}
                                      onValueChange={itemClickFieldKey => updateSelectedBlock({ itemClickFieldKey })}
                                    >
                                      <SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger>
                                      <SelectContent>
                                        {selectedDataCollection.fields.map(field => (
                                          <SelectItem key={field.id} value={field.key}>{field.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </Field>
                                )}
                              </div>
                              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => openCmsCollection(selectedDataCollection)}>
                                Configure model and filters
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {['hero', 'rich-text'].includes(selectedBlock.type) && (
                    <>
                      <Field label="Button label">
                        <Input
                          value={selectedBlock.buttonLabel}
                          onChange={event => updateSelectedBlock({ buttonLabel: event.target.value })}
                        />
                      </Field>
                      <Field label="Button action">
                        <Select
                          value={selectedBlock.buttonAction}
                          onValueChange={(value: CompanyPortalButtonAction) => (
                            updateSelectedBlock({ buttonAction: value, buttonUrl: '' })
                          )}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPANY_PORTAL_BUTTON_ACTIONS.map(action => (
                              <SelectItem key={action.value} value={action.value}>
                                {action.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      {selectedBlock.buttonAction === 'document' ? (
                        <div className="space-y-3">
                        <Field label="Document">
                          <Select
                            value={selectedBlock.buttonUrl || undefined}
                            onValueChange={buttonUrl => updateSelectedBlock({ buttonUrl })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a document" />
                            </SelectTrigger>
                            <SelectContent>
                              {policyDocuments.map(policyDocument => (
                                <SelectItem key={policyDocument.id} value={policyDocument.path}>
                                  <span className="flex items-center gap-2">
                                    <span>{policyDocument.title}</span>
                                    <span className="text-xs text-muted-foreground">{policyDocument.category}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Or link to a document">
                          <Input
                            value={selectedBlock.buttonUrl}
                            onChange={event => updateSelectedBlock({ buttonUrl: event.target.value })}
                            placeholder="/policy-documents/employee-handbook"
                          />
                        </Field>
                        </div>
                      ) : (
                        <Field label={selectedButtonActionField?.label || 'Action target'}>
                          <Input
                            value={selectedBlock.buttonUrl}
                            onChange={event => updateSelectedBlock({ buttonUrl: event.target.value })}
                            placeholder={selectedButtonActionField?.placeholder}
                          />
                        </Field>
                      )}
                    </>
                  )}
                  {['hero', 'image'].includes(selectedBlock.type) && (
                    <Field label="Upload image">
                      <ImageUpload
                        value={selectedBlock.imageUrl}
                        onChange={imageUrl => updateSelectedBlock({ imageUrl })}
                        label=""
                        allowUrl={false}
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        maxSize={5 * 1024 * 1024}
                        previewSize="lg"
                        uploadMethod="POST"
                        uploadUrl="/api/company-portal/assets"
                      />
                    </Field>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select a canvas component.</p>
              )}
            </TabsContent>
            <TabsContent value="versions" className="mt-4">
              <div className="space-y-2">
                {versions.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No saved versions yet.</p>
                )}
                {versions.map(version => (
                  <div key={version.id} className="border-b py-3 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold">Version {version.revision}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{version.note}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {version.createdBy} · {new Date(version.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => onRestore(version.id)}
                        aria-label={`Restore version ${version.revision}`}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
      <CompanyPortalCmsDialog
        collection={cmsDialogCollection}
        isNew={isNewCmsCollection}
        onClose={() => {
          setCmsDialogCollection(null);
          setIsNewCmsCollection(false);
        }}
        onSave={saveCmsCollection}
      />
    </div>
  );
}

const STYLE_LABELS: Record<CompanyPortalBlockType, string> = {
  hero: 'Hero',
  announcement: 'Announcement',
  'rich-text': 'Text section',
  'quick-links': 'Quick links',
  image: 'Image section',
  metrics: 'Metrics',
  'data-list': 'Data list',
  'data-table': 'Data table',
  'data-cards': 'Data cards',
  divider: 'Divider',
};

function ComponentStyleControls({
  block,
  onChange,
}: {
  block: CompanyPortalBlock;
  onChange: (style: CompanyPortalBlockStyle) => void;
}) {
  const style = resolveCompanyPortalBlockStyle(block);
  const updateStyle = <Key extends keyof CompanyPortalBlockStyle>(
    key: Key,
    value: CompanyPortalBlockStyle[Key],
  ) => onChange({ ...style, [key]: value });
  const supportsAlignment = !['divider', 'data-table'].includes(block.type);
  const supportsWidth = !['hero', 'announcement'].includes(block.type);
  const supportsCards = ['quick-links', 'metrics', 'data-table', 'data-cards'].includes(block.type);
  const supportsColumns = ['quick-links', 'metrics', 'data-cards'].includes(block.type);

  return (
    <div className="space-y-4 border-t pt-4">
      <div>
        <p className="text-xs font-semibold">{STYLE_LABELS[block.type]} style</p>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
          These options apply only to this component.
        </p>
      </div>

      {block.type === 'hero' ? (
        <StyleSelect
          label="Height"
          preview="height"
          value={style.heroHeight || 'standard'}
          onChange={value => updateStyle('heroHeight', value as CompanyPortalBlockStyle['heroHeight'])}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'standard', label: 'Standard' },
            { value: 'tall', label: 'Tall' },
          ]}
        />
      ) : (
        <StyleSelect
          label={['announcement', 'data-table'].includes(block.type) ? 'Density' : 'Vertical spacing'}
          preview="spacing"
          value={style.spacing || 'comfortable'}
          onChange={value => updateStyle('spacing', value as CompanyPortalBlockStyle['spacing'])}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'spacious', label: 'Spacious' },
          ]}
        />
      )}

      {block.type !== 'divider' && (
        <StyleSelect
          label={['hero', 'announcement'].includes(block.type) ? 'Tone' : 'Background'}
          preview="background"
          value={style.background || 'default'}
          onChange={value => updateStyle('background', value as CompanyPortalBlockStyle['background'])}
          options={[
            { value: 'default', label: 'Brand default' },
            { value: 'muted', label: 'Neutral' },
            { value: 'accent', label: 'Highlight' },
          ]}
        />
      )}

      {supportsAlignment && (
        <StyleSelect
          label="Content alignment"
          preview="alignment"
          value={style.alignment || 'left'}
          onChange={value => updateStyle('alignment', value as CompanyPortalBlockStyle['alignment'])}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Centered' },
          ]}
        />
      )}

      {supportsWidth && (
        <StyleSelect
          label="Content width"
          preview="width"
          value={style.contentWidth || 'standard'}
          onChange={value => updateStyle('contentWidth', value as CompanyPortalBlockStyle['contentWidth'])}
          options={[
            { value: 'narrow', label: 'Narrow' },
            { value: 'standard', label: 'Standard' },
            { value: 'wide', label: 'Wide' },
          ]}
        />
      )}

      {supportsColumns && (
        <StyleSelect
          label="Columns"
          preview="columns"
          value={String(style.columns || 3)}
          onChange={value => updateStyle('columns', Number(value) as CompanyPortalBlockStyle['columns'])}
          options={[
            { value: '2', label: 'Two' },
            { value: '3', label: 'Three' },
            { value: '4', label: 'Four' },
          ]}
        />
      )}

      {supportsCards && (
        <StyleSelect
          label={block.type === 'data-table' ? 'Table frame' : 'Item style'}
          preview="cards"
          value={style.cardStyle || 'outline'}
          onChange={value => updateStyle('cardStyle', value as CompanyPortalBlockStyle['cardStyle'])}
          options={[
            { value: 'outline', label: 'Outlined' },
            { value: 'soft', label: 'Soft fill' },
            { value: 'elevated', label: 'Elevated' },
          ]}
        />
      )}

      {block.type === 'image' && (
        <>
          <StyleSelect
            label="Image position"
            preview="image-layout"
            value={style.imageLayout || 'left'}
            onChange={value => updateStyle('imageLayout', value as CompanyPortalBlockStyle['imageLayout'])}
            options={[
              { value: 'left', label: 'Image left' },
              { value: 'right', label: 'Image right' },
              { value: 'full', label: 'Full width' },
            ]}
          />
          <StyleSelect
            label="Image fit"
            preview="image-fit"
            value={style.imageFit || 'cover'}
            onChange={value => updateStyle('imageFit', value as CompanyPortalBlockStyle['imageFit'])}
            options={[
              { value: 'cover', label: 'Crop to fill' },
              { value: 'contain', label: 'Show full image' },
            ]}
          />
        </>
      )}

      {block.type === 'divider' && (
        <StyleSelect
          label="Line style"
          preview="divider"
          value={style.dividerStyle || 'solid'}
          onChange={value => updateStyle('dividerStyle', value as CompanyPortalBlockStyle['dividerStyle'])}
          options={[
            { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
          ]}
        />
      )}
    </div>
  );
}

type StylePreviewKind =
  | 'alignment'
  | 'background'
  | 'cards'
  | 'columns'
  | 'divider'
  | 'height'
  | 'image-fit'
  | 'image-layout'
  | 'spacing'
  | 'width';

function StyleSelect({
  label,
  onChange,
  options,
  preview,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  preview: StylePreviewKind;
  value: string;
}) {
  const selectedOption = options.find(option => option.value === value) || options[0];

  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 bg-background" aria-label={label}>
          <SelectValue>
            <span className="flex items-center gap-2">
              <StyleOptionPreview kind={preview} value={value} />
              <span>{selectedOption?.label}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value} className="py-1.5">
              <span className="flex items-center gap-2.5">
                <StyleOptionPreview kind={preview} value={option.value} />
                <span>{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function StyleOptionPreview({ kind, value }: { kind: StylePreviewKind; value: string }) {
  const line = (key: string, x: number, y: number, width: number) => (
    <rect key={key} x={x} y={y} width={width} height="1.5" rx="0.75" fill="currentColor" opacity="0.65" />
  );

  const preview = (() => {
    if (kind === 'height') {
      const height = value === 'compact' ? 8 : value === 'tall' ? 18 : 13;
      const y = (24 - height) / 2;
      return <><rect x="3" y={y} width="26" height={height} rx="2" fill="currentColor" opacity="0.14" />{line('h1', 8, y + height / 2 - 2, 16)}{line('h2', 10, y + height / 2 + 2, 12)}</>;
    }
    if (kind === 'spacing') {
      const gap = value === 'compact' ? 3 : value === 'spacious' ? 7 : 5;
      return <>{[0, 1, 2].map(index => line(`s${index}`, 5, 5 + index * gap, 22 - index * 3))}</>;
    }
    if (kind === 'background') {
      const opacity = value === 'default' ? 0.08 : value === 'muted' ? 0.16 : 0.3;
      return <><rect x="3" y="3" width="26" height="18" rx="2" fill="currentColor" opacity={opacity} />{line('b1', 8, 9, 16)}{line('b2', 8, 13, 11)}</>;
    }
    if (kind === 'alignment') {
      const centered = value === 'center';
      return <>{line('a1', centered ? 7 : 4, 7, 18)}{line('a2', centered ? 10 : 4, 11, 12)}{line('a3', centered ? 8 : 4, 15, 16)}</>;
    }
    if (kind === 'width') {
      const width = value === 'narrow' ? 12 : value === 'wide' ? 26 : 19;
      return <><rect x={(32 - width) / 2} y="5" width={width} height="14" rx="2" fill="currentColor" opacity="0.14" />{line('w1', (32 - width) / 2 + 3, 10, Math.max(6, width - 6))}{line('w2', (32 - width) / 2 + 3, 14, Math.max(4, width - 10))}</>;
    }
    if (kind === 'columns') {
      const count = Number(value);
      const gap = 2;
      const width = (26 - gap * (count - 1)) / count;
      return <>{Array.from({ length: count }, (_, index) => <rect key={index} x={3 + index * (width + gap)} y="5" width={width} height="14" rx="1.5" fill="currentColor" opacity="0.2" />)}</>;
    }
    if (kind === 'cards') {
      const filled = value !== 'outline';
      return <><rect x="4" y="5" width="24" height="14" rx="2" fill={filled ? 'currentColor' : 'none'} opacity={filled ? (value === 'elevated' ? 0.18 : 0.1) : 1} stroke="currentColor" strokeWidth={value === 'outline' ? 1.2 : 0} />{value === 'elevated' && <path d="M7 20h18" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />}{line('c1', 8, 10, 16)}{line('c2', 8, 14, 10)}</>;
    }
    if (kind === 'image-layout') {
      if (value === 'full') return <><rect x="3" y="4" width="26" height="16" rx="2" fill="currentColor" opacity="0.22" /><path d="m6 17 6-6 4 4 3-3 7 5" fill="none" stroke="currentColor" strokeWidth="1.2" /></>;
      const imageX = value === 'right' ? 18 : 3;
      const textX = value === 'right' ? 4 : 18;
      return <><rect x={imageX} y="4" width="11" height="16" rx="2" fill="currentColor" opacity="0.22" />{line('il1', textX, 8, 10)}{line('il2', textX, 12, 8)}{line('il3', textX, 16, 9)}</>;
    }
    if (kind === 'image-fit') {
      return <><rect x="4" y="3" width="24" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.55" /><rect x={value === 'contain' ? 9 : 5} y={value === 'contain' ? 6 : 4} width={value === 'contain' ? 14 : 22} height={value === 'contain' ? 12 : 16} rx="1.5" fill="currentColor" opacity="0.2" /><path d="m8 17 6-6 4 4 3-3 4 4" fill="none" stroke="currentColor" strokeWidth="1.2" /></>;
    }
    return <line x1="4" y1="12" x2="28" y2="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray={value === 'dashed' ? '3 2' : undefined} />;
  })();

  return (
    <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded border border-border bg-muted/40 text-primary" aria-hidden="true">
      <svg viewBox="0 0 32 24" className="h-6 w-8">{preview}</svg>
    </span>
  );
}

function CanvasDropZone({
  active,
  onDragEnter,
  onDrop,
  source,
  visible,
}: {
  active: boolean;
  onDragEnter: () => void;
  onDrop: () => void;
  source: PortalEditorDragSource | null;
  visible: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      onDragEnter={event => {
        if (!source) return;
        event.preventDefault();
        onDragEnter();
      }}
      onDragOver={event => {
        if (!source) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = source.kind === 'library' ? 'copy' : 'move';
      }}
      onDrop={event => {
        event.preventDefault();
        onDrop();
      }}
      className={cn(
        'relative transition-colors duration-150',
        visible ? 'h-5 bg-blue-50/50' : 'h-0',
        active && 'h-12 bg-blue-50',
      )}
    >
      {active && (
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <span className="h-0.5 flex-1 bg-blue-500" />
          <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">
            Drop here
          </span>
          <span className="h-0.5 flex-1 bg-blue-500" />
        </div>
      )}
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function formatAssetSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function IconButton({
  destructive = false,
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  destructive?: boolean;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      disabled={disabled}
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      className={cn('h-7 w-7', destructive && 'text-destructive hover:text-destructive')}
      aria-label={label}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
