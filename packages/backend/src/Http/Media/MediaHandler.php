<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Media;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Media\FolderSummary;
use Frootbox\Core\Media\ListMedia;
use Frootbox\Core\Media\ListMediaFolders;
use Frootbox\Core\Media\ListMediumUsages;
use Frootbox\Core\Media\ShowMedium;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The media library: folders, the media of one folder or a search, and
 * the details of one medium (decision 0126).
 *
 *     /cms/media?folder=01J…&q=hafen&tag=team&unused=1&changed=1&ai=1&page=2
 *     /cms/media/01J…       the details, with the same filters
 */
final readonly class MediaHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'media.list';

    /** The value of ?folder= for media outside of folders. */
    public const string TOP = 'top';

    private const int PER_PAGE = 48;

    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Languages $languages,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $query = $request->getQueryParams();
        $folder = self::text($query['folder'] ?? null);
        $search = self::text($query['q'] ?? null);
        $tag = self::text($query['tag'] ?? null);
        $unused = null !== self::text($query['unused'] ?? null);
        $changed = null !== self::text($query['changed'] ?? null);
        $ai = null !== self::text($query['ai'] ?? null);
        $page = max(1, (int) self::text($query['page'] ?? null));
        $folders = $this->runner->ask(new ListMediaFolders());
        $folderIds = array_map(static fn(FolderSummary $summary): string => $summary->id, $folders);

        if (null !== $folder && self::TOP !== $folder && !\in_array($folder, $folderIds, true)) {
            $folder = null;
        }

        $id = $request->getAttribute('id');
        $medium = \is_string($id) ? $this->runner->ask(new ShowMedium($id)) : null;
        $usages = null === $medium ? [] : $this->runner->ask(new ListMediumUsages($medium->id));
        $list = $this->runner->ask(new ListMedia(
            folderId: null === $folder ? null : (self::TOP === $folder ? '' : $folder),
            tag: $tag,
            search: $search,
            unused: $unused,
            changed: $changed,
            ai: $ai,
            page: $page,
            perPage: self::PER_PAGE,
        ));

        $filters = array_filter(['folder' => $folder, 'q' => $search, 'tag' => $tag, 'unused' => $unused ? '1' : null, 'changed' => $changed ? '1' : null, 'ai' => $ai ? '1' : null], static fn(?string $value): bool => null !== $value);

        return $this->view->render($request, '@backend/media/list.twig', [
            'folders' => self::tree($folders),
            'folder' => $folder,
            'current' => array_find($folders, static fn(FolderSummary $summary): bool => $summary->id === $folder),
            'search' => $search ?? '',
            'tag' => $tag ?? '',
            'unused' => $unused,
            'changed' => $changed,
            'ai' => $ai,
            'list' => $list,
            'pages' => max(1, (int) ceil($list->total / self::PER_PAGE)),
            'filters' => $filters,
            'query' => [] === $filters ? '' : '?' . http_build_query($filters),
            'medium' => $medium,
            'usages' => $usages,
            'languages' => $this->languages->all(),
        ]);
    }

    /**
     * The folders in the order of the tree, each with its depth and its
     * name indented for a select, e.g. "– – Summer".
     *
     * @param list<FolderSummary> $folders
     *
     * @return list<array{folder: FolderSummary, depth: int, indented: string}>
     */
    private static function tree(array $folders, ?string $parent = null, int $depth = 0): array
    {
        $rows = [];

        foreach ($folders as $folder) {
            if ($folder->parentId === $parent) {
                $rows[] = ['folder' => $folder, 'depth' => $depth, 'indented' => str_repeat('– ', $depth) . $folder->name];
                array_push($rows, ...self::tree($folders, $folder->id, $depth + 1));
            }
        }

        return $rows;
    }

    private static function text(mixed $value): ?string
    {
        return \is_string($value) && '' !== trim($value) ? trim($value) : null;
    }
}
