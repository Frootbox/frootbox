<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Jobs\JobsHandler;
use Frootbox\Backend\Http\Settings\SettingsHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Tests\Fixtures\Notes\QueueNote;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * The screens for settings and jobs (decision 0221).
 */
#[CoversClass(SettingsHandler::class)]
#[CoversClass(JobsHandler::class)]
final class SettingsScreenTest extends BackendTestCase
{
    public function testAdminsChangeSettingsAndSecrets(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        $html = $this->html($this->request('GET', '/cms/settings', session: $session));
        self::assertStringContainsString('href="/cms/settings" aria-current="page"', $html);
        self::assertStringContainsString('<code class="fb-muted">acme/notes</code>', $html);
        self::assertStringContainsString('name="values.sender"', $html);
        self::assertMatchesRegularExpression('~type="number" value="20"[^>]*name="values.perPage"[^>]*min="1" max="100"~', $html);
        self::assertStringContainsString('<fb-form action="settings.set-secret"', $html);
        self::assertStringContainsString('Not stored', $html);

        $this->action('settings.update', ['package' => 'acme/notes', 'values' => ['sender' => 'team@example.org', 'footer' => '']], $session);
        $this->action('settings.set-secret', ['package' => 'acme/notes', 'name' => 'apiKey', 'value' => 'sk-123'], $session);

        $html = $this->html($this->request('GET', '/cms/settings', session: $session));
        self::assertStringContainsString('value="team@example.org"', $html);
        self::assertStringNotContainsString('sk-123', $html);
        self::assertStringContainsString('commandfor="secret-remove"', $html);

        // Admins do not see the jobs, they belong to superusers.
        self::assertStringNotContainsString('href="/cms/jobs"', $html);
        self::assertSame(403, $this->request('GET', '/cms/jobs', session: $session)->getStatusCode());
    }

    public function testTheCardAboutMailShowsHowMailsGoOutAndSendsATestMail(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        $html = $this->html($this->request('GET', '/cms/settings', session: $session));
        self::assertStringContainsString('<code class="fb-muted">frootbox/core.mail</code>', $html, 'A card of its own (decision 0269).');
        self::assertStringContainsString('id="settings-frootbox-core-mail"', $html);
        self::assertStringContainsString('Mails go to the log and reach nobody', $html, 'In development nothing leaves.');
        self::assertStringContainsString('name="values.host"', $html);
        self::assertStringContainsString('<fb-form action="mail.test"', $html);

        $sent = $this->action('mail.test', ['to' => null], $session)['data'] ?? null;
        self::assertIsArray($sent);
        self::assertSame(['log', 'default'], [$sent['transport'] ?? null, $sent['source'] ?? null]);
    }

    public function testSuperusersSeeTheJobsAndTheWarningWithoutCron(): void
    {
        $this->createUser('root@example.org', ['superuser']);
        $session = $this->signIn('root@example.org');

        $empty = $this->html($this->request('GET', '/cms/jobs', session: $session));
        self::assertStringContainsString('No jobs waiting', $empty);
        self::assertStringNotContainsString('Cron does not run', $this->html($this->request('GET', '/cms', session: $session)));

        $this->runner()->run(new QueueNote(1), Context::system());

        $dashboard = $this->html($this->request('GET', '/cms', session: $session));
        self::assertStringContainsString('Cron does not run', $dashboard);
        self::assertStringContainsString('/bin/frootbox schedule:run</code>', $dashboard);
        self::assertStringContainsString('href="/cms/jobs"', $dashboard);

        $jobs = $this->html($this->request('GET', '/cms/jobs', session: $session));
        self::assertStringContainsString('Sends a note', $jobs);
        self::assertStringContainsString('<fb-form action="system.job-retry"', $jobs);
        self::assertStringContainsString('commandfor="job-delete"', $jobs);
    }
}
