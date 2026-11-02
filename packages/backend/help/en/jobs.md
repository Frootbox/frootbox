---
title: Background jobs
about: [screen:backend.jobs, action:system.job-retry]
permission: system.job-list
order: 120
---
Extensions do some work in the background, e.g. sending an order to
another service. **Background jobs** shows what waits, what runs again after an
error and what failed. A job that failed can run again with **Run
now**. Jobs run every minute with cron; without cron they only run
when someone opens the website, and the dashboard says so.
