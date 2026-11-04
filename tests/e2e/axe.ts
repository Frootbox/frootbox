/*
 * SPDX-License-Identifier: MIT
 */

import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/**
 * An axe check of the page once its stylesheets are in. After a click on
 * a link, toHaveURL() and the text of the new page pass before the CSS
 * has loaded; unstyled links are small and fail target-size.
 */
export const axeBuilder = async (page: Page): Promise<AxeBuilder> => {
    await page.waitForLoadState('load');

    return new AxeBuilder({ page });
};
