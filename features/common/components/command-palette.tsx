'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bug, FolderKanban, ListTodo, SearchIcon } from 'lucide-react';
import { useSearch } from '@tornotron/echno-core/search/hooks';
import {
  SEARCH_MIN_TERM_LENGTH,
  type SearchHit,
} from '@tornotron/echno-core/search/services';
import { navigation, publicRoutes, type NavItem } from '@/config/nav.config';
import { useDebounce } from '@/hooks/use-debounce';
import { routes } from '@/nav';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/shadcn/command';

type RouteEntry = {
  id: string;
  label: string;
  href: string;
  section: string;
  keywords: string;
};

function collectNavEntries(
  items: NavItem[],
  sectionPath: string[],
  out: RouteEntry[],
  seen: Set<string>
): void {
  for (const item of items) {
    if (!item.path.includes(':') && !seen.has(item.path)) {
      seen.add(item.path);
      const section = sectionPath.join(' › ') || 'Navigation';
      out.push({
        id: `${section}::${item.label}::${item.path}`,
        label: item.label,
        href: item.path,
        section,
        keywords: `${item.label} ${section} ${item.path}`.toLowerCase(),
      });
    }
    if (item.children) {
      collectNavEntries(item.children, [...sectionPath, item.label], out, seen);
    }
  }
}

function getStaticRouteEntries(): RouteEntry[] {
  const out: RouteEntry[] = [];
  const seen = new Set<string>();
  collectNavEntries(navigation, [], out, seen);
  for (const [key, path] of Object.entries(publicRoutes)) {
    if (!seen.has(path)) {
      seen.add(path);
      const label = key.replaceAll(/([A-Z])/g, ' $1').trim();
      const titled = label.charAt(0).toUpperCase() + label.slice(1);
      out.push({
        id: `Pages::${titled}::${path}`,
        label: titled,
        href: path,
        section: 'Pages',
        keywords: `${titled} pages ${path}`.toLowerCase(),
      });
    }
  }
  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}

type SearchEntry = {
  id: string;
  label: string;
  href: string;
  kind: 'project' | 'task' | 'issue' | 'page';
  keywords: string;
  section?: string;
};

/**
 * Turns a server hit into a palette row, or null when it cannot be linked to.
 *
 * A task's route is nested under its project, so a task hit with no project has nowhere to point
 * and is dropped rather than rendered as a dead row. Issues live on one list page, so their own id
 * is not needed in the href.
 */
function toSearchEntry(hit: SearchHit): SearchEntry | null {
  const keywords = hit.title.toLowerCase();
  switch (hit.type) {
    case 'PROJECT': {
      return {
        id: `project-${hit.id}`,
        label: hit.title,
        href: routes.projects.allProjects.detail(String(hit.id)).href,
        kind: 'project',
        keywords,
      };
    }
    case 'TASK': {
      if (hit.projectId === null) return null;
      return {
        id: `task-${hit.id}`,
        label: hit.title,
        href: routes.projects.allProjects
          .detail(String(hit.projectId))
          .tasks.detail(String(hit.id)).href,
        kind: 'task',
        keywords,
      };
    }
    case 'ISSUE': {
      return {
        id: `issue-${hit.id}`,
        label: hit.title,
        href: routes.projects.allIssues,
        kind: 'issue',
        keywords,
      };
    }
    default: {
      return null;
    }
  }
}

/**
 * Alt+Space quick navigation over pages, projects, tasks and issues.
 *
 * Records are found by asking the server, not by downloading them. The palette used to be seeded
 * with whole collections of projects, tasks and issues, which it then filtered in the browser, so
 * it could only find what had already been transferred and it transferred the lot on every route.
 * It now sends the typed term to one search endpoint and renders what comes back.
 *
 * Everything that fetches lives in {@link CommandPaletteBody}, which is mounted only while the
 * dialog is open, so a session that never presses Alt+Space never issues a request at all.
 */
export function CommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      if (!event.altKey) return;
      const target = event.target as HTMLElement | null;
      const isTypingContext =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (isTypingContext) return;

      event.preventDefault();
      setOpen((prev) => !prev);
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <CommandDialog
      description="Search pages, projects, tasks and issues"
      onOpenChange={setOpen}
      open={open}
      // The rows on screen are already the answer: records were matched by the server and pages
      // here, then ranked together. cmdk's own filter would run a second, different match over
      // that result, against the live input rather than the debounced term, and hide server hits
      // that are in the list precisely because they matched.
      shouldFilter={false}
      showCloseButton={false}
      title="Quick Navigation"
    >
      {open && <CommandPaletteBody onClose={() => setOpen(false)} />}
    </CommandDialog>
  );
}

