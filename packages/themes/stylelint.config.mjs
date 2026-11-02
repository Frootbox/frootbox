// The official themes mirror for languages written from right to left
// (decision 0133).
import { logical } from '../../tools/stylelint/logical.mjs';

export default {
    reportNeedlessDisables: true,
    rules: {
        ...logical,
    },
};
