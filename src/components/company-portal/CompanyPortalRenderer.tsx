"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  BookOpen,
  Building2,
  CalendarCheck,
  FileText,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Sparkles,
} from 'lucide-react';

import type {
  CompanyPortalBlock,
  CompanyPortalCmsCollection,
  CompanyPortalDocument,
  CompanyPortalLiveRecords,
} from '@/lib/company-portal-builder';
import { resolveCompanyPortalBlockStyle } from '@/lib/company-portal-builder';
import { resolveCompanyPortalItemClickAction } from '@/lib/company-portal-actions';
import { resolveCompanyPortalLinkAnchor } from '@/lib/company-portal-links';
import { getCompanyPortalMetrics } from '@/lib/company-portal-metrics';
import { cn } from '@/lib/utils';
import {
  DataComponentEmpty,
  DataListItem,
  PortalButtonLink,
  activateItemAction,
  getDataRowSpacing,
} from './CompanyPortalRendererParts';

const SECTION_SPACING = {
  compact: 'py-5',
  comfortable: 'py-10',
  spacious: 'py-16',
} as const;

const CONTENT_WIDTH = {
  narrow: 'max-w-3xl',
  standard: 'max-w-5xl',
  wide: 'max-w-6xl',
} as const;

const COLUMN_LAYOUT = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
} as const;

const CARD_STYLE = {
  outline: 'border border-slate-200 bg-white',
  soft: 'border border-transparent bg-slate-50',
  elevated: 'border border-slate-100 bg-white shadow-[0_12px_32px_-18px_rgba(15,23,42,0.38)]',
} as const;

function safeImageUrl(value: string) {
  return /^(https?:\/\/|\/)/i.test(value) ? value : '';
}

export type CompanyPortalRendererVariant = 'job' | 'employee';

export function CompanyPortalRenderer({
  document,
  editable = false,
  onSelectBlock,
  selectedBlockId,
  variant = 'job',
  liveRecords = {},
}: {
  document: CompanyPortalDocument;
  editable?: boolean;
  onSelectBlock?: (id: string) => void;
  selectedBlockId?: string | null;
  variant?: CompanyPortalRendererVariant;
  liveRecords?: CompanyPortalLiveRecords;
}) {
  return (
    <div className={variant === 'job' ? 'bg-[#f7f8f4] text-slate-950' : 'bg-[#f6f8fb] text-slate-950'}>
      {document.blocks.map(block => (
        <div
          key={block.id}
          className={
            editable
              ? `relative cursor-pointer border-2 transition-colors ${
                  selectedBlockId === block.id
                    ? 'border-blue-500'
                    : 'border-transparent hover:border-blue-200'
                }`
              : ''
          }
          onClick={editable ? (event) => {
            event.preventDefault();
            onSelectBlock?.(block.id);
          } : undefined}
        >
          <PortalBlock
            block={block}
            collections={document.collections}
            editable={editable}
            variant={variant}
            liveRecords={liveRecords}
          />
        </div>
      ))}
    </div>
  );
}

