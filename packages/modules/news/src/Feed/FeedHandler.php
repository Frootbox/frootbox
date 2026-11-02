<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Feed;

use Frootbox\Core\Http\Exception\HttpException;
use Frootbox\Core\Http\SiteUrl;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\StreamFactoryInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class FeedHandler implements RequestHandlerInterface
{
    public function __construct(
        private Feed $feed,
        private SiteUrl $site,
        private ResponseFactoryInterface $responses,
        private StreamFactoryInterface $streams,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $page = $request->getAttribute('page');
        $language = $request->getAttribute('language');

        if (!\is_string($page) || !\is_string($language) || !$this->feed->has($page, $language)) {
            throw HttpException::notFound($request->getUri()->getPath());
        }

        return $this->responses->createResponse()
            ->withHeader('Content-Type', 'application/rss+xml; charset=utf-8')
            ->withHeader('Cache-Control', 'public, max-age=300')
            ->withBody($this->streams->createStream($this->feed->xml($page, $language, $this->site->base($request))));
    }
}
