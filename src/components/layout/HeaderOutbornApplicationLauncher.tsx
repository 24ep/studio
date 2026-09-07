"use client";

import * as React from "react";
import {
  ArrowTopRightOnSquareIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type LauncherApplication = {
  applicationId: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  launchUrl: string | null;
  accessible: boolean;
};

type LauncherResponse = {
  organization: { id: string; name: string } | null;
  accountHref: string | null;
  applications: LauncherApplication[];
};

function applicationInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "O"
  );
}

function ApplicationMark({ application }: { application: LauncherApplication }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(application.iconUrl) && !imageFailed;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center overflow-hidden text-[10px] font-semibold",
        showImage
          ? "bg-transparent"
          : "rounded-lg bg-muted text-muted-foreground",
      )}
    >
      {showImage ? (
        // Account catalog icons can be hosted by any registered Outborn product,
        // so use the catalog URL directly instead of Next Image's static host allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="h-9 w-9 object-contain dark:drop-shadow-[0_0_1px_rgba(255,255,255,0.7)]"
          decoding="async"
          height={36}
          loading="lazy"
          onError={() => setImageFailed(true)}
          src={application.iconUrl!}
          width={36}
        />
      ) : (
        applicationInitials(application.name)
      )}
    </span>
  );
}

function ApplicationItem({
  application,
  onNavigate,
}: {
  application: LauncherApplication;
  onNavigate: () => void;
}) {
  const enabled = application.accessible && Boolean(application.launchUrl);
  const content = (
    <>
      <ApplicationMark application={application} />
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm font-medium text-foreground">
          {application.name}
        </strong>
        {application.description ? (
          <small className="mt-0.5 line-clamp-2 block text-xs leading-4 text-muted-foreground">
            {application.description}
          </small>
        ) : null}
      </span>
    </>
  );

  if (!enabled) {
    return (
      <div
        aria-disabled="true"
        className="flex min-h-[62px] min-w-0 items-center gap-3 rounded-xl px-3 py-2 opacity-55"
        title={`${application.name} is not available for this organization`}
      >
        {content}
      </div>
    );
  }

  return (
    <a
      className="flex min-h-[62px] min-w-0 items-center gap-3 rounded-xl px-3 py-2 no-underline transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={application.launchUrl!}
      onClick={onNavigate}
      title={`Open ${application.name}`}
    >
      {content}
    </a>
  );
}

function LauncherLoading() {
  return (
    <div className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading Outborn applications">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex min-h-[62px] items-center gap-3 rounded-xl px-3 py-2">
          <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-2/3 animate-pulse rounded bg-muted" />
            <span className="block h-2.5 w-full animate-pulse rounded bg-muted" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function HeaderOutbornApplicationLauncher() {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<LauncherResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const loadApplications = React.useCallback(async () => {
    if (data || loading) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/outborn/application-launcher", {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Sign in with Outborn Account to open the application directory."
            : "Outborn applications could not be loaded.",
        );
      }

      const payload = (await response.json()) as LauncherResponse;
      setData(payload);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      console.error("[OUTBORN APPLICATION LAUNCHER] Failed to load:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Outborn applications could not be loaded.",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [data, loading]);

  React.useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) void loadApplications();
    },
    [loadApplications],
  );

  const availableApplications = React.useMemo(
    () =>
      data?.applications.filter(
        (application) => application.accessible && application.launchUrl,
      ) ?? [],
    [data],
  );
  const unavailableApplications = React.useMemo(
    () =>
      data?.applications.filter(
        (application) => !application.accessible || !application.launchUrl,
      ) ?? [],
    [data],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          aria-label="Outborn Apps"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title="Outborn Apps"
          type="button"
        >
          <Squares2X2Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
          <span className="whitespace-nowrap">Outborn Apps</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="overflow-hidden p-0 md:!w-[760px] md:max-w-[calc(100vw-2rem)] lg:!w-[840px]"
        popoverId="outborn-application-launcher"
        side="bottom"
        sideOffset={8}
        zIndexType="dropdown"
      >
        <div className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-4 py-3">
          <span className="min-w-0">
            <strong className="block text-sm font-semibold text-foreground">
              Outborn apps
            </strong>
            {data?.organization?.name ? (
              <small className="block truncate text-xs text-muted-foreground">
                {data.organization.name}
              </small>
            ) : null}
          </span>

          {data?.accountHref ? (
            <a
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground no-underline hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={data.accountHref}
              onClick={() => setOpen(false)}
            >
              Account
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>

        <div className="max-h-[min(620px,calc(100vh-8rem))] overflow-y-auto">
          {loading && !data ? <LauncherLoading /> : null}

          {error ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                {error}
              </p>
              <button
                className="mt-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  setData(null);
                  void loadApplications();
                }}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : null}

          {data && !error ? (
            <>
              <section aria-label="Available Outborn applications" className="p-2">
                {availableApplications.length ? (
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    {availableApplications.map((application) => (
                      <ApplicationItem
                        application={application}
                        key={application.applicationId}
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No applications are available for this organization.
                  </p>
                )}
              </section>

              {unavailableApplications.length ? (
                <section
                  aria-label="Unavailable Outborn applications"
                  className="border-t border-border px-2 pb-2 pt-3"
                >
                  <h3 className="px-3 pb-1 text-[11px] font-semibold text-muted-foreground">
                    Unavailable apps
                  </h3>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    {unavailableApplications.map((application) => (
                      <ApplicationItem
                        application={application}
                        key={application.applicationId}
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
