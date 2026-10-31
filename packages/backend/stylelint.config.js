// Values in the CSS of the backend come only from the tokens (decisions
// 0113, 0114): no colors and no lengths in px, rem or em, except in media
// queries, where CSS variables do not work. Authors write plain CSS, the
// layer comes from the folder.
export default {
    reportNeedlessDisables: true,
    rules: {
        'color-no-hex': true,
        'color-named': 'never',
        'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'color-mix'],
        'unit-disallowed-list': [
            ['px', 'rem', 'em', 'pt', 'cm', 'mm', 'in', 'pc', 'q'],
            { ignoreMediaFeatureNames: { px: ['min-width', 'max-width', 'width', 'height', 'min-height', 'max-height'] } },
        ],
        'at-rule-disallowed-list': ['layer', 'import'],
        'selector-class-pattern': [
            '^fb-[a-z0-9]+(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
            { message: 'Classes of the backend are "fb-block__element--modifier".' },
        ],
        'property-disallowed-list': [['/^--/'], { message: 'Define custom properties in tokens.yaml, not in CSS.' }],
        'declaration-property-value-no-unknown': true,
        'property-no-unknown': true,
        'selector-pseudo-class-no-unknown': true,
        'block-no-empty': true,
        'no-duplicate-selectors': true,
    },
};
