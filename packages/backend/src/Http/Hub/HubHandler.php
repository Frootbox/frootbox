<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http\Hub;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Auth\Oidc\IdentityInfo;
use Frootbox\Core\Auth\Oidc\ListIdentities;
use Frootbox\Core\Hub\Hub;
use Frootbox\Core\Hub\HubLogin;
use Frootbox\Core\Hub\ShowHub;
use Frootbox\Core\Status\ShowStatus;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The connection to the hub, frootbox.de (decision 0284): connect,
 * complete with the code the browser brings back, the switch "status",
 * disconnect, and exactly what the hub sees.
 */
final readonly class HubHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'system.hub-show';

    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $hub = $this->runner->ask(new ShowHub());
        $query = $request->getQueryParams();
        $code = \is_string($query['code'] ?? null) ? $query['code'] : null;
        $requestId = \is_string($query['request'] ?? null) ? $query['request'] : null;

        return $this->view->render($request, '@backend/hub/show.twig', [
            'hub' => $hub,
            // "hub.frootbox.de" reads as "frootbox.de" (decision 0288).
            'hubName' => null === $hub->hubUrl ? null : Hub::name($hub->hubUrl),
            // Whether the own account is linked to the hub, for signing in (decision 0322).
            'linked' => \in_array(HubLogin::PROVIDER, array_map(static fn(IdentityInfo $identity): string => $identity->provider, $this->runner->ask(new ListIdentities())), true),
            'oidcError' => \is_string($query['oidc-error'] ?? null) ? mb_substr($query['oidc-error'], 0, 300) : null,
            // The browser came back from the hub with a code for the open request.
            'complete' => 'pending' === $hub->state && null !== $code && $requestId === $hub->requestId ? ['code' => $code, 'request' => $requestId] : null,
            // Exactly what the hub reads, also before connecting.
            'status' => json_decode(json_encode($this->runner->ask(new ShowStatus()), \JSON_THROW_ON_ERROR), true, flags: \JSON_THROW_ON_ERROR),
        ]);
    }
}
