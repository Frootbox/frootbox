<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Workbench\Tests;

use Frootbox\Workbench\Config;
use Frootbox\Workbench\SignIn\SignInTickets;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(SignInTickets::class)]
final class SignInTicketsTest extends TestCase
{
    private string $root = '';

    protected function setUp(): void
    {
        $this->root = Folder::create();
        Folder::write($this->root . '/workbench.yaml', "domain: fb.localhost\nroots: [.]\n");
    }

    protected function tearDown(): void
    {
        Folder::remove($this->root);
    }

    public function testATicketWorksOnceForItsProject(): void
    {
        $tickets = $this->tickets();
        $ticket = $tickets->create('demo');

        self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $ticket);
        self::assertFalse($tickets->redeem('other', $ticket), 'Not for another project.');
        self::assertFalse($tickets->redeem('demo', $ticket), 'The wrong project used it up.');

        $ticket = $tickets->create('demo');
        self::assertTrue($tickets->redeem('demo', $ticket));
        self::assertFalse($tickets->redeem('demo', $ticket), 'Only once.');
    }

    public function testTheFolderKeepsOnlyTheHash(): void
    {
        $ticket = $this->tickets()->create('demo');
        $files = glob($this->root . '/var/workbench/sign-in/*');

        self::assertSame([$this->root . '/var/workbench/sign-in/' . hash('sha256', $ticket)], $files);
        self::assertStringNotContainsString($ticket, (string) file_get_contents($files[0]));
    }

    public function testATicketExpires(): void
    {
        $tickets = $this->tickets();
        $ticket = $tickets->create('demo', 1000);

        self::assertFalse($tickets->redeem('demo', $ticket, 1000 + SignInTickets::SECONDS));

        $old = $tickets->create('demo', 1000);
        $tickets->create('demo', 1000 + SignInTickets::SECONDS);
        self::assertFalse($tickets->redeem('demo', $old, 1001), 'Creating a ticket clears expired ones.');
    }

    public function testRejectsWhatIsNoTicket(): void
    {
        $tickets = $this->tickets();
        $tickets->create('demo');

        self::assertFalse($tickets->redeem('demo', ''));
        self::assertFalse($tickets->redeem('demo', '../../workbench.yaml'));
        self::assertFalse($tickets->redeem('demo', str_repeat('a', 64)));
    }

    public function testKnowsAddressesOfThisComputer(): void
    {
        self::assertTrue(SignInTickets::isLocal('127.0.0.1'));
        self::assertTrue(SignInTickets::isLocal('::1'));
        self::assertTrue(SignInTickets::isLocal('::ffff:127.0.0.1'));
        self::assertFalse(SignInTickets::isLocal('192.168.1.20'));
        self::assertFalse(SignInTickets::isLocal(null));
    }

    private function tickets(): SignInTickets
    {
        return new SignInTickets(Config::load($this->root));
    }
}
