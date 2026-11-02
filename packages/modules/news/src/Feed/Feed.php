<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Feed;

use DateTimeInterface;
use Frootbox\Core\Config\Config;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\Page\PageReader;
use Frootbox\Core\Url\BasePages;
use Frootbox\Core\Url\Target;
use Frootbox\Core\Url\Urls;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\PublishedArticles;
use Frootbox\News\ArticlePages;
use Frootbox\News\NewsSettings;
use Frootbox\RichText\Html;

/**
 * The RSS feed of the newest articles, one per language below the first
 * page with the list (decision 0219).
 */
final readonly class Feed
{
    public const string ROUTE = '/_news/feed/{page:[0-7][0-9A-HJKMNP-TV-Z]{25}}/{language:[a-z]{2,3}(?:-[A-Za-z0-9]{1,8})*}.xml';

    public function __construct(
        private BasePages $bases,
        private PublishedArticles $articles,
        private PageReader $pages,
        private Urls $urls,
        private Languages $languages,
        private Config $config,
        private NewsSettings $settings,
    ) {}

    /**
     * The address of the feed of a page, null if it is not the main page of the news there.
     */
    public function url(string $pageId, string $language): ?string
    {
        return $this->has($pageId, $language) ? '/_news/feed/' . $pageId . '/' . $language . '.xml' : null;
    }

    public function has(string $pageId, string $language): bool
    {
        return $this->languages->has($language) && ($this->bases->of([ArticlePages::LIST_BLOCK])[$language] ?? null) === $pageId;
    }

    /**
     * The title of the feed: the title of the page and the website.
     */
    public function title(string $pageId, string $language): string
    {
        $translations = $this->pages->published($pageId)->translations ?? [];
        $title = null;

        foreach ($this->languages->contentLanguages($language) as $code) {
            $title ??= $translations[$code]->title ?? null;
        }

        return implode(' – ', array_filter([$title, $this->config->string('app.name', '')], static fn(?string $part): bool => null !== $part && '' !== $part));
    }

    /**
     * RSS 2.0 of the newest articles; addresses are full URLs.
     */
    public function xml(string $pageId, string $language, ?string $site): string
    {
        $link = $this->urls->absolute(Target::page($pageId), $language, $site) ?? '';
        $items = '';

        foreach ($this->articles->list($language, null, null, $this->settings->feedItems) as $article) {
            $url = $this->urls->absolute(ArticleStore::target($article->id), $language, $site) ?? $link;
            $items .= '<item>'
                . self::element('title', $article->title)
                . self::element('link', $url)
                . '<guid isPermaLink="true">' . Html::escape($url) . '</guid>'
                . self::element('pubDate', $article->date->format(DateTimeInterface::RSS))
                . ('' === $article->teaser ? '' : self::element('description', $article->teaser))
                . '</item>';
        }

        return '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
            . '<rss version="2.0"><channel>'
            . self::element('title', $this->title($pageId, $language))
            . self::element('link', $link)
            . self::element('description', $this->title($pageId, $language))
            . self::element('language', $language)
            . $items
            . '</channel></rss>' . "\n";
    }

    private static function element(string $name, string $text): string
    {
        return '<' . $name . '>' . htmlspecialchars($text, \ENT_XML1 | \ENT_QUOTES | \ENT_SUBSTITUTE, 'UTF-8') . '</' . $name . '>';
    }
}
