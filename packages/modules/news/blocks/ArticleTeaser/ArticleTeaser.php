<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Blocks;

use Frootbox\Core\Component\BlockContext;
use Frootbox\Core\Component\BlockController;
use Frootbox\Core\Url\BasePages;
use Frootbox\Core\Url\Target;
use Frootbox\Core\Url\Urls;
use Frootbox\News\Article\ArticleRendering;
use Frootbox\News\Article\ArticleView;
use Frootbox\News\Article\PublishedArticles;
use Frootbox\News\ArticlePages;

/**
 * The newest articles, e.g. on the start page, with a link to all.
 */
final readonly class ArticleTeaser implements BlockController
{
    public function __construct(
        private PublishedArticles $articles,
        private ArticleRendering $rendering,
        private BasePages $bases,
        private Urls $urls,
    ) {}

    public function data(BlockContext $context): array
    {
        $language = $context->contentLanguage;
        $count = max(1, min(12, is_numeric($context->options['count'] ?? null) ? (int) $context->options['count'] : 3));
        $base = $this->bases->of([ArticlePages::LIST_BLOCK])[$context->language] ?? null;

        return [
            'articles' => array_map(fn(ArticleView $article): array => $this->rendering->teaser($article, $context->language, false !== ($context->options['images'] ?? true)), $this->articles->list($language, null, null, $count)),
            'all' => null === $base ? null : $this->urls->href(Target::page($base), $context->language),
        ];
    }
}