export function PortalBlock({
  block,
  collections,
  editable = false,
  variant = 'job',
  liveRecords = {},
}: {
  block: CompanyPortalBlock;
  collections: CompanyPortalCmsCollection[];
  editable?: boolean;
  variant?: CompanyPortalRendererVariant;
  liveRecords?: CompanyPortalLiveRecords;
}) {
  const resolvedCollections = collections.map(collection => (
    collection.sourceType === 'platform'
      ? { ...collection, records: liveRecords[collection.id] || [] }
      : collection
  ));
  const style = resolveCompanyPortalBlockStyle(block);
  const spacingClass = SECTION_SPACING[style.spacing || 'comfortable'];
  const widthClass = CONTENT_WIDTH[style.contentWidth || 'standard'];
  const alignmentClass = style.alignment === 'center' ? 'text-center' : 'text-left';
  const surfaceClass = style.background === 'muted'
    ? 'bg-slate-50'
    : style.background === 'accent'
      ? variant === 'job' ? 'bg-emerald-50' : 'bg-blue-50'
      : block.type === 'quick-links'
        ? 'bg-transparent'
        : block.type === 'metrics' && variant === 'employee'
          ? 'bg-[#eef2f7]'
          : 'bg-white';

  if (block.type === 'hero') {
    const imageUrl = safeImageUrl(block.imageUrl);
    const heroHeight = {
      compact: 'min-h-[320px]',
      standard: variant === 'job' ? 'min-h-[430px]' : 'min-h-[360px]',
      tall: 'min-h-[560px]',
    }[style.heroHeight || 'standard'];
    const heroBackground = style.background === 'muted'
      ? '#334155'
      : style.background === 'accent'
        ? variant === 'job' ? '#713f12' : '#4338ca'
        : variant === 'job' ? '#193225' : '#17233d';
    const heroImageStyle = imageUrl ? {
      backgroundColor: heroBackground,
      backgroundImage: `linear-gradient(90deg, rgba(15,23,42,.93), rgba(15,23,42,.55)), url("${imageUrl}")`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    } : { backgroundColor: heroBackground };
    if (variant === 'job') {
      return (
        <section
          className={cn('relative overflow-hidden px-6 py-14 text-white sm:px-8', heroHeight)}
          style={heroImageStyle}
        >
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(247,248,244,.16))]" />
          <div className={cn(
            'mx-auto',
            style.alignment === 'center'
              ? 'flex max-w-4xl justify-center text-center'
              : 'grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end',
          )}>
            <div className={style.alignment === 'center' ? 'flex max-w-3xl flex-col items-center' : undefined}>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-100">
                <Sparkles className="h-3.5 w-3.5" />
                Careers portal
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">{block.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/85">{block.body}</p>
              {block.buttonLabel && (
                <PortalButtonLink
                  block={block}
                  className="mt-8 inline-flex h-11 items-center rounded-md bg-emerald-300 px-5 text-sm font-bold text-emerald-950 hover:bg-emerald-200"
                >
                  {block.buttonLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </PortalButtonLink>
              )}
            </div>
            {style.alignment !== 'center' && <div className="grid gap-3 rounded-[8px] border border-white/15 bg-white/10 p-4 backdrop-blur">
              {['Product designer', 'People partner', 'Operations lead'].map((role, index) => (
                <div key={role} className="rounded-[6px] bg-white p-4 text-slate-950 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold">{role}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800">
                      {index === 0 ? 'Remote' : index === 1 ? 'Hybrid' : 'Onsite'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Applicant pipeline open this week</p>
                </div>
              ))}
            </div>}
          </div>
        </section>
      );
    }

    return (
      <section
        className={cn('relative overflow-hidden px-8 py-16 text-white', heroHeight)}
        style={heroImageStyle}
      >
        <div className={cn('mx-auto max-w-6xl', alignmentClass, style.alignment === 'center' && 'flex flex-col items-center')}>
          <p className="text-xs font-semibold uppercase text-blue-200">Company portal</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight">{block.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50/80">{block.body}</p>
          {block.buttonLabel && (
            <PortalButtonLink
              block={block}
              className="mt-7 inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
            >
              {block.buttonLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </PortalButtonLink>
          )}
        </div>
      </section>
    );
  }

  if (block.type === 'announcement') {
    const isJob = variant === 'job';
    const announcementTone = style.background === 'muted'
      ? {
        section: 'border-slate-200 bg-slate-100',
        dot: 'bg-slate-500',
        title: 'text-slate-950',
        body: 'text-slate-700',
      }
      : style.background === 'accent'
        ? {
          section: 'border-amber-200 bg-amber-50',
          dot: 'bg-amber-600',
          title: 'text-amber-950',
          body: 'text-amber-800',
        }
        : isJob
          ? {
            section: 'border-emerald-100 bg-emerald-50',
            dot: 'bg-emerald-600',
            title: 'text-emerald-950',
            body: 'text-emerald-800',
          }
          : {
            section: 'border-blue-100 bg-blue-50',
            dot: 'bg-blue-600',
            title: 'text-blue-950',
            body: 'text-blue-800',
          };
    return (
      <section className={cn('border-b px-8', spacingClass, announcementTone.section)}>
        <div className={cn('mx-auto flex max-w-6xl items-start gap-3', style.alignment === 'center' && 'justify-center text-center')}>
          <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', announcementTone.dot)} />
          <div>
            <h2 className={cn('text-sm font-semibold', announcementTone.title)}>{block.title}</h2>
            <p className={cn('mt-1 text-sm', announcementTone.body)}>{block.body}</p>
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'quick-links') {
    const links = block.links.filter(link => link.label.trim());
    const icons = variant === 'job'
      ? [BriefcaseBusiness, CalendarCheck, HeartHandshake, FileText]
      : [BookOpen, HeartHandshake, GraduationCap, FileText];
    return (
      <section id="resources" className={cn('px-8', spacingClass, surfaceClass)}>
        <div className={cn('mx-auto', widthClass, alignmentClass)}>
          <h2 className={cn('text-2xl font-bold', alignmentClass)}>{block.title}</h2>
          <div className={cn('mt-6 grid gap-3', COLUMN_LAYOUT[style.columns || 4])}>
            {links.map((link, index) => {
              const Icon = icons[index % icons.length];
              const anchor = resolveCompanyPortalLinkAnchor(link.anchor);
              return (
                <a
                  key={link.id}
                  href={anchor.href}
                  target={anchor.opensNewTab ? '_blank' : undefined}
                  rel={anchor.opensNewTab ? 'noopener noreferrer' : undefined}
                  className={cn(
                    'group p-5 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    CARD_STYLE[style.cardStyle || 'outline'],
                    alignmentClass,
                  )}
                >
                  <Icon className={cn(
                    variant === 'job' ? 'h-5 w-5 text-emerald-700' : 'h-5 w-5 text-blue-600',
                    style.alignment === 'center' && 'mx-auto',
                  )} />
                  <p className="mt-5 text-sm font-semibold">{link.label}</p>
                  <ArrowRight className={cn(
                    'mt-3 h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5',
                    style.alignment === 'center' && 'mx-auto',
                  )} />
                </a>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'image') {
    const imageUrl = safeImageUrl(block.imageUrl);
    return (
      <section className={cn('px-8', spacingClass, surfaceClass)}>
        <div className={cn(
          'mx-auto grid gap-6',
          widthClass,
          style.imageLayout === 'full'
            ? 'grid-cols-1'
            : 'md:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)] md:items-center',
        )}>
          <div className={cn('grid min-h-56 place-items-center overflow-hidden bg-slate-100', style.imageLayout === 'right' && 'md:order-2')}>
            {imageUrl ? (
              <img src={imageUrl} alt="" className={cn('h-full max-h-96 w-full', style.imageFit === 'contain' ? 'object-contain' : 'object-cover')} />
            ) : (
              <Building2 className="h-12 w-12 text-slate-300" />
            )}
          </div>
          <div className={cn(alignmentClass, style.imageLayout === 'full' && 'mx-auto max-w-3xl')}>
            <h2 className="text-2xl font-bold">{block.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{block.body}</p>
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'metrics') {
    const metrics = getCompanyPortalMetrics(block, resolvedCollections);
    if (metrics.length === 0 && !editable) return null;

    return (
      <section id={variant === 'job' ? 'hiring-overview' : undefined} className={cn('px-8', spacingClass, surfaceClass)}>
        <div className={cn('mx-auto', widthClass, alignmentClass)}>
          <h2 className="text-lg font-semibold">{block.title}</h2>
          {metrics.length > 0 ? (
            <div className={cn('mt-5 grid gap-5', COLUMN_LAYOUT[style.columns || 3])}>
              {metrics.map((metric, index) => {
                const Icon = variant === 'job' ? [BriefcaseBusiness, CalendarCheck, MapPin][index % 3] : null;
                return (
                  <div key={metric.id} className={cn('p-5', CARD_STYLE[style.cardStyle || 'soft'], alignmentClass)}>
                    {Icon && <Icon className="mb-4 h-5 w-5 text-emerald-700" />}
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="mt-1 text-sm text-slate-600">{metric.label}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center">
              <p className="text-sm font-semibold text-slate-700">Connect a data module</p>
              <p className="mt-1 text-xs text-slate-500">
                Choose the value and label fields in Properties.
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (['data-list', 'data-table', 'data-cards'].includes(block.type)) {
    const collection = resolvedCollections.find(item => item.id === block.dataCollectionId);
    const fields = collection?.fields.filter(field => block.displayFieldKeys.includes(field.key)) || [];
    const records = collection?.records.slice(0, block.maxItems) || [];

    return (
      <section id={variant === 'job' ? 'open-roles' : undefined} className={cn('px-8', spacingClass, surfaceClass)}>
        <div className={cn('mx-auto', widthClass, alignmentClass)}>
          <h2 className={cn('text-2xl font-bold', alignmentClass)}>{block.title}</h2>
          {!collection || fields.length === 0 ? (
            <DataComponentEmpty editable={editable} />
          ) : block.type === 'data-table' ? (
            <div className={cn('mt-6 overflow-x-auto', CARD_STYLE[style.cardStyle || 'outline'])}>
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>{fields.map(field => <th key={field.key} className={cn('px-4 font-semibold', getDataRowSpacing(style.spacing))}>{field.name}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(record => {
                    const action = resolveCompanyPortalItemClickAction(block, record);
                    return (
                      <tr
                        key={record.id}
                        className={cn(action && !editable && 'cursor-pointer transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none')}
                        role={action && !editable ? 'link' : undefined}
                        aria-label={action && !editable ? `Open ${record.values[fields[0].key] || 'item'}` : undefined}
                        tabIndex={action && !editable ? 0 : undefined}
                        onClick={action && !editable ? () => activateItemAction(action) : undefined}
                        onKeyDown={action && !editable ? event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            activateItemAction(action);
                          }
                        } : undefined}
                      >
                        {fields.map(field => <td key={field.key} className={cn('px-4 text-slate-700', getDataRowSpacing(style.spacing))}>{record.values[field.key] || '—'}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : block.type === 'data-cards' ? (
            <div className={cn('mt-6 grid gap-4', COLUMN_LAYOUT[style.columns || 3])}>
              {records.map(record => {
                const action = resolveCompanyPortalItemClickAction(block, record);
                const cardClassName = cn(
                  'flex flex-col p-5',
                  CARD_STYLE[style.cardStyle || 'soft'],
                  alignmentClass,
                  action && !editable && 'group transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                );
                const content = <>
                  {fields.map((field, index) => index === 0 ? (
                    <h3 key={field.key} className="text-base font-bold">{record.values[field.key] || '—'}</h3>
                  ) : (
                    <p key={field.key} className="mt-2 text-sm text-slate-600"><span className="font-medium text-slate-500">{field.name}:</span> {record.values[field.key] || '—'}</p>
                  ))}
                  {action && !editable && <ArrowRight className="mt-5 h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />}
                </>;
                return (
                  action && !editable ? (
                    <a key={record.id} href={action.href} target={action.opensNewTab ? '_blank' : undefined} rel={action.opensNewTab ? 'noopener noreferrer' : undefined} className={cardClassName}>{content}</a>
                  ) : (
                    <article key={record.id} className={cardClassName}>{content}</article>
                  )
                );
              })}
            </div>
          ) : (
            <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {records.map(record => (
                <DataListItem key={record.id} block={block} editable={editable} fields={fields} record={record} spacing={style.spacing} />
              ))}
            </div>
          )}
          {collection && fields.length > 0 && records.length === 0 && (
            <p className="mt-6 border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              {collection.sourceType === 'platform'
                ? `No live ${collection.sourceModel} records match the configured conditions.`
                : 'No records match this component.'}
            </p>
          )}
        </div>
      </section>
    );
  }

  if (block.type === 'divider') {
    return (
      <div className={cn('bg-white px-8', spacingClass)}>
        <div className={cn(
          'mx-auto border-t border-slate-200',
          widthClass,
          style.dividerStyle === 'dashed' && 'border-dashed',
        )} />
      </div>
    );
  }

  return (
    <section className={cn('px-8', spacingClass, surfaceClass)}>
      <div className={cn('mx-auto', widthClass, alignmentClass)}>
        <h2 className="text-2xl font-bold">{block.title}</h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{block.body}</p>
        {block.buttonLabel && (
          <PortalButtonLink
            block={block}
            className="mt-5 inline-flex items-center text-sm font-semibold text-blue-700"
          >
            {block.buttonLabel}
            <ArrowRight className="ml-1 h-4 w-4" />
          </PortalButtonLink>
        )}
      </div>
    </section>
  );
}