/**
 * The palette's contents, including every query it runs.
 *
 * Kept a separate component so that mounting it is what starts the fetching, and so that a closed
 * palette costs nothing.
 *
 * Records come from the server and pages are matched here. That split is deliberate: the nav
 * routes are a fixed list the bundle already holds, so matching them locally is instant and free,
 * while records are unbounded and belong in a query. Both feed one ranked list, because the user
 * typed one thing and wants one answer.
 */
function CommandPaletteBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');

  // The input updates on every keystroke so typing stays responsive; only the term that reaches
  // the server waits for a pause. Core's useSearch expects an already-debounced term and stays
  // disabled below the minimum length, so a one-character box issues nothing.
  const debouncedQuery = useDebounce(query, 250);
  const { data: hits = [], isFetching } = useSearch(debouncedQuery);

  const routeEntries = React.useMemo(() => getStaticRouteEntries(), []);

  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;
  const isBelowSearchLength =
    isSearching && trimmed.length < SEARCH_MIN_TERM_LENGTH;

  const recordEntries = React.useMemo<SearchEntry[]>(() => {
    const entries: SearchEntry[] = [];
    for (const hit of hits) {
      const entry = toSearchEntry(hit);
      if (entry) entries.push(entry);
    }
    return entries;
  }, [hits]);

  const topMatches = React.useMemo(() => {
    if (!isSearching) return [];
    const q = trimmed.toLowerCase();
    const rank = (entry: SearchEntry) => {
      if (entry.label.toLowerCase().startsWith(q)) return 0;
      if (entry.keywords.includes(q)) return 1;
      return 2;
    };

    // Pages are filtered here. Records are not: the server already decided they match, and while
    // the debounced term trails the input they can legitimately fail a substring test against what
    // has been typed since. Filtering them again would blink results out mid-keystroke.
    const pages = routeEntries
      .filter((page) => page.keywords.includes(q))
      .map<SearchEntry>((page) => ({
        id: `page-${page.id}`,
        label: page.label,
        href: page.href,
        kind: 'page',
        keywords: page.keywords,
        section: page.section,
      }));

    const merged = [...recordEntries, ...pages];
    merged.sort((a, b) => {
      const rankDiff = rank(a) - rank(b);
      if (rankDiff !== 0) return rankDiff;
      return a.label.localeCompare(b.label);
    });
    return merged.slice(0, 50);
  }, [isSearching, trimmed, recordEntries, routeEntries]);

  const onSelect = (href: string) => {
    onClose();
    setQuery('');
    router.push(href);
  };

  return (
    <>
      <CommandInput
        onValueChange={setQuery}
        placeholder="Search pages, projects, tasks, issues..."
        value={query}
      />
      <CommandList>
        <CommandEmpty>
          {isBelowSearchLength
            ? `Type at least ${SEARCH_MIN_TERM_LENGTH} characters to search.`
            : isFetching
              ? 'Searching...'
              : 'No results found.'}
        </CommandEmpty>

        {isSearching ? (
          <CommandGroup heading="Top Matches">
            {topMatches.map((entry) => (
              <CommandItem
                key={entry.id}
                keywords={[entry.keywords]}
                onSelect={() => onSelect(entry.href)}
                value={`${entry.kind}-${entry.label}-${entry.href}`}
              >
                {entry.kind === 'project' && <FolderKanban />}
                {entry.kind === 'task' && <ListTodo />}
                {entry.kind === 'issue' && <Bug />}
                {entry.kind === 'page' && <SearchIcon />}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate">{entry.label}</span>
                  {entry.section && (
                    <span className="text-muted-foreground hidden truncate text-xs md:inline">
                      {entry.section}
                    </span>
                  )}
                </div>
                <CommandShortcut>
                  {entry.kind === 'project' && 'Project'}
                  {entry.kind === 'task' && 'Task'}
                  {entry.kind === 'issue' && 'Issue'}
                  {entry.kind === 'page' && 'Page'}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <CommandGroup heading="Pages">
            {routeEntries.slice(0, 3).map((entry) => (
              <CommandItem
                key={entry.id}
                keywords={[entry.keywords]}
                onSelect={() => onSelect(entry.href)}
                value={entry.id}
              >
                <SearchIcon />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate">{entry.label}</span>
                  <span className="text-muted-foreground hidden truncate text-xs md:inline">
                    {entry.section}
                  </span>
                </div>
                <CommandShortcut>Alt + Space</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </>
  );
}
