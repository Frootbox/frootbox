<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Backend\BackendExtension;
use Frootbox\Backend\Design\Design;
use Frootbox\Core\Asset\AssetList;
use Frootbox\Core\Asset\AssetTags;
use Frootbox\Core\Asset\ImportMap;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\Media\UploadReceiver;
use Frootbox\RichText\Html;

/**
 * The tags in the head of every backend page: the order of the layers,
 * the tokens of the active brand, the styles, the import map and the
 * scripts (decisions 0111, 0114).
 *
 * CSS of the backend goes into layers by its folder in assets/css:
 * reset.css, base.css, components/, screens/. Files that extensions add
 * with $registry->asset(…, 'backend') go into "extensions".
 */
final readonly class Head
{
    public const array LAYERS = ['reset', 'tokens', 'base', 'components', 'screens', 'extensions'];

    public const string AREA = 'backend';

    public const string CSS = BackendExtension::ROOT . '/assets/css';

    public const string SCRIPT = BackendExtension::ROOT . '/assets/build/backend.js';

    /**
     * Holds back a form of <fb-form> that is sent before its script has
     * loaded and sends it once the script is there, so it never goes out
     * as a plain GET.
     */
    private const string FORM_SCRIPT = 'document.addEventListener("submit",function(e){var f=e.target;if(customElements.get("fb-form")||!f.closest||!f.closest("fb-form"))return;e.preventDefault();var s=e.submitter||null;customElements.whenDefined("fb-form").then(function(){f.requestSubmit(s)})},true);';

    /** Sets the appearance chosen in the browser before anything is drawn. */
    private const string THEME_SCRIPT = 'try{var t=localStorage.getItem("fb-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}';

    public function __construct(
        private Design $design,
        private AssetTags $tags,
        private ImportMap $imports,
        private Registry $registry,
    ) {}

    /**
     * @param ?string $csrf    token of the session, null for guests
     * @param ?string $actions where forms send actions, e.g. "/cms/actions/"
     */
    public function html(?string $csrf, ?string $actions = null): string
    {
        $assets = $this->assets();
        $favicon = $this->design->favicon();
        $lines = [
            '<meta charset="utf-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
            '<meta name="robots" content="noindex, nofollow">',
            null === $favicon ? '' : '<link rel="icon" href="' . Html::escape($favicon) . '">',
            null === $csrf ? '' : '<meta name="fb-csrf" content="' . Html::escape($csrf) . '">',
            null === $actions ? '' : '<meta name="fb-actions" content="' . Html::escape($actions) . '">',
            // Uploads go in parts of this size, under the limits of the server (decision 0177).
            null === $csrf ? '' : '<meta name="fb-upload-part" content="' . UploadReceiver::partBytes() . '">',
            '<script>' . self::THEME_SCRIPT . self::FORM_SCRIPT . '</script>',
            '<style>' . $assets->layerOrder() . '</style>',
            '<style>@layer tokens{' . $this->design->css() . '}</style>',
            $this->tags->styles($assets),
            $this->imports->tag(),
            $this->imports->module(self::SCRIPT),
            $this->tags->scripts($assets),
        ];

        return implode("\n", array_filter($lines, static fn(string $line): bool => '' !== $line));
    }

    public function assets(): AssetList
    {
        $assets = new AssetList(self::LAYERS);

        foreach (['reset', 'base'] as $layer) {
            if (is_file(self::CSS . '/' . $layer . '.css')) {
                $assets->add(self::CSS . '/' . $layer . '.css', $layer);
            }
        }

        foreach (['components', 'screens'] as $layer) {
            foreach (self::files(self::CSS . '/' . $layer) as $file) {
                $assets->add($file, $layer);
            }
        }

        foreach ($this->registry->assets(self::AREA) as $file) {
            $assets->add($file, 'extensions');
        }

        return $assets;
    }

    /**
     * @return list<string>
     */
    private static function files(string $directory): array
    {
        $files = glob($directory . '/*.css');

        if (false === $files) {
            return [];
        }

        sort($files);

        return $files;
    }
}
