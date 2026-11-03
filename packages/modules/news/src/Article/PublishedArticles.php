<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Article;

use DateTimeImmutable;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Query\QueryBuilder;
use Frootbox\Core\Category\CategoryLinks;
use Frootbox\Core\Category\ObjectCategories;
use Frootbox\Core\Tag\ObjectTags;
use Frootbox\Core\Tag\TagLinks;
use Frootbox\Database\Values;

/**
 * The published articles for visitors: lists by language, categories and
 * year, newest first, read from the tables. With spaces only the articles
 * of these spaces (decision 0232), null for all; with categories only
 * articles in one of them (decision 0233), e.g. a category and all below;
 * with a tag only the articles that have it (decision 0239).
 */
final readonly class PublishedArticles
{
    public function __construct(
        private Connection $connection,
        private Articles $articles,
        private ArticleTranslations $translations,
        private ObjectCategories $categories,
        private ObjectTags $tags,
    ) {}

    /**
     * @param list<string>|null $categories
     * @param list<string>|null $spaces
     *
     * @return list<ArticleView>
     */
    public function list(string $language, ?array $categories = null, ?int $year = null, int $limit = 10, int $offset = 0, ?array $spaces = null, ?string $tag = null): array
    {
        $query = $this->query($language, $categories, $year, $spaces, $tag)
            ->select('a.id')
            ->orderBy('a.date', 'DESC')
            ->addOrderBy('a.id', 'DESC')
            ->setMaxResults(max(1, $limit))
            ->setFirstResult(max(0, $offset));
        $ids = array_values(array_filter($query->executeQuery()->fetchFirstColumn(), \is_string(...)));

        return $this->views($ids, $language);
    }

    /**
     * @param list<string>|null $categories
     * @param list<string>|null $spaces
     */
    public function count(string $language, ?array $categories = null, ?int $year = null, ?array $spaces = null, ?string $tag = null): int
    {
        $count = $this->query($language, $categories, $year, $spaces, $tag)->select('COUNT(*)')->executeQuery()->fetchOne();

        return is_numeric($count) ? (int) $count : 0;
    }

    /**
     * The years with articles, newest first.
     *
     * @param list<string>|null $categories
     * @param list<string>|null $spaces
     *
     * @return list<int>
     */
    public function years(string $language, ?array $categories = null, ?array $spaces = null, ?string $tag = null): array
    {
        $years = [];

        foreach ($this->query($language, $categories, null, $spaces, $tag)->select('a.date')->executeQuery()->fetchFirstColumn() as $date) {
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

    /**
     * @param list<string>|null $categories
     * @param list<string>|null $spaces
     */
    private function query(string $language, ?array $categories, ?int $year, ?array $spaces, ?string $tag = null): QueryBuilder
    {
        $query = $this->connection->createQueryBuilder()
            ->from(Articles::TABLE, 'a')
            ->innerJoin('a', ArticleTranslations::TABLE, 't', 't.article_id = a.id AND t.language = :language')
            ->setParameter('language', $language);

        if (null !== $categories) {
            $linked = $this->connection->createQueryBuilder()
                ->select('l.target_id')
                ->from(CategoryLinks::TABLE, 'l')
                ->where('l.target_type = :type')
                ->andWhere($query->expr()->in('l.category_id', ':categories'));
            $query->andWhere($query->expr()->in('a.id', $linked->getSQL()))
                ->setParameter('type', ArticleStore::TYPE)
                ->setParameter('categories', [] === $categories ? [''] : $categories, ArrayParameterType::STRING);
        }

        if (null !== $tag) {
            $tagged = $this->connection->createQueryBuilder()
                ->select('g.target_id')
                ->from(TagLinks::TABLE, 'g')
                ->where('g.target_type = :tagType')
                ->andWhere('g.tag_id = :tag');
            $query->andWhere($query->expr()->in('a.id', $tagged->getSQL()))
                ->setParameter('tagType', ArticleStore::TYPE)
                ->setParameter('tag', $tag);
        }

        if (null !== $spaces) {
            $query->andWhere($query->expr()->in('a.space', ':spaces'))
                ->setParameter('spaces', [] === $spaces ? [''] : $spaces, ArrayParameterType::STRING);
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

        $assigned = $this->categories->of(ArticleStore::TYPE, $ids);
        $tags = $this->tags->of(ArticleStore::TYPE, $ids);

        $views = [];

        foreach ($ids as $id) {
            $article = $articles[$id] ?? null;
            $text = $texts[$id] ?? null;

            if (null === $article || null === $text) {
                continue;
            }

            $views[] = new ArticleView($id, $language, $article->date, $text->title, $text->slug, $text->teaser, $text->text, $article->image, $assigned[$id] ?? [], $tags[$id] ?? []);
        }

        return $views;
    }
}
