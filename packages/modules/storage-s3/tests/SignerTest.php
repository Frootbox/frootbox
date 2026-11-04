<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\StorageS3\Tests;

use DateTimeImmutable;
use Frootbox\StorageS3\Signer;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The examples of AWS for Signature Version 4 with S3.
 *
 * @internal
 */
#[CoversClass(Signer::class)]
final class SignerTest extends TestCase
{
    /**
     * @return iterable<string, array{string, string, array<string, string>, array<string, string>, string, string}>
     */
    public static function examples(): iterable
    {
        yield 'GET Object' => ['GET', '/test.txt', [], ['range' => 'bytes=0-9'], Signer::EMPTY_HASH, 'f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41'];
        yield 'PUT Object' => ['PUT', '/' . Signer::encodePath('test$file.text'), [], ['date' => 'Fri, 24 May 2013 00:00:00 GMT', 'x-amz-storage-class' => 'REDUCED_REDUNDANCY'], hash('sha256', 'Welcome to Amazon S3.'), '98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd'];
        yield 'GET Bucket Lifecycle' => ['GET', '/', ['lifecycle' => ''], [], Signer::EMPTY_HASH, 'fea454ca298b7da1c68078a5d1bdbfbbe0d65c699e0f91ac7a200a0136783543'];
        yield 'GET Bucket (List Objects)' => ['GET', '/', ['max-keys' => '2', 'prefix' => 'J'], [], Signer::EMPTY_HASH, '34b48302e7b5fa45bde8084f4b7868a86f0a534bc59db6670ed5711ef69dc6f7'];
    }

    /**
     * @param array<string, string> $query
     * @param array<string, string> $headers
     */
    #[DataProvider('examples')]
    public function testSignsLikeAws(string $method, string $path, array $query, array $headers, string $hash, string $signature): void
    {
        $signer = new Signer('AKIAIOSFODNN7EXAMPLE', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', 'us-east-1');
        $signed = $signer->sign($method, 'examplebucket.s3.amazonaws.com', $path, $query, $headers, $hash, new DateTimeImmutable('2013-05-24T00:00:00Z'));

        self::assertStringEndsWith('Signature=' . $signature, $signed['authorization']);
        self::assertStringStartsWith('AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, ', $signed['authorization']);
        self::assertSame('20130524T000000Z', $signed['x-amz-date']);
    }

    public function testEncodesEachPartOfAKey(): void
    {
        self::assertSame('media/01J/k%C3%B6ln%20hafen.jpg', Signer::encodePath('media/01J/köln hafen.jpg'));
        self::assertSame('a=1&b=x%2Fy&list-type=2', Signer::query(['list-type' => '2', 'b' => 'x/y', 'a' => '1']));
    }
}
