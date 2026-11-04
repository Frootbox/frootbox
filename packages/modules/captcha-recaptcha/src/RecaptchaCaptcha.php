<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\CaptchaRecaptcha;

use Frootbox\Core\Support\Message;
use Frootbox\Forms\Captcha\CaptchaRequest;
use Frootbox\Forms\Captcha\CaptchaResult;
use Frootbox\Forms\Captcha\CaptchaWidget;
use Frootbox\Forms\Captcha\ConfigurableCaptcha;

/**
 * reCAPTCHA v2 with its box or v3 with a score (decision 0262). The
 * markup sits behind external(), so the script of Google loads after
 * consent; a small script in it renders the box or fetches the token of
 * v3 before sending, into "captcha[token]".
 */
final readonly class RecaptchaCaptcha implements ConfigurableCaptcha
{
    /**
     * Renders the box of v2 or asks v3 for a token before sending, and
     * loads the API of Google once per page in the language of the form.
     */
    public const string SCRIPT = <<<'JS'
        (() => {
          const script = document.currentScript;
          const box = script.parentElement.querySelector('[data-fb-recaptcha]');
          const input = script.parentElement.querySelector('input[name="captcha[token]"]');
          const form = script.closest('form');
          const key = box.dataset.sitekey;
          const v3 = box.dataset.version === 'v3';
          const api = (window.frootboxRecaptcha ??= { ready: false, waiting: [] });
          const whenReady = (run) => (api.ready ? run() : api.waiting.push(run));

          if (v3) {
            form?.addEventListener('frootbox:forms-sending', (event) => {
              event.detail.wait.push(new Promise((resolve) => whenReady(() => window.grecaptcha.ready(() => {
                window.grecaptcha.execute(key, { action: 'submit' }).then((token) => { input.value = token; resolve(); }, resolve);
              }))));
            });
          } else {
            whenReady(() => {
              const id = window.grecaptcha.render(box, { sitekey: key, callback: (token) => { input.value = token; }, 'expired-callback': () => { input.value = ''; } });
              form?.addEventListener('frootbox:forms-failed', (event) => {
                if (event.detail?.errors?.['/captcha']) {
                  window.grecaptcha.reset(id);
                  input.value = '';
                }
              });
            });
          }

          if (!document.querySelector('script[data-fb-recaptcha-api]')) {
            window.frootboxRecaptchaLoaded = () => {
              api.ready = true;
              api.waiting.splice(0).forEach((run) => run());
            };
            const load = document.createElement('script');
            load.src = 'https://www.google.com/recaptcha/api.js?' + new URLSearchParams({ onload: 'frootboxRecaptchaLoaded', render: v3 ? key : 'explicit', hl: box.dataset.language });
            load.async = true;
            load.dataset.fbRecaptchaApi = '';
            document.head.append(load);
          }
        })();
        JS;

    public function __construct(
        private RecaptchaSettings $settings,
        private RecaptchaApi $api,
    ) {}

    public function ready(): bool
    {
        return $this->settings->ready();
    }

    public function widget(CaptchaRequest $request): CaptchaWidget
    {
        $attributes = ' data-fb-recaptcha data-sitekey="' . htmlspecialchars(trim($this->settings->siteKey)) . '" data-version="' . $this->version() . '" data-language="' . htmlspecialchars($request->language) . '"';

        return new CaptchaWidget(
            '<div class="recaptcha"' . $attributes . '></div><input type="hidden" name="captcha[token]"><script>' . self::SCRIPT . '</script>',
            title: 'reCAPTCHA',
        );
    }

    public function verify(CaptchaRequest $request, array $answer): CaptchaResult
    {
        if (!$this->ready()) {
            return CaptchaResult::suspicious('reCAPTCHA is not set up.');
        }

        $token = trim($answer['token'] ?? '');

        if ('' === $token) {
            return CaptchaResult::wrong(new Message('v3' === $this->version() ? 'Please load reCAPTCHA first, then send the form.' : 'Please load reCAPTCHA first and confirm that you are not a robot.'));
        }

        $data = $this->api->verify(trim($this->settings->secretKey), $token);

        if (null === $data) {
            return CaptchaResult::suspicious('Google did not answer the check of reCAPTCHA.');
        }

        if (true !== $data['success']) {
            return CaptchaResult::wrong(new Message('v3' === $this->version() ? 'reCAPTCHA could not check the form. Please send it again.' : 'Please confirm reCAPTCHA again.'));
        }

        if ('v2' === $this->version()) {
            return CaptchaResult::passed();
        }

        $score = $data['score'] ?? null;

        if ('submit' !== ($data['action'] ?? null) || !(\is_float($score) || \is_int($score))) {
            return CaptchaResult::suspicious('reCAPTCHA gave a token of another action.');
        }

        return $score >= $this->settings->minScore ? CaptchaResult::passed() : CaptchaResult::suspicious('reCAPTCHA rated the visitor as a bot.');
    }

    private function version(): string
    {
        return 'v3' === $this->settings->version ? 'v3' : 'v2';
    }
}
