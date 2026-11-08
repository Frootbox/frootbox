<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\AccountHandler;
use Frootbox\Backend\Http\EmailChangeHandler;
use Frootbox\Backend\Http\InvitationHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Account\AcceptInvitation;
use Frootbox\Core\Account\ConfirmEmailChange;
use Frootbox\Core\Account\EmailChanges;
use Frootbox\Core\Account\PasswordResets;
use Frootbox\Core\Account\RequestEmailChange;
use Frootbox\Core\Account\ShowEmailChange;
use Frootbox\Core\Account\ShowInvitation;
use Frootbox\Core\Account\UpdateAccount;
use Frootbox\Core\Action\Context;
use Frootbox\Core\User\CreateUser;
use Frootbox\Core\User\InviteUser;
use Frootbox\Core\User\Users;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Name and email in the own account (decision 0341) and invitations by
 * mail (decision 0342).
 */
#[CoversClass(AccountHandler::class)]
#[CoversClass(EmailChangeHandler::class)]
#[CoversClass(InvitationHandler::class)]
#[CoversClass(UpdateAccount::class)]
#[CoversClass(RequestEmailChange::class)]
#[CoversClass(ConfirmEmailChange::class)]
#[CoversClass(ShowEmailChange::class)]
#[CoversClass(EmailChanges::class)]
#[CoversClass(InviteUser::class)]
#[CoversClass(AcceptInvitation::class)]
#[CoversClass(ShowInvitation::class)]
#[CoversClass(PasswordResets::class)]
#[CoversClass(CreateUser::class)]
final class AccountMailTest extends BackendTestCase
{
    private const string SITE = 'https://www.bohnenglueck.example';

    public function testChangesTheOwnName(): void
    {
        $id = $this->createUser('jane@example.org', ['editor']);
        $session = $this->signIn('jane@example.org');

        $page = $this->html($this->request('GET', '/cms/account', session: $session));
        self::assertStringContainsString('Name und E-Mail', $page);

        $this->action('account.update', ['name' => 'Jane Bohne'], $session);
        self::assertSame('Jane Bohne', $this->get(Users::class)->getById($id)->name);

        $empty = $this->action('account.update', ['name' => '   '], $session, 422);
        self::assertStringContainsString('/name', json_encode($empty, \JSON_THROW_ON_ERROR));
    }

