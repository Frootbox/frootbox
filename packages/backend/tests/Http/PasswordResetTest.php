<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\LoginHandler;
use Frootbox\Backend\Http\PasswordHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Account\PasswordResets;
use Frootbox\Core\Account\RequestPasswordReset;
use Frootbox\Core\Account\ResetPassword;
use Frootbox\Core\Account\ShowPasswordReset;
use Frootbox\Core\Auth\SignInThrottle;
use Frootbox\Core\User\Users;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(PasswordHandler::class)]
#[CoversClass(LoginHandler::class)]
#[CoversClass(PasswordResets::class)]
#[CoversClass(RequestPasswordReset::class)]
#[CoversClass(ResetPassword::class)]
#[CoversClass(ShowPasswordReset::class)]
#[CoversClass(SignInThrottle::class)]
final class PasswordResetTest extends BackendTestCase
{
    private const string SITE = 'https://www.bohnenglueck.example';

    public function testSomeoneLockedOutSetsANewPasswordAndIsSignedIn(): void
    {
        $this->createUser('jane@example.org', ['editor']);
        $old = $this->signIn('jane@example.org');

        for ($i = 0; $i < 6; ++$i) {
            $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => 'falsch']);
        }
        self::assertSame(429, $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => self::PASSWORD])->getStatusCode());

        $login = $this->html($this->request('GET', '/cms/login'));
        self::assertStringContainsString('href="/cms/password">Passwort vergessen?</a>', $login);

        $sent = $this->request('POST', '/cms/password', ['email' => 'Jane@Example.org ']);
        self::assertSame(200, $sent->getStatusCode());
        self::assertStringContainsString('Wenn es ein Konto mit Jane@Example.org gibt, ist eine Mail mit einem Link unterwegs. Der Link gilt 60 Minuten.', $this->html($sent));

        $mails = $this->mails();
        self::assertCount(1, $mails);
        self::assertSame(['jane@example.org'], $mails[0]['to']);
        self::assertSame('Neues Passwort für Bohnenglück', $mails[0]['subject']);
        self::assertStringStartsWith("Hallo Jane Doe,\n\njemand hat für Dein Konto auf Bohnenglück ein neues Passwort angefordert.", $mails[0]['text']);
        // From app.url, not from the host of the request.
        self::assertSame(1, preg_match('#\n(' . preg_quote(self::SITE, '#') . '/cms/password/([^\s]+))\n#', $mails[0]['text'], $link));
        $path = '/cms/password/' . $link[2];

        $form = $this->html($this->request('GET', $path));
        self::assertStringContainsString('Wähl ein neues Passwort für jane@example.org.', $form);
        self::assertStringContainsString('autocomplete="new-password"', $form);

        $short = $this->request('POST', $path, ['password' => 'kurz']);
        self::assertSame(422, $short->getStatusCode());
        self::assertStringContainsString('Das Passwort braucht mindestens 10 Zeichen.', $this->html($short));

        $saved = $this->request('POST', $path, ['password' => 'neue-bohne-2026']);
        self::assertSame(303, $saved->getStatusCode(), $this->html($saved));
        self::assertSame('/cms', $saved->getHeaderLine('Location'));
        self::assertStringStartsWith('frootbox_session=', $saved->getHeaderLine('Set-Cookie'), 'Signed in despite the failures before.');

        self::assertSame(303, $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => 'neue-bohne-2026'])->getStatusCode());
        self::assertSame(422, $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => self::PASSWORD])->getStatusCode());
        self::assertSame(302, $this->request('GET', '/cms', session: $old)->getStatusCode(), 'The old session ended.');

        $used = $this->request('GET', $path);
        self::assertSame(404, $used->getStatusCode());
        self::assertStringContainsString('Dieser Link gilt nicht mehr.', $this->html($used));
        self::assertSame(404, $this->request('POST', $path, ['password' => 'noch-eine-bohne'])->getStatusCode(), 'A link works once.');
    }

    public function testTheAnswerIsTheSameWithoutAMail(): void
    {
        $id = $this->createUser('jane@example.org', ['editor']);
        $this->connection()->update(Users::TABLE, ['active' => 0], ['id' => $id]);

        foreach (['nobody@example.org', 'jane@example.org'] as $email) {
            $response = $this->request('POST', '/cms/password', ['email' => $email]);
            self::assertSame(200, $response->getStatusCode());
            self::assertStringContainsString('ist eine Mail mit einem Link unterwegs', $this->html($response));
        }

        self::assertSame([], $this->mails(), 'No mail for unknown addresses and locked accounts.');

        $invalid = $this->request('POST', '/cms/password', ['email' => 'keine-adresse']);
        self::assertSame(422, $invalid->getStatusCode());
        self::assertStringContainsString('Gib eine gültige E-Mail an.', $this->html($invalid));
    }

    public function testMailsAndRequestsAreLimited(): void
    {
        $this->createUser('jane@example.org', ['editor']);

        for ($i = 0; $i < 4; ++$i) {
            self::assertSame(200, $this->request('POST', '/cms/password', ['email' => 'jane@example.org'])->getStatusCode());
        }
        self::assertCount(3, $this->mails(), 'At most three mails to one inbox.');

        for ($i = 0; $i < 6; ++$i) {
            $this->request('POST', '/cms/password', ['email' => 'other' . $i . '@example.org']);
        }
        $waiting = $this->request('POST', '/cms/password', ['email' => 'jane@example.org']);
        self::assertSame(429, $waiting->getStatusCode());
        self::assertStringContainsString('Zu viele Anfragen. Versuch es in 15 Minuten noch einmal.', $this->html($waiting));
        self::assertSame(200, $this->request('POST', '/cms/password', ['email' => 'jane@example.org'], address: '198.51.100.9')->getStatusCode(), 'Another address may ask.');

        self::assertSame(303, $this->request('POST', '/cms/login', ['email' => 'jane@example.org', 'password' => self::PASSWORD])->getStatusCode(), 'Asking for links does not lock the sign-in.');
    }

    public function testExpiredAndForgedLinksFail(): void
    {
        $id = $this->createUser('jane@example.org', ['editor']);
        $user = $this->get(Users::class)->getById($id);
        $resets = $this->get(PasswordResets::class);

        $expired = $resets->token($user, time() - PasswordResets::MINUTES * 60 - 1);
        self::assertSame(404, $this->request('GET', '/cms/password/' . $expired)->getStatusCode());

        [$userId, $expires, $signature] = explode('.', $resets->token($user));
        self::assertSame(404, $this->request('GET', '/cms/password/' . $userId . '.' . ((int) $expires + 3600) . '.' . $signature)->getStatusCode(), 'A later expiry breaks the signature.');
        self::assertSame(200, $this->request('GET', '/cms/password/' . $userId . '.' . $expires . '.' . $signature)->getStatusCode());

        $this->connection()->update(Users::TABLE, ['email' => 'jane.doe@example.org'], ['id' => $id]);
        self::assertSame(404, $this->request('GET', '/cms/password/' . $userId . '.' . $expires . '.' . $signature)->getStatusCode(), 'A new email voids the link.');
    }

    public function testWithoutAppUrlThereIsNoLink(): void
    {
        $this->createUser('jane@example.org', ['editor']);

        self::assertStringNotContainsString('Passwort vergessen?', $this->html($this->request('GET', '/cms/login')));
        self::assertStringContainsString('Diese Website verschickt keine Links für ein vergessenes Passwort.', $this->html($this->request('GET', '/cms/password')));

        $response = $this->request('POST', '/cms/password', ['email' => 'jane@example.org']);
        self::assertSame(422, $response->getStatusCode());
        self::assertSame([], $this->mails());
    }

    protected function config(): array
    {
        $url = 'testWithoutAppUrlThereIsNoLink' === $this->name() ? [] : ['url' => self::SITE];

        return ['backend' => ['language' => 'de'], 'app' => ['name' => 'Bohnenglück', ...$url]];
    }

    /**
     * The mails waiting in the queue.
     *
     * @return list<array{to: list<string>, subject: string, text: string}>
     */
    private function mails(): array
    {
        $mails = [];

        foreach ($this->connection()->fetchFirstColumn('SELECT input FROM jobs WHERE name = ? ORDER BY created_at', ['mail.send']) as $input) {
            $mail = json_decode(\is_string($input) ? $input : '', true, flags: \JSON_THROW_ON_ERROR);
            self::assertIsArray($mail);
            self::assertIsArray($mail['to'] ?? null);
            self::assertIsString($mail['subject'] ?? null);
            self::assertIsString($mail['text'] ?? null);
            $mails[] = ['to' => array_values(array_filter($mail['to'], \is_string(...))), 'subject' => $mail['subject'], 'text' => $mail['text']];
        }

        return $mails;
    }
}
