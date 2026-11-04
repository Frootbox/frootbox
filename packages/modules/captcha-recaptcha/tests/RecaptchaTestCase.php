<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\CaptchaRecaptcha\Tests;

use Frootbox\CaptchaRecaptcha\RecaptchaApi;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PageHandler;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Settings\SetSecret;
use Frootbox\Core\Settings\UpdateSettings;
use Frootbox\Core\Tests\Support\FixtureSite;
use Frootbox\Core\Tests\Support\NotesTestCase;
use Frootbox\Forms\Captcha\Proofs;
use Frootbox\Forms\Entry\Entries;
use Frootbox\Forms\Form\AddField;
use Frootbox\Forms\Form\CreateForm;
use Frootbox\Forms\Form\FieldType;
use Frootbox\Forms\Form\PublishForm;
use Frootbox\Forms\Form\UpdateForm;
use Frootbox\Forms\Website\FormToken;
use Frootbox\Forms\Website\Sendings;
use Frootbox\Forms\Website\SubmitForm;
use Frootbox\Forms\Website\SubmitResult;
use Nyholm\Psr7\ServerRequest;
use Symfony\Component\HttpClient\Exception\TransportException;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

/**
 * A website with the forms and reCAPTCHA, whose siteverify answers from
 * here: nothing goes to Google.
 */
abstract class RecaptchaTestCase extends NotesTestCase
{
    public const string ROOT = __DIR__ . '/..';

    /** @var array<mixed>|null The answer of siteverify, null when Google is down */
    protected ?array $answer = ['success' => true];

    /** @var list<array<string, string>> The bodies sent to siteverify */
    private array $sent = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->container->set(RecaptchaApi::class, new RecaptchaApi(new MockHttpClient(function (string $method, string $url, array $options): MockResponse {
            self::assertSame(['POST', RecaptchaApi::VERIFY], [$method, $url]);
            parse_str(\is_string($options['body'] ?? null) ? $options['body'] : '', $body);
            /** @var array<string, string> $body */
            $this->sent[] = $body;

            if (null === $this->answer) {
                throw new TransportException('Google is down.');
            }

            return new MockResponse((string) json_encode($this->answer));
        })));
    }

    /**
     * The bodies sent to siteverify so far.
     *
     * @return list<array<string, string>>
     */
    protected function sent(): array
    {
        return $this->sent;
    }

    protected function tables(): array
    {
        return [Entries::TABLE, Sendings::TABLE, Proofs::TABLE];
    }

    protected function environment(): Environment
    {
        return Environment::Production;
    }

    protected function extensions(): Extensions
    {
        $forms = ExtensionPackage::fromManifest('frootbox/forms', (string) realpath(self::ROOT . '/../forms'), psr4: ['Frootbox\Forms\\' => ['src/'], 'Frootbox\Forms\Migrations\\' => ['migrations/']]);
        $recaptcha = ExtensionPackage::fromManifest('frootbox/captcha-recaptcha', (string) realpath(self::ROOT), psr4: ['Frootbox\CaptchaRecaptcha\\' => ['src/']]);

        return new Extensions([...FixtureSite::extensions('base', 'site')->packages, $forms, $recaptcha], 'captcha-recaptcha');
    }

    protected function config(): array
    {
        return [
            'app' => ['name' => 'Testsite', 'url' => 'https://example.org'],
            'theme' => 'acme/site',
            'languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']],
        ];
    }

    /**
     * Sets the keys and the version as an admin does in the settings.
     */
    protected function keys(string $version = 'v2'): void
    {
        $this->runner()->run(new UpdateSettings('frootbox/captcha-recaptcha', ['version' => $version, 'siteKey' => 'site-key']));
        $this->runner()->run(new SetSecret('frootbox/captcha-recaptcha', 'secretKey', 'secret-key'));
    }

    /**
     * A published form with a name and an email that uses a captcha.
     */
    protected function form(?string $captcha = null): string
    {
        $id = $this->runner()->run(new CreateForm(['de' => ['title' => 'Kontakt']], ['team@example.org']))->id;
        $this->runner()->run(new AddField($id, FieldType::Text, ['de' => ['label' => 'Name']], true));
        $this->runner()->run(new AddField($id, FieldType::Email, ['de' => ['label' => 'E-Mail']], true, key: 'email'));

        if (null !== $captcha) {
            $this->runner()->run(new UpdateForm($id, captcha: $captcha));
        }

        $this->runner()->run(new PublishForm($id));

        return $id;
    }

    /**
     * Sends the form as a guest, as if it was shown a minute ago.
     *
     * @param array<string, string>|null $captcha
     */
    protected function submit(string $id, ?array $captcha = null): SubmitResult
    {
        $token = $this->get(FormToken::class)->issue($id, time() - 60);

        return $this->runner()->run(new SubmitForm($id, ['name' => 'Ada Lovelace', 'email' => 'ada@example.org'], 'de', $token, captcha: $captcha), Context::guest(address: '192.0.2.10'));
    }

    /**
     * The reasons of the entries so far, null for those in the inbox.
     *
     * @return list<string|null>
     */
    protected function reasons(): array
    {
        return array_map(static fn($entry): ?string => $entry->spam, $this->get(Entries::class)->fetch(['order' => ['id' => 'asc']])->all());
    }

    /**
     * The start page with the form, as a guest sees it.
     */
    protected function page(string $form): string
    {
        $content = ['fields' => ['heading' => 'Kontakt'], 'areas' => ['main' => [['block' => 'frootbox/forms/Form', 'options' => ['form' => $form]]]]];
        $page = $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => 'Kontakt', 'content' => $content]]))->id;
        $this->runner()->run(new PublishPages([$page]));

        return (string) $this->get(PageHandler::class)->handle(new ServerRequest('GET', 'https://example.org/'))->getBody();
    }
}
