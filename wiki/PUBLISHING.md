# Publishing the GitHub Wiki

**Reality check:** this has never actually been done. Every file in `wiki/` still shows only its original add-commit in `git log`, and no `Litmo.wiki.git` clone exists locally — there is no live, published GitHub wiki today, and no active operation with real readers. These are draft instructions kept for reference, not a description of something that happened.

GitHub stores a repository wiki in a separate Git repository ending in `.wiki.git`. The connected GitHub API used to prepare these pages cannot publish directly to that repository.

## First-time setup

1. Open the repository's **Wiki** tab.
2. Create the first page if GitHub has not initialized the wiki yet.
3. Clone both repositories locally.

```bash
git clone https://github.com/softnessasastrength/Litmo.git
git clone https://github.com/softnessasastrength/Litmo.wiki.git
```

## Publish the prepared pages

From the parent directory containing both clones:

```bash
cp Litmo/wiki/*.md Litmo.wiki/
cd Litmo.wiki
git add .
git commit -m "Build Litmo project wiki"
git push origin master
```

GitHub wikis commonly use `master` as the wiki repository's branch even when the application repository uses `main`. Confirm with `git branch --show-current` before pushing.

## Page mapping

- `Home.md` becomes the wiki landing page.
- `_Sidebar.md` becomes persistent wiki navigation.
- Hyphenated filenames become readable page titles and work with GitHub's `[[Wiki Link]]` syntax.
- `PUBLISHING.md` is staging documentation and does not need to be copied into the public wiki.

## Maintenance rule

Treat the main repository documentation as authoritative. When product behavior changes, update the relevant source documentation and wiki summary together so the wiki never becomes a competing source of truth.