<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\CaptchaRecaptcha\Tests;

use Frootbox\CaptchaRecaptcha\RecaptchaApi;
use Frootbox\CaptchaRecaptcha\RecaptchaCaptcha;
use Frootbox\CaptchaRecaptcha\RecaptchaExtension;
use Frootbox\CaptchaRecaptcha\RecaptchaSettings;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\I18n\Translator;
use Frootbox\Forms\Captcha\Captchas;
use Frootbox\Forms\Captcha\ListCaptchas;
use Frootbox\Forms\Captcha\ProofOfWork;
use Frootbox\Forms\Form\FormData;
use Frootbox\Forms\Form\UpdateForm;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(RecaptchaExtension::class)]
#[CoversClass(RecaptchaCaptcha::class)]
#[CoversClass(RecaptchaSettings::class)]
#[CoversClass(RecaptchaApi::class)]
final class RecaptchaTest extends RecaptchaTestCase
{
    public function testWithoutKeysItCannotBeChosen(): void
    {
        $list = $this->runner()->ask(new ListCaptchas());
        $ready = array_column($list->captchas, 'ready', 'name');

        self::assertFalse($ready[RecaptchaExtension::NAME]);
        self::assertTrue($ready[ProofOfWork::NAME]);

        $id = $this->form();

        try {
            $this->runner()->run(new UpdateForm($id, captcha: RecaptchaExtension::NAME));
            self::fail('Without keys it is refused.');
        } catch (InvalidInputException $error) {
            self::assertSame(['/captcha'], array_keys($error->errors));
        }

        $captchas = $this->get(Captchas::class);
        self::assertSame(ProofOfWork::NAME, $captchas->of(new FormData(captcha: RecaptchaExtension::NAME))?->name, 'A form that has it falls back to the proof of work.');
    }

    public function testTheBoxLoadsAfterConsent(): void
    {
        $this->keys();
        $html = $this->page($this->form(RecaptchaExtension::NAME));

        self::assertStringContainsString('<fb-external class="external" service="frootbox/captcha-recaptcha/recaptcha"><template><div class="recaptcha" data-fb-recaptcha data-sitekey="site-key" data-version="v2" data-language="de"></div><input type="hidden" name="captcha[token]"><script>', $html);
        self::assertStringNotContainsString('secret-key', $html);
        self::assertSame(1, substr_count($html, 'https://www.google.com/recaptcha/api.js'), 'Only the script in the template knows the address of Google.');
    }

    public function testVersionTwoNeedsATickedBox(): void
    {
        $this->keys();
        $id = $this->form(RecaptchaExtension::NAME);

        foreach ([null, ['token' => ' ']] as $captcha) {
            try {
                $this->submit($id, $captcha);
                self::fail('Without a token the form is not sent.');
            } catch (InvalidInputException $error) {
                self::assertSame(['/captcha'], array_keys($error->errors));
            }
        }

        self::assertSame([], $this->sent(), 'Without a token Google is not asked.');

        $this->answer = ['success' => false, 'error-codes' => ['timeout-or-duplicate']];

        try {
            $this->submit($id, ['token' => 'old']);
            self::fail('An old token is an error.');
        } catch (InvalidInputException $error) {
            self::assertSame('Please confirm reCAPTCHA again.', $error->errors['/captcha'] ?? null);
        }

        $translator = $this->get(Translator::class);
        self::assertSame('Bitte bestätige reCAPTCHA noch einmal.', $translator->in('de', 'Please confirm reCAPTCHA again.', ['frootbox/forms']), 'The website translates it like the errors of the forms.');
        self::assertSame('يُرجى تأكيد reCAPTCHA مرة أخرى.', $translator->in('ar', 'Please confirm reCAPTCHA again.', ['frootbox/forms']));

        $this->answer = ['success' => true, 'hostname' => 'example.org'];
        $this->submit($id, ['token' => 'ticked']);

        self::assertSame([null], $this->reasons());
        self::assertSame([['secret' => 'secret-key', 'response' => 'old'], ['secret' => 'secret-key', 'response' => 'ticked']], $this->sent(), 'The address of the visitor is not sent.');
    }

    public function testVersionThreeSendsALowScoreToTheSpamFolder(): void
    {
        $this->keys('v3');
        $id = $this->form(RecaptchaExtension::NAME);

        self::assertStringContainsString('data-version="v3"', $this->page($id));

        $this->answer = ['success' => true, 'score' => 0.9, 'action' => 'submit'];
        $this->submit($id, ['token' => 'a']);
        $this->answer = ['success' => true, 'score' => 0.1, 'action' => 'submit'];
        $this->submit($id, ['token' => 'b']);
        $this->answer = ['success' => true, 'score' => 0.9, 'action' => 'login'];
        $this->submit($id, ['token' => 'c']);
        $this->answer = null;
        $this->submit($id, ['token' => 'd']);

        self::assertSame([
            null,
            'reCAPTCHA rated the visitor as a bot.',
            'reCAPTCHA gave a token of another action.',
            'Google did not answer the check of reCAPTCHA.',
        ], $this->reasons());
    }
}
