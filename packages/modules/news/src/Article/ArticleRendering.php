<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeInterface;
use Frootbox\Core\Category\Category;
use Frootbox\Core\Field\Field;
use Frootbox\Core\Field\FieldTypes;
use Frootbox\Core\Tag\ObjectTags;
use Frootbox\Core\Url\Urls;
use IntlDateFormatter;
use Twig\Markup;

/**
 * An article as the views of the blocks and the feed use it: texts,
 * the address, the date for people and the image as HTML.
 */
final readonly class ArticleRendering
{
    /** The image of a teaser: three columns on wide screens. */
    public const string TEASER_SIZES = '(min-width: 72rem) 24rem, (min-width: 40rem) 50vw, 100vw';

    /** The image above the text of an article. */
    public const string DETAIL_SIZES = '(min-width: 72rem) 48rem, 100vw';

    public function __construct(
        private FieldTypes $types,
        private Urls $urls,
        private ObjectTags $tags,
    ) {}

    /**
     * @return array{id: string, target: string, title: string, teaser: string, url: string|null, date: string, dateText: string, image: Markup|string, categories: list<array{id: string, title: string, slug: string}>, tags: list<array{key: string, label: string, slug: string}>}
     */
    public function teaser(ArticleView $article, string $language, bool $image = true): array
    {
        return [
            'id' => $article->id,
            // For object_field() and object_value() (decision 0240).
            'target' => ArticleStore::target($article->id),
            'title' => $article->title,
            'teaser' => $article->teaser,
            'url' => $this->url($article, $language),
            'date' => $article->date->format(DateTimeInterface::ATOM),
            'dateText' => self::date($article->date, $language),
            'image' => $image ? $this->image($article, '3:2', self::TEASER_SIZES, false) : '',
            'categories' => array_map(static fn(Category $category): array => [
                'id' => $category->id,
                'title' => $category->title($article->language) ?? '',
                'slug' => $category->slug($article->language) ?? '',
            ], $article->categories),
            // Internal ones never (decision 0239).
            'tags' => $this->tags->visible($article->tags, $article->language),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(ArticleView $article, string $language): array
    {
        return [
            ...$this->teaser($article, $language),
            'image' => $this->image($article, null, self::DETAIL_SIZES, true),
            'text' => $this->types->get('richtext')->output($article->text, new Field('text', 'richtext', 'Text')),
        ];
    }

    public function url(ArticleView $article, string $language): ?string
    {
        return $this->urls->href(ArticleStore::target($article->id), $language) ?? $this->urls->href(ArticleStore::target($article->id), $article->language);
    }

    /**
     * The date in the words of the language, e.g. "2. November 2026".
     */
    public static function date(DateTimeInterface $date, string $language): string
    {
        if (class_exists(IntlDateFormatter::class)) {
            $formatted = new IntlDateFormatter($language, IntlDateFormatter::LONG, IntlDateFormatter::NONE, $date->getTimezone())->format($date);

            if (\is_string($formatted)) {
                return $formatted;
            }
        }

        return $date->format('Y-m-d');
    }

    private function image(ArticleView $article, ?string $ratio, string $sizes, bool $eager): Markup|string
    {
        if (null === $article->image) {
            return '';
        }

        $output = $this->types->get('image')->output($article->image, new Field('image', 'image', 'Image', settings: array_filter(['ratio' => $ratio, 'sizes' => $sizes, 'eager' => $eager], static fn(mixed $value): bool => null !== $value)));

        return $output instanceof Markup ? $output : (\is_string($output) ? $output : '');
    }
}
