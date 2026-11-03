<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Blocks;

use Frootbox\Core\Component\BlockContext;
use Frootbox\Core\Component\BlockController;
use Frootbox\Core\Plugin\PluginPages;
use Frootbox\Core\Tag\ObjectTags;
use Frootbox\Core\Url\Target;
use Frootbox\Core\Url\Urls;
use Frootbox\News\Article\ArticleRendering;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\ArticleView;
use Frootbox\News\Article\PublishedArticles;

/**
 * The newest articles, e.g. on the start page, with a link to all: of
 * all spaces or of one (decision 0232), optionally only those with a tag
 * (decision 0239). Articles link to their address
 * below the page of their space.
 */
final readonly class ArticleTeaser implements BlockController
{
    public function __construct(
        private PublishedArticles $articles,
        private ArticleRendering $rendering,
        private PluginPages $plugins,
        private Urls $urls,
        private ObjectTags $tags,
    ) {}

    public function data(BlockContext $context): array
    {
        $language = $context->contentLanguage;
        $count = max(1, min(12, is_numeric($context->options['count'] ?? null) ? (int) $context->options['count'] : 3));
        $space = \is_string($context->options['space'] ?? null) && '' !== $context->options['space'] ? $context->options['space'] : null;
        $key = \is_string($context->options['tag'] ?? null) && '' !== $context->options['tag'] ? $context->options['tag'] : null;
        // A tag deleted since then shows no articles rather than all.
        $tag = null === $key ? null : $this->tags->byKey($key)->id ?? '';
        $base = null === $space ? $this->plugins->main(ArticleStore::TYPE) : $this->plugins->of(ArticleStore::TYPE, $space);

        return [
            'articles' => array_map(fn(ArticleView $article): array => $this->rendering->teaser($article, $context->language, false !== ($context->options['images'] ?? true)), $this->articles->list($language, null, null, $count, spaces: null === $space ? null : [$space], tag: $tag)),
            'all' => null === $base ? null : $this->urls->href(Target::page($base), $context->language),
        ];
    }
}
