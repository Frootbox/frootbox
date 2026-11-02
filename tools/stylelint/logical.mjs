// Start and end instead of left and right (decision 0133), so a page in a
// language written from right to left mirrors by itself. Physical sides
// only where they must not mirror, with a comment and stylelint-disable.
// Projects can take this over for their own themes:
//
//     import { logical } from '../../tools/stylelint/logical.mjs';
//     export default { rules: { ...logical } };

export const PHYSICAL = [
    'left',
    'right',
    '/^(margin|padding|scroll-margin|scroll-padding)-(left|right)$/',
    '/^border-(left|right)(-.+)?$/',
    '/^border-(top|bottom)-(left|right)-radius$/',
];

export const MESSAGE = 'Use the logical form, e.g. margin-inline-start, inset-inline-end, border-start-end-radius (decision 0133).';

export const logical = {
    'property-disallowed-list': [PHYSICAL, { message: MESSAGE }],
    'declaration-property-value-disallowed-list': [
        {
            'text-align': ['left', 'right'],
            'text-align-last': ['left', 'right'],
            float: ['left', 'right'],
            clear: ['left', 'right'],
        },
        { message: 'Use start and end instead of left and right (decision 0133).' },
    ],
};
