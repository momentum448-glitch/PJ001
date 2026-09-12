# PJ001 Playtest Deployment

## Goal
Provide a stable browser URL for Android play-testing before further combat implementation.

## Deployment target
GitHub Pages using GitHub Actions.

Expected URL:

`https://momentum448-glitch.github.io/PJ001/`

## Automatic deploy behavior
Every push to `main` triggers `.github/workflows/deploy-pages.yml`.

The workflow:
1. checks out the repository
2. installs dependencies
3. builds the Vite project
4. uploads `dist/`
5. deploys the artifact to GitHub Pages

## Required repository setting
GitHub Pages must use **GitHub Actions** as its publishing source:

Repository `Settings` -> `Pages` -> `Build and deployment` -> `Source` -> `GitHub Actions`

This setting is repository-level configuration and may need to be enabled manually if it has not already been configured.

## Vite path
Because this is a project Pages site, Vite uses `base: '/PJ001/'` so generated asset URLs resolve correctly under the repository subpath.

## Definition of done for M0.5
- production build succeeds
- Pages deployment succeeds
- expected playtest URL opens on Android Chrome
- player can see the game shell, move with the touch joystick, and press ATTACK
- future merges to `main` automatically update the playtest URL
