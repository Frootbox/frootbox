<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Tests;

use DateTimeImmutable;
use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Channel;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Auth\Actor;
use Frootbox\Core\Plugin\CreateSpace;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Core\User\AssignRole;
use Frootbox\Core\User\CreateUser;
use Frootbox\News\Article\ArticleStore;
use Frootbox\News\Article\ArticleSummary;
use Frootbox\News\Article\CreateArticle;
use Frootbox\News\Article\DeleteArticle;
use Frootbox\News\Article\ListArticles;
use Frootbox\News\Article\PublishArticles;
use Frootbox\News\Article\UpdateArticle;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * An editor with a role only within one space (decision 0245).
 */
#[CoversClass(ListArticles::class)]
#[CoversClass(UpdateArticle::class)]
final class SpaceRightsTest extends NewsTestCase
{
    public function testAnEditorWorksOnlyWithinTheSpace(): void
    {
        $space = $this->runner()->run(new CreateSpace(ArticleStore::TYPE, 'Presse'))->id;
        $outside = $this->article(['de' => ['title' => 'Neue Sorten']]);
        $inside = $this->article(['de' => ['title' => 'Pressemitteilung']], space: $space);

        $user = $this->runner()->run(new CreateUser('jane@example.org', 'Jane', 'kaffeebohne42'))->user;
        $this->runner()->run(new AssignRole($user->id, 'editor', 'space:' . SpaceScopes::id(ArticleStore::TYPE, $space)));
        $editor = new Context(Actor::user($user->id, $user->name), Channel::Api);

        self::assertSame([$inside], array_map(static fn(ArticleSummary $item): string => $item->id, $this->runner()->ask(new ListArticles(), $editor)->items));
        $created = $this->runner()->run(new CreateArticle(['de' => ['title' => 'Zweite Meldung']], new DateTimeImmutable(), space: $space), $editor)->id;
        $this->runner()->run(new UpdateArticle($inside, ['de' => ['title' => 'Neue Pressemitteilung']]), $editor);
        self::assertCount(2, $this->runner()->run(new PublishArticles([$inside, $created]), $editor));

        foreach ([new CreateArticle(['de' => ['title' => 'Draußen']], new DateTimeImmutable()), new UpdateArticle($outside, ['de' => ['title' => 'Draußen']]), new UpdateArticle($inside, space: Space::DEFAULT), new PublishArticles([$inside, $outside]), new DeleteArticle($outside)] as $action) {
            try {
                $this->runner()->run($action, $editor);
                self::fail(\sprintf('%s was allowed.', $action::class));
            } catch (AccessDeniedException) {
                self::assertSame('denied', $this->lastEntry()->status->value);
            }
        }
    }
}
