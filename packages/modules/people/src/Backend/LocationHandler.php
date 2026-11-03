<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Backend;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Languages;
use Frootbox\People\Location\ShowLocation;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * A new location or one to edit (decision 0226): address, ways to reach
 * and coordinates, texts by language, publishing and deleting.
 */
final readonly class LocationHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private Languages $languages,
        private ImagePreview $images,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $id = $request->getAttribute('id');

        if (!\is_string($id)) {
            return $this->view->render($request, '@frootbox/people/backend/location-new.twig', [
                'language' => $this->languages->default(),
            ]);
        }

        $details = $this->runner->ask(new ShowLocation($id));
        $chosen = $request->getQueryParams()['language'] ?? null;
        $language = \is_string($chosen) && $this->languages->has($chosen) ? $this->languages->get($chosen) : $this->languages->default();
        $data = $details->current();

        return $this->view->render($request, '@frootbox/people/backend/location.twig', [
            'location' => $details,
            'data' => $data,
            'name' => $data->text($language->code)->name,
            'language' => $language,
            'languages' => $this->languages->all(),
            'translation' => $data->translations[$language->code] ?? null,
            'image' => $this->images->of($data->image),
        ]);
    }
}
