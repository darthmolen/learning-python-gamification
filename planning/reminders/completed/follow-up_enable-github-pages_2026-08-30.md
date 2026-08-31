# Turn on GitHub Pages for the repository, with GitHub Actions as the source

**Category:** follow-up
**Audience:** dm
**Subject:** tooling
**Raised:** 2026-08-30
**Plan:** `planning/**/feature_field-manual_2026-08-30.md`
**Status:** done
**Closed:** 2026-08-31 — this was turned on but it wanted some kind of workflow. the setting was turned on though.

## What to do

On the repository's **Settings → Pages → Build and deployment → Source**, choose **GitHub
Actions**. Not "Deploy from a branch" — the workflow uploads an artifact and there is no
`gh-pages` branch to point at.

Then push to `main` and watch the **Field Manual** workflow. The deploy job prints the live URL.

## Why it cannot be a test

It is a repository setting on a website, behind an account only the owner can sign into.

The failure mode is worth knowing in advance: the workflow file is committed and correct, so
`npm ci`, the content validator, the no-game gate and the build will all pass. Only the final
deploy step fails, and it fails on permissions. **A green-looking run and no site** is what this
looks like until the setting is changed.

## What it changes

**Switched on:** the curriculum is live, and rebuilds itself whenever `content/` changes. The
round trip that proves "evergreen" is one word — edit a blurb in `content/areas/area-3.yml`,
push, and read the change on the page. Until somebody does that, evergreen is a claim about a
workflow file rather than an observed fact.

**Left off:** nothing publishes, and nothing says so loudly.

**One thing to look at while you are there.** The site is public. It carries no name, no machine
and no location — the generator reads `content/` and `packages/content` only, never
`docs/design/`, and a test asserts the output adds no scoring vocabulary. Read the live page
anyway: "I checked the generator" and "I read the page" are different claims, and only one of
them is what a stranger sees.