    public function testANewEmailHoldsOnceTheLinkIsUsed(): void
    {
        $id = $this->createUser('jane@example.org', ['editor']);
        $this->createUser('taken@example.org', ['editor']);
        $session = $this->signIn('jane@example.org');

        $wrong = $this->action('account.request-email-change', ['email' => 'jane@bohne.example', 'password' => 'falsch'], $session, 422);
        self::assertStringContainsString('/password', json_encode($wrong, \JSON_THROW_ON_ERROR));
        $this->action('account.request-email-change', ['email' => 'Taken@example.org', 'password' => self::PASSWORD], $session, 422);
        $this->action('account.request-email-change', ['email' => 'jane@example.org', 'password' => self::PASSWORD], $session, 422);
        self::assertSame([], $this->mails());

        $answer = $this->action('account.request-email-change', ['email' => 'Jane@Bohne.example', 'password' => self::PASSWORD], $session);
        self::assertSame(['email' => 'jane@bohne.example', 'pending' => true], $answer['data'] ?? null);
        self::assertSame('jane@example.org', $this->get(Users::class)->getById($id)->email, 'Nothing changes before the link.');

        $mails = $this->mails();
        self::assertCount(2, $mails);
        // The queue keeps no order within a second.
        usort($mails, static fn(array $a, array $b): int => ['jane@example.org'] === $a['to'] ? 1 : -1);
        self::assertSame(['jane@bohne.example'], $mails[0]['to']);
        self::assertSame('Bestätige Deine neue E-Mail für Bohnenglück', $mails[0]['subject']);
        self::assertSame(['jane@example.org'], $mails[1]['to'], 'The old address hears about it.');
        self::assertStringContainsString('jane@bohne.example', $mails[1]['text']);
        self::assertSame(1, preg_match('#\n' . preg_quote(self::SITE, '#') . '(/cms/email/[^\s]+)\n#', $mails[0]['text'], $link));

        $shown = $this->request('GET', $link[1]);
        self::assertSame(200, $shown->getStatusCode());
        self::assertStringContainsString('Ab jetzt meldest Du Dich mit jane@bohne.example an.', $this->html($shown));
        self::assertSame('jane@example.org', $this->get(Users::class)->getById($id)->email, 'Opening the link changes nothing.');

        // On another device, without signing in there.
        $confirmed = $this->request('POST', $link[1]);
        self::assertSame(303, $confirmed->getStatusCode(), $this->html($confirmed));
        self::assertSame('/cms/login?email=jane%40bohne.example&changed=email', $confirmed->getHeaderLine('Location'));
        self::assertSame('jane@bohne.example', $this->get(Users::class)->getById($id)->email);
        self::assertStringContainsString('Deine E-Mail ist geändert.', $this->html($this->request('GET', $confirmed->getHeaderLine('Location'))));
        self::assertSame(200, $this->request('GET', '/cms', session: $session)->getStatusCode(), 'Sessions stay.');

        self::assertSame(404, $this->request('GET', $link[1])->getStatusCode(), 'A link works once.');
        self::assertSame(303, $this->request('POST', '/cms/login', ['email' => 'jane@bohne.example', 'password' => self::PASSWORD])->getStatusCode());
    }

    public function testALinkFailsOnceTheAddressIsTaken(): void
    {
        $id = $this->createUser('jane@example.org', ['editor']);
        $user = $this->get(Users::class)->getById($id);
        $changes = $this->get(EmailChanges::class);
        $token = $changes->token($user, 'new@example.org');

        self::assertSame(404, $this->request('GET', '/cms/email/' . $changes->token($user, 'new@example.org', time() - EmailChanges::HOURS * 3600 - 1))->getStatusCode(), 'Expired.');
        [$userId, $expires, $email, $signature] = explode('.', $token);
        self::assertSame(404, $this->request('GET', '/cms/email/' . $userId . '.' . $expires . '.' . rtrim(base64_encode('evil@example.org'), '=') . '.' . $signature)->getStatusCode(), 'Another address breaks the signature.');

        $this->createUser('new@example.org', ['editor']);
        $taken = $this->request('POST', '/cms/email/' . $token);
        self::assertSame(409, $taken->getStatusCode());
        self::assertStringContainsString('new@example.org gehört inzwischen zu einem anderen Konto.', $this->html($taken));
        self::assertSame('jane@example.org', $this->get(Users::class)->getById($id)->email);
    }

    public function testWithoutMailsTheEmailChangesAtOnce(): void
    {
        $id = $this->createUser('jane@example.org', ['editor']);
        $session = $this->signIn('jane@example.org');

        $answer = $this->action('account.request-email-change', ['email' => 'jane@bohne.example', 'password' => self::PASSWORD], $session);
        self::assertSame(['email' => 'jane@bohne.example', 'pending' => false], $answer['data'] ?? null);
        self::assertSame('jane@bohne.example', $this->get(Users::class)->getById($id)->email);
        self::assertSame([], $this->mails());
    }

