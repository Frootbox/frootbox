<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Backend;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Media\ShowMedium;
use Frootbox\Database\EntityNotFoundException;
use Frootbox\News\Article\ArticleData;
use Frootbox\News\Article\ShowArticle;
use Frootbox\News\Category\ListCategories;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * A new article or one to edit (decision 0220): text by language, date,
 * image and categories in the draft; publishing, times, offline and
 * deleting each run their own action.
 */
final readonly class ArticleHandler implements RequestHandlerInterface
{
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

        $id = $request->getAttribute('id');
        $categories = $this->categories();

        if (!\is_string($id)) {
            return $this->view->render($request, '@frootbox/news/backend/article-new.twig', [
                'language' => $this->languages->default(),
                'categories' => $categories,
            ]);
        }

        $details = $this->runner->ask(new ShowArticle($id));
        $chosen = $request->getQueryParams()['language'] ?? null;
        $language = \is_string($chosen) && $this->languages->has($chosen) ? $this->languages->get($chosen) : $this->languages->default();
        $data = $details->current();
        $default = $this->languages->default()->code;

        return $this->view->render($request, '@frootbox/news/backend/article.twig', [
            'article' => $details,
            'data' => $data,
            'title' => $this->title($data, $language->code, $default),
            'language' => $language,
            'languages' => $this->languages->all(),
            'translation' => $data->translations[$language->code] ?? null,
            'source' => $data->translations[$default] ?? ([] === $data->translations ? null : array_values($data->translations)[0]),
            'categories' => $categories,
            'image' => $this->image($data),
        ]);
    }

    private function title(ArticleData $data, string $language, string $default): string
    {
        foreach ([$language, $default] as $code) {
            $title = $data->translations[$code]->title ?? '';

            if ('' !== $title) {
                return $title;
            }
        }

        foreach ($data->translations as $text) {
            if ('' !== $text->title) {
                return $text->title;
            }
        }

        return '';
    }

    /**
     * The categories with their title in the first language.
     *
     * @return list<array{id: string, title: string}>
     */
    private function categories(): array
    {
        $default = $this->languages->default()->code;

        $list = [];

        foreach ($this->runner->ask(new ListCategories()) as $category) {
            $titles = array_filter(array_map(static fn(int|string $code): ?string => $category->title((string) $code), array_keys($category->translations)), static fn(?string $title): bool => null !== $title && '' !== $title);
            $list[] = ['id' => $category->id, 'title' => $category->title($default) ?? (array_values($titles)[0] ?? $category->id)];
        }

        return $list;
    }

    /**
     * The preview and file name of the image, null without one or if it
     * is gone or may not be seen.
     *
     * @return array{preview: string, file: string}|null
     */
    private function image(ArticleData $data): ?array
    {
        $media = $data->media();

        if (null === $media) {
            return null;
        }

        try {
            $medium = $this->runner->ask(new ShowMedium($media));
        } catch (AccessDeniedException|EntityNotFoundException) {
            return null;
        }

        return ['preview' => $medium->preview, 'file' => $medium->fileName];
    }
}
