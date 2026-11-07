<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Workbench\SignIn;

use Frootbox\Workbench\Config;
use RuntimeException;

/**
 * One-time tickets for signing in to a website of the workbench from its
 * start page (decision 0329). Only the SHA-256 of a ticket is stored, in
 * var/workbench/sign-in/ of the workbench, never in a project.
 */
final readonly class SignInTickets
{
    public const int SECONDS = 60;

    private const string FOLDER = 'sign-in';

    public function __construct(private Config $config) {}

    /**
     * A new ticket for a project, valid once for SECONDS.
     */
    public function create(string $project, ?int $now = null): string
    {
        $now ??= time();
        $this->prune($now);
        $ticket = bin2hex(random_bytes(32));
        $directory = $this->config->var(self::FOLDER);

        if (!is_dir($directory) && !mkdir($directory, 0o700, true) && !is_dir($directory)) {
            throw new RuntimeException(\sprintf('Could not create %s.', $directory));
        }

        $file = $this->file($ticket);
        file_put_contents($file, json_encode(['project' => $project, 'expires' => $now + self::SECONDS], \JSON_THROW_ON_ERROR));
        chmod($file, 0o600);

        return $ticket;
    }

    /**
     * Uses up a ticket. True only once, for the project it was made for
     * and before it expired.
     */
    public function redeem(string $project, string $ticket, ?int $now = null): bool
    {
        if (1 !== preg_match('/^[0-9a-f]{64}$/', $ticket)) {
            return false;
        }

        $file = $this->file($ticket);
        $taken = $file . '.' . bin2hex(random_bytes(6));

        // Renaming is atomic: of two requests with one ticket only one wins.
        if (!is_file($file) || !@rename($file, $taken)) {
            return false;
        }

        $data = json_decode((string) file_get_contents($taken), true);
        unlink($taken);

        return \is_array($data)
            && ($data['project'] ?? null) === $project
            && \is_int($data['expires'] ?? null)
            && $data['expires'] > ($now ?? time());
    }

    /**
     * Whether a request comes from this computer, not from the network.
     */
    public static function isLocal(?string $address): bool
    {
        return \in_array($address, ['127.0.0.1', '::1', '::ffff:127.0.0.1'], true);
    }

    private function prune(int $now): void
    {
        $files = glob($this->config->var(self::FOLDER) . '/*');

        foreach (false === $files ? [] : $files as $file) {
            $data = json_decode((string) @file_get_contents($file), true);
            $expires = \is_array($data) && \is_int($data['expires'] ?? null) ? $data['expires'] : 0;

            if ($expires <= $now) {
                @unlink($file);
            }
        }
    }

    private function file(string $ticket): string
    {
        return $this->config->var(self::FOLDER . '/' . hash('sha256', $ticket));
    }
}
