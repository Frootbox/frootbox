<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\CaptchaRecaptcha;

use Frootbox\Core\Consent\ExternalService;
use Frootbox\Core\Consent\Purpose;
use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;
use Frootbox\Forms\Captcha\Captcha;

/**
 * reCAPTCHA of Google as a captcha of the forms (decision 0262). It is
 * chosen only once the keys are set and loads after consent at the form.
 */
final class RecaptchaExtension implements Extension
{
    public const string NAME = 'frootbox/captcha-recaptcha/recaptcha';

    public function register(Registry $registry): void
    {
        $registry->settings(RecaptchaSettings::class);
        $registry->add(ExternalService::class, new ExternalService(self::NAME, 'reCAPTCHA', 'Google Ireland Limited', 'https://policies.google.com/privacy', Purpose::Security));
        $registry->add(Captcha::class, new Captcha(
            self::NAME,
            'reCAPTCHA',
            RecaptchaCaptcha::class,
            service: self::NAME,
            description: 'A check by Google. It loads at the form only after the visitor agrees; without it the form cannot be sent.',
        ));
    }
}
