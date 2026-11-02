<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeImmutable;
use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Query\QueryBuilder;
use Frootbox\Database\Values;
use Frootbox\News\Category\Categories;
use Frootbox\News\Category\Category;

/**
 * The published articles for visitors: lists by language, category and
 * year, newest first, read from the tables.
 */
final readonly class PublishedArticles
{
    public function __construct(
        private Connection $connection,
        private Articles $articles,
        private ArticleTranslations $translations,
        private ArticleCategories $articleCategories,
        private Categories $categories,
    ) {}

    /**
     * @return list<ArticleView>
     */
    public function list(string $language, ?string $category = null, ?int $year = null, int $limit = 10, int $offset = 0): array
    {
        $query = $this->query($language, $category, $year)
            ->select('a.id')
            ->orderBy('a.date', 'DESC')
            ->addOrderBy('a.id', 'DESC')
            ->setMaxResults(max(1, $limit))
            ->setFirstResult(max(0, $offset));
        $ids = array_values(array_filter($query->executeQuery()->fetchFirstColumn(), \is_string(...)));

        return $this->views($ids, $language);
    }

    public function count(string $language, ?string $category = null, ?int $year = null): int
    {
        $count = $this->query($language, $category, $year)->select('COUNT(*)')->executeQuery()->fetchOne();

        return is_numeric($count) ? (int) $count : 0;
    }

    /**
     * The years with articles, newest first.
     *
     * @return list<int>
     */
    public function years(string $language, ?string $category = null): array
    {
        $years = [];

        foreach ($this->query($language, $category, null)->select('a.date')->executeQuery()->fetchFirstColumn() as $date) {
            if (\is_string($date)) {
                $years[(int) substr($date, 0, 4)] = true;
            }
        }

        $years = array_keys($years);
        rsort($years);

        return $years;
    }

    public function find(string $id, string $language): ?ArticleView
    {
        return $this->views([$id], $language)[0] ?? null;
    }

    private function query(string $language, ?string $category, ?int $year): QueryBuilder
    {
        $query = $this->connection->createQueryBuilder()
            ->from(Articles::TABLE, 'a')
            ->innerJoin('a', ArticleTranslations::TABLE, 't', 't.article_id = a.id AND t.language = :language')
            ->setParameter('language', $language);

        if (null !== $category) {
            $query->innerJoin('a', ArticleCategories::TABLE, 'c', 'c.article_id = a.id AND c.category_id = :category')
                ->setParameter('category', $category);
        }

        if (null !== $year) {
            $query->andWhere('a.date >= :from')
                ->andWhere('a.date < :to')
                ->setParameter('from', Values::toDatabase(new DateTimeImmutable($year . '-01-01 00:00:00')))
                ->setParameter('to', Values::toDatabase(new DateTimeImmutable(($year + 1) . '-01-01 00:00:00')));
        }

        return $query;
    }

    /**
     * @param list<string> $ids
     *
     * @return list<ArticleView>
     */
    private function views(array $ids, string $language): array
    {
        if ([] === $ids) {
            return [];
        }

        $articles = [];

        foreach ($this->articles->fetch(['where' => ['id' => $ids]]) as $article) {
            $articles[$article->id] = $article;
        }

        $texts = [];

        foreach ($this->translations->fetch(['where' => ['articleId' => $ids, 'language' => $language]]) as $translation) {
            $texts[$translation->articleId] = $translation;
        }

        $categories = [];

        foreach ($this->categories->all() as $category) {
            $categories[$category->id] = $category;
        }

        $assigned = [];

        foreach ($this->articleCategories->fetch(['where' => ['articleId' => $ids], 'order' => 'id']) as $row) {
            if (isset($categories[$row->categoryId])) {
                $assigned[$row->articleId][] = $categories[$row->categoryId];
            }
        }

        $views = [];

        foreach ($ids as $id) {
            $article = $articles[$id] ?? null;
            $text = $texts[$id] ?? null;

            if (null === $article || null === $text) {
                continue;
            }

            $views[] = new ArticleView($id, $language, $article->date, $text->title, $text->slug, $text->teaser, $text->text, $article->image, self::sorted($assigned[$id] ?? []));
        }

        return $views;
    }

    /**
     * @param list<Category> $categories
     *
     * @return list<Category>
     */
    private static function sorted(array $categories): array
    {
        usort($categories, static fn(Category $a, Category $b): int => [$a->position, $a->id] <=> [$b->position, $b->id]);

        return $categories;
    }
}
