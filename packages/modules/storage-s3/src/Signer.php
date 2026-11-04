<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\StorageS3;

use DateTimeImmutable;
use DateTimeZone;
use SensitiveParameter;

/**
 * Signs requests to S3 after AWS Signature Version 4, which every
 * S3-compatible service takes (decision 0268). The body is always hashed,
 * some services do not take UNSIGNED-PAYLOAD.
 */
final readonly class Signer
{
    public const string EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    public function __construct(
        private string $key,
        #[SensitiveParameter]
        private string $secret,
        private string $region,
    ) {}

    /**
     * The headers to send: the given ones with host, x-amz-date,
     * x-amz-content-sha256 and authorization.
     *
     * @param string                $path    Already encoded, e.g. "/bucket/media/01J…"
     * @param array<string, string> $query   Not encoded
     * @param array<string, string> $headers
     *
     * @return array<string, string>
     */
    public function sign(string $method, string $host, string $path, array $query, array $headers, string $payloadHash, ?DateTimeImmutable $now = null): array
    {
        $now = ($now ?? new DateTimeImmutable())->setTimezone(new DateTimeZone('UTC'));
        $date = $now->format('Ymd');
        $time = $now->format('Ymd\THis\Z');
        $headers = array_change_key_case($headers, \CASE_LOWER);
        $headers['host'] = $host;
        $headers['x-amz-date'] = $time;
        $headers['x-amz-content-sha256'] = $payloadHash;
        ksort($headers, \SORT_STRING);

        $canonicalHeaders = '';

        foreach ($headers as $name => $value) {
            $canonicalHeaders .= $name . ':' . trim((string) preg_replace('/\s+/', ' ', $value)) . "\n";
        }

        $signed = implode(';', array_keys($headers));
        $request = implode("\n", [$method, $path, self::query($query), $canonicalHeaders, $signed, $payloadHash]);
        $scope = $date . '/' . $this->region . '/s3/aws4_request';
        $toSign = implode("\n", ['AWS4-HMAC-SHA256', $time, $scope, hash('sha256', $request)]);

        $signingKey = hash_hmac('sha256', 'aws4_request', hash_hmac('sha256', 's3', hash_hmac('sha256', $this->region, hash_hmac('sha256', $date, 'AWS4' . $this->secret, true), true), true), true);
        $headers['authorization'] = \sprintf(
            'AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s',
            $this->key,
            $scope,
            $signed,
            hash_hmac('sha256', $toSign, $signingKey),
        );

        return $headers;
    }

    /**
     * A key as part of the path: each part encoded, slashes kept.
     */
    public static function encodePath(string $path): string
    {
        return implode('/', array_map(rawurlencode(...), explode('/', $path)));
    }

    /**
     * @param array<string, string> $query
     */
    public static function query(array $query): string
    {
        ksort($query, \SORT_STRING);
        $parts = [];

        foreach ($query as $name => $value) {
            $parts[] = rawurlencode($name) . '=' . rawurlencode($value);
        }

        return implode('&', $parts);
    }
}
