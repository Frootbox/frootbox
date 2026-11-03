<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Backend;

use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\ConflictException;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Design\WebFonts;
use Frootbox\GoogleFonts\Catalog\CatalogFont;
use Frootbox\GoogleFonts\Catalog\SearchCatalog;
use Frootbox\GoogleFonts\Font\FontLibrary;
use Frootbox\GoogleFonts\Font\FontSummary;
use Frootbox\GoogleFonts\Font\ListFonts;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The screen "Fonts" (decision 0252): searching the catalog of Google
 * Fonts, importing and removing. Google is asked only after a search,
 * and samples come from the files on this website.
 */
final readonly class FontsHandler implements RequestHandlerInterface
{
    public const string PERMISSION = 'frootbox/google-fonts/font.list';

    private const array CATEGORIES = ['sans-serif' => 'Sans-serif', 'serif' => 'Serif', 'display' => 'Display', 'handwriting' => 'Handwriting', 'monospace' => 'Monospace'];

    public function __construct(
        private BackendView $view,
        private Runner $runner,
        private WebFonts $webFonts,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        $params = $request->getQueryParams();
        $q = \is_string($params['q'] ?? null) ? mb_substr(trim($params['q']), 0, 100) : '';
        $category = \is_string($params['category'] ?? null) && isset(self::CATEGORIES[$params['category']]) ? $params['category'] : '';
        $searched = isset($params['search']);
        $imported = $this->runner->ask(new ListFonts());
        $keys = array_column($imported, 'key');
        $results = [];
        $error = null;

        if ($searched) {
            try {
                $results = array_map(static fn(CatalogFont $font): array => [
                    'family' => $font->family,
                    'category' => self::CATEGORIES[$font->category] ?? $font->category,
                    'subsets' => $font->subsets,
                    'variable' => $font->variable(),
                    'styles' => \count($font->weights) + \count($font->italics),
                    'italic' => $font->italic(),
                    'imported' => \in_array(FontLibrary::key($font->family), $keys, true),
                ], $this->runner->ask(new SearchCatalog($q, $category)));
            } catch (ConflictException $exception) {
                $error = $exception->template;
            }
        }

        return $this->view->render($request, '@frootbox/google-fonts/backend/fonts.twig', [
            'q' => $q,
            'category' => $category,
            'categories' => array_map(static fn(string $value, string $label): array => ['value' => $value, 'label' => $label], array_keys(self::CATEGORIES), self::CATEGORIES),
            'searched' => $searched,
            'results' => $results,
            'error' => $error,
            'fonts' => array_map(static fn(FontSummary $font): array => [
                'key' => $font->key,
                'family' => $font->family,
                'css' => $font->cssFamily,
                'category' => self::CATEGORIES[$font->category] ?? $font->category,
                'subsets' => $font->subsets,
                'italic' => $font->italic,
                'files' => $font->files,
            ], $imported),
            'faces' => $this->webFonts->css(),
        ]);
    }
}