    public function testAnInvitedPersonChoosesTheirPassword(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $admin = $this->signIn('admin@example.org');

        $form = $this->html($this->request('GET', '/cms/users/new', session: $admin));
        self::assertStringContainsString('Einladung per Mail', $form);

        $both = $this->action('user.create', ['email' => 'neu@example.org', 'name' => 'Nora Neu', 'password' => 'geheim-und-lang', 'invite' => true], $admin, 422);
        self::assertStringContainsString('/password', json_encode($both, \JSON_THROW_ON_ERROR));

        $created = $this->action('user.create', ['email' => 'neu@example.org', 'name' => 'Nora Neu', 'roles' => ['editor'], 'invite' => true], $admin);
        $data = $created['data'] ?? null;
        self::assertIsArray($data);
        self::assertFalse($data['hasPassword'] ?? null);
        self::assertIsArray($data['user'] ?? null);
        self::assertIsInt($data['user']['id'] ?? null);
        $id = $data['user']['id'];

        $mails = $this->mails();
        self::assertCount(1, $mails);
        self::assertSame(['neu@example.org'], $mails[0]['to']);
        self::assertSame('Einladung zu Bohnenglück', $mails[0]['subject']);
        self::assertStringContainsString('Jane Doe hat Dir ein Konto auf Bohnenglück angelegt.', $mails[0]['text']);
        self::assertSame(1, preg_match('#\n' . preg_quote(self::SITE, '#') . '(/cms/welcome/[^\s]+)\n#', $mails[0]['text'], $link));

        $page = $this->html($this->request('GET', '/cms/users/' . $id, session: $admin));
        self::assertStringContainsString('Noch kein Passwort', $page);
        self::assertStringContainsString('Einladung senden', $page);
        $this->action('user.invite', ['id' => $id], $admin);
        self::assertCount(2, $this->mails(), 'Again while there is no password.');

        $welcome = $this->html($this->request('GET', $link[1]));
        self::assertStringContainsString('Willkommen, Nora Neu', $welcome);
        self::assertStringContainsString('value="neu@example.org" autocomplete="username"', $welcome);

        self::assertSame(422, $this->request('POST', $link[1], ['password' => 'kurz'])->getStatusCode());
        $saved = $this->request('POST', $link[1], ['password' => 'neue-bohne-2026']);
        self::assertSame(303, $saved->getStatusCode(), $this->html($saved));
        self::assertSame('/cms', $saved->getHeaderLine('Location'));
        self::assertStringStartsWith('frootbox_session=', $saved->getHeaderLine('Set-Cookie'));

        self::assertSame(404, $this->request('GET', $link[1])->getStatusCode(), 'Void once a password is set.');
        self::assertStringNotContainsString('Einladung senden', $this->html($this->request('GET', '/cms/users/' . $id, session: $admin)));
        $again = $this->action('user.invite', ['id' => $id], $admin, 422);
        self::assertStringContainsString('hat schon ein Passwort', json_encode($again, \JSON_THROW_ON_ERROR | \JSON_UNESCAPED_UNICODE));
    }

    public function testInvitationsNeedMailsAndAnEditorMayNotInvite(): void
    {
        $id = $this->runner()->run(new CreateUser('neu@example.org', 'Nora Neu'), Context::system())->user->id;
        $this->createUser('editor@example.org', ['editor']);
        $editor = $this->signIn('editor@example.org');

        $this->action('user.invite', ['id' => $id], $editor, 403);

        $token = $this->get(PasswordResets::class)->invitationToken($this->get(Users::class)->getById($id), time() - PasswordResets::INVITATION_DAYS * 86400 - 1);
        $expired = $this->request('GET', '/cms/welcome/' . $token);
        self::assertSame(404, $expired->getStatusCode());
        self::assertStringContainsString('Diese Einladung gilt nicht mehr.', $this->html($expired));
        self::assertSame(404, $this->request('GET', '/cms/password/' . $this->get(PasswordResets::class)->invitationToken($this->get(Users::class)->getById($id)))->getStatusCode(), 'An invitation is no link for a new password.');
    }

    protected function config(): array
    {
        $url = 'testWithoutMailsTheEmailChangesAtOnce' === $this->name() ? [] : ['url' => self::SITE];

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

        foreach ($this->connection()->fetchFirstColumn('SELECT input FROM jobs WHERE name = ? ORDER BY id', ['mail.send']) as $input) {
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
