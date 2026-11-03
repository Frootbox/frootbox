<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Backend;

use Frootbox\Backend\View\BackendView;
use Frootbox\Collections\Entry\EntryData;
use Frootbox\Collections\Entry\ShowEntry;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Media\ShowMedium;
use Frootbox\Database\EntityNotFoundException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * A new entry or one to edit (decisions 0220, 0246): text by language,
 * image, position, categories, tags and further fields in the draft;
 * publishing, times, offline and deleting each run their own action.
 */
final readonly class EntryHandler implements RequestHandlerInterface
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
        if (!\is_string($id)) {
            $space = $request->getQueryParams()['space'] ?? null;

            return $this->view->render($request, '@frootbox/collections/backend/entry-new.twig', [
                'language' => $this->languages->default(),
                'space' => \is_string($space) && '' !== $space ? $space : null,
            ]);
        }

        $details = $this->runner->ask(new ShowEntry($id));
        $chosen = $request->getQueryParams()['language'] ?? null;
        $language = \is_string($chosen) && $this->languages->has($chosen) ? $this->languages->get($chosen) : $this->languages->default();
        $data = $details->current();
        $default = $this->languages->default()->code;

        return $this->view->render($request, '@frootbox/collections/backend/entry.twig', [
            'entry' => $details,
            'data' => $data,
            'title' => $this->title($data, $language->code, $default),
            'language' => $language,
            'languages' => $this->languages->all(),
            'translation' => $data->translations[$language->code] ?? null,
            'source' => $data->text($default),
            'image' => $this->image($data),
        ]);
    }

    private function title(EntryData $data, string $language, string $default): string
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
     * The preview and file name of the image, null without one or if it
     * is gone or may not be seen.
     *
     * @return array{preview: string, file: string}|null
     */
    private function image(EntryData $data): ?array
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
