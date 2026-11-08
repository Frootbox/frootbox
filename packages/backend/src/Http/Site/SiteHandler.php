<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Site;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Component\FieldSummary;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Media\ShowMedium;
use Frootbox\Core\Site\ListSiteVersions;
use Frootbox\Core\Site\ShowSite;
use Frootbox\Database\EntityNotFoundException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The screen "Fields of the website" (decision 0348): their state,
 * the values by language through site.update and earlier versions.
 * A language other than the first may leave a field empty; then the
 * value of the first language shows.
 */
final readonly class SiteHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'site.show';

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

        try {
            $versions = $this->runner->ask(new ListSiteVersions());
        } catch (AccessDeniedException) {
            $versions = null;
        }

        $site = $this->runner->ask(new ShowSite());
        $chosen = $request->getQueryParams()['language'] ?? null;
        $language = \is_string($chosen) && $this->languages->has($chosen) ? $this->languages->get($chosen) : $this->languages->default();
        $first = $this->languages->default();
        $own = $site->own[$language->code] ?? [];
        $fallback = $language->code === $first->code ? [] : $site->values[$first->code] ?? [];

        return $this->view->render($request, '@backend/site.twig', [
            'site' => $site,
            'versions' => $versions,
            'language' => $language,
            'languages' => $this->languages->all(),
            'first' => $first,
            'fields' => array_map(fn(FieldSummary $field): array => $this->field($field, $own[$field->name] ?? null, $fallback[$field->name] ?? null), $site->fields),
            // The editing mode on the start page of the language.
            'website' => null === $language->domain ? $language->path('') : $first->path(''),
        ]);
    }

    /**
     * A field as @backend/fields/input.twig takes it, with the value of
     * the first language for a language without its own.
     *
     * @return array<string, mixed>
     */
    private function field(FieldSummary $field, mixed $value, mixed $fallback): array
    {
        return [
            'name' => $field->name,
            'type' => $field->type,
            'label' => $field->label,
            'description' => $field->description,
            'optional' => $field->optional,
            'settings' => $field->settings,
            'value' => $value,
            'fallback' => $fallback,
            // Text fields show it as their placeholder.
            'fallbackText' => \is_string($fallback) ? $fallback : null,
            'entries' => 'list' === $field->type ? \count(\is_array($value ?? $fallback) ? $value ?? $fallback : []) : null,
            'image' => \in_array($field->type, ['image', 'file'], true) && \is_array($value) && \is_string($value['media'] ?? null) ? $this->medium($value['media']) : null,
        ];
    }

    /**
     * @return array{preview: string, file: string}|null
     */
    private function medium(string $id): ?array
    {
        try {
            $medium = $this->runner->ask(new ShowMedium($id));
        } catch (AccessDeniedException|EntityNotFoundException) {
            return null;
        }

        return ['preview' => $medium->preview, 'file' => $medium->fileName];
    }
}
