<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Tags;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Language;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Tag\ListTags;
use Frootbox\Core\Tag\TagSummary;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The common stock of tags (decisions 0233, 0239): each tag with its
 * labels and how often it is used, to rename, mark as internal, merge
 * and delete in dialogs.
 */
final readonly class TagsHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'tag.update';

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

        $search = $request->getQueryParams()['q'] ?? '';
        $search = \is_string($search) ? mb_substr(trim($search), 0, 60) : '';
        $codes = array_map(static fn(Language $language): string => $language->code, $this->languages->all());
        $all = $this->runner->ask(new ListTags());
        $tags = '' === $search ? $all : $this->runner->ask(new ListTags($search));

        return $this->view->render($request, '@backend/tags/list.twig', [
            'search' => $search,
            'tags' => array_map(fn(TagSummary $tag): array => $this->row($tag, $codes), $tags),
            'total' => \count($all),
            'targets' => array_map(static fn(TagSummary $tag): array => ['value' => $tag->id, 'label' => self::title($tag, $codes)], $all),
            'languages' => $this->languages->all(),
        ]);
    }

    /**
     * @param list<string> $codes
     *
     * @return array<string, mixed>
     */
    private function row(TagSummary $tag, array $codes): array
    {
        $fill = ['id' => $tag->id, 'internal' => $tag->internal];

        foreach ($codes as $code) {
            $fill['labels.' . $code] = $tag->labels[$code] ?? '';
        }

        return [
            'id' => $tag->id,
            'title' => self::title($tag, $codes),
            'key' => $tag->key,
            // The labels in the other languages, after the one in the title.
            'others' => \array_slice(array_values(array_filter(array_map(static fn(string $code): ?string => $tag->labels[$code] ?? null, $codes), static fn(?string $label): bool => null !== $label)), 1),
            'missing' => array_values(array_filter($codes, static fn(string $code): bool => !isset($tag->labels[$code]))),
            'internal' => $tag->internal,
            'preset' => $tag->preset,
            'count' => $tag->count,
            'fill' => $fill,
        ];
    }

    /**
     * @param list<string> $codes
     */
    private static function title(TagSummary $tag, array $codes): string
    {
        foreach ($codes as $code) {
            if (isset($tag->labels[$code])) {
                return $tag->labels[$code];
            }
        }

        return $tag->key;
    }
}
