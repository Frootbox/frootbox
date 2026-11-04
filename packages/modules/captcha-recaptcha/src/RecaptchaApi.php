<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\CaptchaRecaptcha;

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Asks Google whether a token of reCAPTCHA is good (decision 0262). The
 * address of the visitor is not sent: Google does not need it.
 */
final readonly class RecaptchaApi
{
    public const string VERIFY = 'https://www.google.com/recaptcha/api/siteverify';

    private HttpClientInterface $client;

    public function __construct(?HttpClientInterface $client = null)
    {
        $this->client = $client ?? HttpClient::create(['timeout' => 10, 'max_redirects' => 0]);
    }

    /**
     * The answer of Google, null if it cannot be reached or reads otherwise.
     *
     * @return array<mixed>|null
     */
    public function verify(string $secret, string $token): ?array
    {
        try {
            $response = $this->client->request('POST', self::VERIFY, ['body' => ['secret' => $secret, 'response' => $token]]);
            $data = json_decode($response->getContent(), true);
        } catch (ExceptionInterface) {
            return null;
        }

        return \is_array($data) && \is_bool($data['success'] ?? null) ? $data : null;
    }
}
