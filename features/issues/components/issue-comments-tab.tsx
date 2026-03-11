'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import type { Issue } from '@/types/issue/issue';
import { useCreateIssueComment } from '@/hooks/issue';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';

interface IssueCommentsTabProps {
  issue: Issue;
}

export function IssueCommentsTab({ issue }: IssueCommentsTabProps) {
  const [commentText, setCommentText] = useState('');

  const createCommentMutation = useCreateIssueComment();
  const { data: currentEmployee } = useCurrentUserEmployee();

  const handleAddComment = async () => {
    if (!commentText.trim() || !issue.id) return;
    try {
      await createCommentMutation.mutateAsync({
        issueId: issue.id,
        data: {
          comment: commentText.trim(),
          author: currentEmployee,
          createdAt: new Date(),
        },
      });
      setCommentText('');
    } catch {
      // error toast shown by mutation hook
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const comments = issue.comments || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
          {comments.length > 0 && (
            <Badge variant="outline" className="ml-1">
              {comments.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Discussion and updates about this issue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0 px-6 pb-6">
        {/* Comment list */}
        {comments.length > 0 ? (
          <div className="mb-6 space-y-1">
            {comments.map((comment, index) => {
              const isLast = index === comments.length - 1;
              return (
                <div key={comment.id ?? index} className="flex gap-3">
                  {/* Avatar + thread line */}
                  <div className="flex flex-col items-center">
                    {comment.author ? (
                      <EmployeeAvatar
                        employee={comment.author}
                        size="sm"
                        className="!size-8"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          ?
                        </span>
                      </div>
                    )}
                    {!isLast && (
                      <div className="mt-1 w-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    )}
                  </div>

                  {/* Comment body */}
                  <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="flex items-center justify-between rounded-t-lg border-b border-zinc-200 bg-zinc-100 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/60">
                        <div className="flex items-center gap-2">
                          {comment.author ? (
                            <Link
                              href={`/users/dashboard/workforce/employees/${comment.author.id}`}
                              className="text-sm font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                            >
                              {comment.author.name}
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              Unknown
                            </span>
                          )}
                          <span className="text-zinc-400">·</span>
                          <span
                            className="text-xs text-zinc-500 dark:text-zinc-400"
                            title={format(
                              comment.createdAt,
                              'MMM d, yyyy HH:mm'
                            )}
                          >
                            {formatDistanceToNow(comment.createdAt, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                          {comment.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
            <MessageSquare className="mx-auto mb-3 h-9 w-9 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No comments yet
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Be the first to leave a comment
            </p>
          </div>
        )}

        {/* Comment composer */}
        <div className="flex gap-3">
          {currentEmployee ? (
            <EmployeeAvatar
              employee={currentEmployee}
              size="sm"
              className="mt-0.5 !size-8"
            />
          ) : (
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                ?
              </span>
            </div>
          )}
          <div className="flex flex-1 flex-col gap-2">
            {currentEmployee?.name && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Commenting as{' '}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {currentEmployee.name}
                </span>
              </p>
            )}
            <Textarea
              placeholder="Leave a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="resize-none"
              disabled={createCommentMutation.isPending}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                <kbd className="rounded border border-zinc-300 px-1 py-0.5 font-mono text-[10px] dark:border-zinc-700">
                  Ctrl
                </kbd>
                {' + '}
                <kbd className="rounded border border-zinc-300 px-1 py-0.5 font-mono text-[10px] dark:border-zinc-700">
                  Enter
                </kbd>
                {' to submit'}
              </span>
              <div className="flex items-center gap-2">
                {commentText.trim() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCommentText('')}
                    disabled={createCommentMutation.isPending}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={
                    !commentText.trim() || createCommentMutation.isPending
                  }
                >
                  {createCommentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Posting…
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-3.5 w-3.5" />
                      Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
