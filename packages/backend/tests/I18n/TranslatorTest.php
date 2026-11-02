<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\I18n;

use Frootbox\Backend\BackendExtension;
use Frootbox\Core\Action\CurrentContext;
use Frootbox\Core\Config\Config;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\I18n\TranslationException;
use Frootbox\Core\I18n\Translator;
use Frootbox\Core\I18n\UserLanguages;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\ProjectPaths;
use Frootbox\Core\Tests\Support\TemporaryProject;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Yaml\Yaml;

#[CoversClass(Translator::class)]
#[CoversClass(TranslationException::class)]
final class TranslatorTest extends TestCase
{
    private TemporaryProject $project;

    protected function setUp(): void
    {
        $this->project = TemporaryProject::create();
    }

    protected function tearDown(): void
    {
        $this->project->remove();
    }

    public function testTheLanguageComesFromTheConfigOrTheWebsite(): void
    {
        self::assertSame('de', $this->translator(['backend' => ['language' => 'de']])->language());
        self::assertSame('de', $this->translator(['languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']]])->language());
        self::assertSame('en', $this->translator(['languages' => ['fr' => ['title' => 'Français']]])->language(), 'No texts for French.');
        self::assertSame('en', $this->translator()->language());
    }

    public function testTranslatesWithPlaceholdersAndPlurals(): void
    {
        $german = $this->translator(['backend' => ['language' => 'de']]);

        self::assertSame('Abmelden', $german->get('Sign out'));
        self::assertSame('Hallo, Jane', $german->get('Hello, {name}', ['name' => 'Jane']));
        self::assertSame('Einloggen', $german->get('Sign in'), 'A later package replaces a text.');
        self::assertSame('1 Bestellung', $german->get(['{count} order', '{count} orders'], ['count' => 1]));
        self::assertSame('3 Bestellungen', $german->get(['{count} order', '{count} orders'], ['count' => 3]));
        self::assertSame('Nobody translated this', $german->get('Nobody translated this'), 'A missing text shows as written.');

        $english = $this->translator();
        self::assertSame('Sign out', $english->get('Sign out'));
        self::assertSame('0 orders', $english->get(['{count} order', '{count} orders'], ['count' => 0]));
        self::assertSame('1 order', $english->get(['{count} order', '{count} orders'], ['count' => 1]));
    }

    public function testRegionalLanguagesFallBackToTheirBase(): void
    {
        self::assertSame('Abmelden', $this->translator(['backend' => ['language' => 'de-ch']])->get('Sign out'));
    }

    public function testCachesLiveAndExplainsBrokenFiles(): void
    {
        $live = $this->translator(['backend' => ['language' => 'de']], Environment::Production);
        self::assertSame('Abmelden', $live->get('Sign out'));
        self::assertFileExists($this->project->root . '/var/cache/translations-de.cache');
        self::assertSame('Abmelden', $this->translator(['backend' => ['language' => 'de']], Environment::Production)->get('Sign out'), 'From the cache.');

        $folder = $this->project->root . '/broken';
        mkdir($folder . '/translations', 0o777, true);
        file_put_contents($folder . '/translations/de.yaml', Yaml::dump(['Sign out' => ['one' => 'Abmelden']]));
        $broken = $this->translator(['backend' => ['language' => 'de']], extra: new ExtensionPackage('acme/broken', $folder, 'Broken'));

        $this->expectException(TranslationException::class);
        $this->expectExceptionMessage('"Sign out"');
        $broken->get('Sign out');
    }

    /**
     * Every text the backend translates in its views has a German text.
     */
    public function testEveryTextOfTheViewsIsTranslated(): void
    {
        $german = Yaml::parseFile(BackendExtension::ROOT . '/translations/de.yaml');
        self::assertIsArray($german);
        $missing = [];
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator(BackendExtension::ROOT . '/views', \FilesystemIterator::SKIP_DOTS));

        foreach ($files as $file) {
            self::assertInstanceOf(\SplFileInfo::class, $file);
            preg_match_all("/\\bt\\(\\[?'((?:[^'\\\\]|\\\\.)+)'/", (string) file_get_contents($file->getPathname()), $matches);

            foreach ($matches[1] as $text) {
                if (!\array_key_exists(stripslashes($text), $german)) {
                    $missing[] = $text;
                }
            }
        }

        self::assertSame([], array_values(array_unique($missing)), 'Add these texts to translations/de.yaml.');
    }

    /**
     * @param array<string, mixed> $values
     */
    private function translator(array $values = [], Environment $environment = Environment::Development, ?ExtensionPackage $extra = null): Translator
    {
        $config = new Config($environment, $values);
        $packages = [
            ExtensionPackage::fromManifest('frootbox/backend', (string) realpath(BackendExtension::ROOT)),
            ExtensionPackage::fromManifest('acme/brand', (string) realpath(__DIR__ . '/../Fixtures/Brand')),
            ...null === $extra ? [] : [$extra],
        ];

        $users = new class implements UserLanguages {
            public function of(int $userId): ?string
            {
                return null;
            }
        };

        return new Translator($config, Languages::fromConfig($config), new Extensions($packages), new ProjectPaths($this->project->root), new CurrentContext(), $users);
    }
}
