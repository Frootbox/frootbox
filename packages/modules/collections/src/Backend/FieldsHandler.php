<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Backend;

use Frootbox\Backend\View\BackendView;
use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Collections\Field\FieldKind;
use Frootbox\Collections\Field\FieldSummary;
use Frootbox\Collections\Field\ListFields;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Plugin\ListSpaces;
use Frootbox\Core\Plugin\Space;
use Frootbox\Database\EntityNotFoundException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The fields of a collection (decision 0250): adding and editing in a
 * dialog in the chosen language, moving and removing.
 */
final readonly class FieldsHandler implements RequestHandlerInterface
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

        $params = $request->getQueryParams();
        $chosen = \is_string($params['space'] ?? null) ? $params['space'] : Space::DEFAULT;
        $spaces = $this->runner->ask(new ListSpaces(EntryStore::TYPE, 'frootbox/collections/entry.list'))->items;
        $space = array_values(array_filter($spaces, static fn($item): bool => $item->id === $chosen))[0] ?? null;

        if (null === $space) {
            throw new EntityNotFoundException('There is no such collection.');
        }

        $language = \is_string($params['language'] ?? null) && $this->languages->has($params['language']) ? $this->languages->get($params['language']) : $this->languages->default();
        $code = $language->code;
        $default = $this->languages->default()->code;

        return $this->view->render($request, '@frootbox/collections/backend/collection-fields.twig', [
            'space' => $space,
            'language' => $language,
            'languages' => $this->languages->all(),
            'first' => $this->languages->default(),
            'kinds' => array_map(static fn(FieldKind $kind): array => ['value' => $kind->value, 'label' => $kind->title()], FieldKind::cases()),
            'fields' => array_map(static fn(FieldSummary $field): array => [
                'name' => $field->name,
                'kind' => $field->kind,
                'label' => $field->labels[$code] ?? '',
                'fallback' => $field->labels[$default] ?? $field->name,
                'unit' => $field->unit,
                'options' => \count($field->options),
                'used' => $field->used,
                'fill' => [
                    'name' => $field->name,
                    'kind' => $field->kind->value,
                    'labels.' . $code => $field->labels[$code] ?? '',
                    'options.' . $code => implode("\n", array_map(static fn(array $option): string => $option['labels'][$code] ?? '', $field->options)),
                    'unit' => $field->unit,
                    'decimals' => $field->decimals,
                ],
            ], $this->runner->ask(new ListFields($space->id))),
        ]);
    }
}
