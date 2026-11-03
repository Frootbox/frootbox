<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Backend;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Language\Languages;
use Frootbox\People\Location\ListLocations;
use Frootbox\People\Person\ShowPerson;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * A new person or one to edit (decision 0226): name, ways to reach and
 * locations, texts by language, publishing and deleting.
 */
final readonly class PersonHandler implements RequestHandlerInterface
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
            $space = $request->getQueryParams()['space'] ?? null;

            return $this->view->render($request, '@frootbox/people/backend/person-new.twig', [
                'language' => $this->languages->default(),
                'space' => \is_string($space) && '' !== $space ? $space : null,
            ]);
        }

        $details = $this->runner->ask(new ShowPerson($id));
        $chosen = $request->getQueryParams()['language'] ?? null;
        $language = \is_string($chosen) && $this->languages->has($chosen) ? $this->languages->get($chosen) : $this->languages->default();
        $data = $details->current();

        return $this->view->render($request, '@frootbox/people/backend/person.twig', [
            'person' => $details,
            'data' => $data,
            'language' => $language,
            'languages' => $this->languages->all(),
            'translation' => $data->translations[$language->code] ?? null,
            'image' => $this->images->of($data->image),
            'locations' => $this->runner->ask(new ListLocations()),
        ]);
    }
}
