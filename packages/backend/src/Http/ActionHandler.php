<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Http;

use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\ActionException;
use Frootbox\Core\Action\Catalog;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Action\Journal;
use Frootbox\Core\Action\Normalizer;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Action\UnknownActionException;
use Frootbox\Core\Api\JsonResponder;
use Frootbox\Core\Api\RequestInput;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Error\Problem;
use Frootbox\Core\Http\Exception\HttpException;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\Support\Message;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Runs an action for the forms of the backend (decision 0115):
 * POST <backend.path>/actions/user.create with JSON or a form.
 *
 * Like the REST API, but with the session cookie and its CSRF token, and
 * the messages in the language of the backend. The answer is {"data": …},
 * with "entry" for an action that can be undone, the id for action.undo
 * (decision 0176), or application/problem+json with the errors by field.
 */
final readonly class ActionHandler implements RequestHandlerInterface
{
    public function __construct(
        private Catalog $catalog,
        private Runner $runner,
        private Csrf $csrf,
        private BackendView $view,
        private JsonResponder $json,
        private Translator $translator,
        private Environment $environment,
        private Journal $journal,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $this->csrf->verify($request);

        if (null === $this->view->user()) {
            throw new HttpException(401, 'Sign in first.');
        }

        $name = $request->getAttribute('name');
        $name = \is_string($name) ? $name : '';

        if (!$this->catalog->has($name) || !$this->catalog->get($name)->isAction()) {
            throw UnknownActionException::named($name);
        }

        $input = RequestInput::of($request, $this->catalog->get($name));
        unset($input[Csrf::FIELD]);

        try {
            $result = $this->runner->call($name, $input);
        } catch (ActionException $error) {
            return $this->problem($error);
        }

        $entry = $this->journal->lastUndoableEntryId();

        return $this->json->respond(['data' => Normalizer::normalize($result), ...(null === $entry ? [] : ['entry' => $entry])]);
    }

    /**
     * The error of an action as application/problem+json in the language
     * of the backend, with the messages by field.
     */
    public function problem(ActionException $error): ResponseInterface
    {
        $problem = Problem::from($error, $this->environment->isDevelopment());
        $errors = $error instanceof InvalidInputException
            ? array_map(fn(Message $message): string => $this->translate($message), $error->messages)
            : [];
        $detail = $error instanceof InvalidInputException
            ? $this->translator->get('Check the marked fields.')
            : $this->translate($error->template);

        $translated = new Problem($problem->status, $problem->code, $detail, $problem->headers, $errors);
        $response = $this->json->respond($translated->toArray(), $translated->status)
            ->withHeader('Content-Type', 'application/problem+json');

        foreach ($translated->headers as $header => $value) {
            // Bearer tokens are for the REST API, the backend has its sign-in.
            if ('WWW-Authenticate' !== $header) {
                $response = $response->withHeader($header, $value);
            }
        }

        return $response;
    }

    private function translate(Message $message): string
    {
        return $this->translator->get($message->text, $message->parameters);
    }
}
