<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\CaptchaRecaptcha;

use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Action\Schema\Range;
use Frootbox\Core\Action\Schema\Sensitive;
use Frootbox\Core\Action\Schema\Title;
use Frootbox\Core\Settings\AsSettings;

/**
 * The keys of reCAPTCHA from the admin console of Google (decision 0262).
 */
#[AsSettings('reCAPTCHA', 'The keys and the version of reCAPTCHA for the forms')]
final readonly class RecaptchaSettings
{
    public function __construct(
        #[Title('Version'), Description('v2 shows a box "I am not a robot", v3 rates the visitor without a box. The keys belong to one version.')]
        #[Pattern('^v[23]$')]
        public string $version = 'v2',
        #[Title('Site key'), Description('The key for the website from the admin console of reCAPTCHA.')]
        #[Length(max: 100)]
        public string $siteKey = '',
        #[Title('Secret key'), Description('The secret key from the admin console of reCAPTCHA.'), Sensitive]
        public string $secretKey = '',
        #[Title('Lowest score'), Description('For v3: an entry rated lower goes to the spam folder, from 0 (bot) to 1 (person).')]
        #[Range(min: 0, max: 1)]
        public float $minScore = 0.5,
    ) {}

    public function ready(): bool
    {
        return '' !== trim($this->siteKey) && '' !== trim($this->secretKey);
    }
}
