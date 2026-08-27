'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bug, FolderKanban, ListTodo, SearchIcon } from 'lucide-react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useTasks } from '@tornotron/echno-core/task/hooks';
import { useIssues } from '@tornotron/echno-core/issue/hooks';
import { navigation, publicRoutes, type NavItem } from '@/config/nav.config';
import { routes } from '@/nav';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  CommandSeparator,
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

type PaletteEntry = {
  id: string;
  name: string;
  href: string;
};

type SearchEntry = {
  id: string;
  label: string;
  href: string;
  kind: 'project' | 'task' | 'issue' | 'page';
  keywords: string;
  section?: string;
};

/**
 * Alt+Space quick navigation over pages, projects, tasks and issues.
 *
 * The palette owns its own data rather than taking it as props from the application shell. The
 * shell renders on every route and the palette is open on almost none of them, so fetching there
 * meant three whole collections crossed the wire on every navigation to feed a dialog nobody had
 * opened. Everything that fetches lives in {@link CommandPaletteBody}, which is mounted only while
 * the dialog is open, so a session that never presses Alt+Space never issues the requests at all.
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
 * Kept a separate component so that mounting it is what starts the fetching. React Query holds the
 * results, so reopening the palette within the cache window costs nothing.
 */
function CommandPaletteBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');

  const { data: projectRows = [] } = useProjects();
  const { data: taskRows = [] } = useTasks();
  const { data: issueRows = [] } = useIssues();

  const projects = React.useMemo<PaletteEntry[]>(
    () =>
      projectRows
        .filter((project) => Boolean(project.id))
        .map((project) => ({
          id: String(project.id),
          name: project.projectName,
          href: routes.projects.allProjects.detail(String(project.id)).href,
        })),
    [projectRows]
  );

  const tasks = React.useMemo<PaletteEntry[]>(
    () =>
      taskRows
        .filter((task) => Boolean(task.id) && Boolean(task.projectId))
        .map((task) => ({
          id: String(task.id),
          name: task.title,
          href: routes.projects.allProjects
            .detail(String(task.projectId))
            .tasks.detail(String(task.id)).href,
        })),
    [taskRows]
  );

  const issues = React.useMemo<PaletteEntry[]>(
    () =>
      issueRows
        .filter((issue) => Boolean(issue.id))
        .map((issue) => ({
          id: String(issue.id),
          name: issue.title,
          href: routes.projects.allIssues,
        })),
    [issueRows]
  );

  const routeEntries = React.useMemo(() => getStaticRouteEntries(), []);
  const isSearching = query.trim().length > 0;
  const visibleProjects = isSearching ? projects : projects.slice(0, 3);
  const visibleTasks = isSearching ? tasks : tasks.slice(0, 3);
  const visibleIssues = isSearching ? issues : issues.slice(0, 3);
  const visibleRoutes = isSearching ? routeEntries : routeEntries.slice(0, 3);

  const searchEntries = React.useMemo<SearchEntry[]>(() => {
    const entries: SearchEntry[] = [];
    for (const project of projects) {
      entries.push({
        id: `project-${project.id}`,
        label: project.name,
        href: project.href,
        kind: 'project',
        keywords: `${project.name} ${project.href}`.toLowerCase(),
      });
    }
    for (const task of tasks) {
      entries.push({
        id: `task-${task.id}`,
        label: task.name,
        href: task.href,
        kind: 'task',
        keywords: `${task.name} ${task.href}`.toLowerCase(),
      });
    }
    for (const issue of issues) {
      entries.push({
        id: `issue-${issue.id}`,
        label: issue.name,
        href: issue.href,
        kind: 'issue',
        keywords: `${issue.name} ${issue.href}`.toLowerCase(),
      });
    }
    for (const page of routeEntries) {
      entries.push({
        id: `page-${page.id}`,
        label: page.label,
        href: page.href,
        kind: 'page',
        keywords: page.keywords,
        section: page.section,
      });
    }
    return entries;
  }, [projects, tasks, issues, routeEntries]);

  const topMatches = React.useMemo(() => {
    if (!isSearching) return [];
    const q = query.trim().toLowerCase();
    const rank = (entry: SearchEntry) => {
      if (entry.label.toLowerCase().startsWith(q)) return 0;
      if (entry.keywords.includes(q)) return 1;
      return 2;
    };
    const filtered = searchEntries.filter((entry) =>
      entry.keywords.includes(q)
    );
    filtered.sort((a, b) => {
      const rankDiff = rank(a) - rank(b);
      if (rankDiff !== 0) return rankDiff;
      return a.label.localeCompare(b.label);
    });
    return filtered.slice(0, 50);
  }, [isSearching, query, searchEntries]);

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
        <CommandEmpty>No results found.</CommandEmpty>

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
          <>
            {visibleProjects.length > 0 && (
              <>
                <CommandGroup heading="Projects">
                  {visibleProjects.map((project) => (
                    <CommandItem
                      key={project.id}
                      keywords={[
                        project.name.toLowerCase(),
                        project.href.toLowerCase(),
                      ]}
                      onSelect={() => onSelect(project.href)}
                      value={`project-${project.name}-${project.href}`}
                    >
                      <FolderKanban />
                      <span className="truncate">{project.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {visibleTasks.length > 0 && (
              <>
                <CommandGroup heading="Tasks">
                  {visibleTasks.map((task) => (
                    <CommandItem
                      key={task.id}
                      keywords={[
                        task.name.toLowerCase(),
                        task.href.toLowerCase(),
                      ]}
                      onSelect={() => onSelect(task.href)}
                      value={`task-${task.name}-${task.href}`}
                    >
                      <ListTodo />
                      <span className="truncate">{task.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {visibleIssues.length > 0 && (
              <>
                <CommandGroup heading="Issues">
                  {visibleIssues.map((issue) => (
                    <CommandItem
                      key={issue.id}
                      keywords={[
                        issue.name.toLowerCase(),
                        issue.href.toLowerCase(),
                      ]}
                      onSelect={() => onSelect(issue.href)}
                      value={`issue-${issue.name}-${issue.href}`}
                    >
                      <Bug />
                      <span className="truncate">{issue.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup heading="Pages">
              {visibleRoutes.map((entry) => (
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
          </>
        )}
      </CommandList>
    </>
  );
}
