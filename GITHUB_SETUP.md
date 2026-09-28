# Put Gospel Atlas on GitHub

Create a separate repository named **gospel-atlas**. Keep it alongside your existing `ghergalla.github.io` repository. You do not need to clone an empty repository: the extracted folder is your starting local copy.

## 1. Extract the release

Unzip the download. You should have one folder named `gospel-atlas` containing `README.md`, `package.json`, `app/`, `public/`, and `docs/`.

The commands below assume that folder is at `~/Downloads/gospel-atlas` on your Mac. If it is elsewhere, adjust the first command, or type `cd ` in Terminal and drag the extracted folder into the Terminal window, then press Return.

## 2. Create an empty GitHub repository

1. Sign in at <https://github.com/new>.
2. Choose **ghergalla** as the owner and **gospel-atlas** as the repository name.
3. Suggested description: **Interactive maps and parallel reading of the four Gospels.**
4. Choose **Public** if you are ready to share it. This supports GitHub Pages on a free personal account.
5. Leave **Add a README**, **Add .gitignore**, and **Choose a license** unselected. The package supplies its own README and ignore file. A project-wide code license remains a separate choice.
6. Click **Create repository**.

## 3. Upload from Terminal

Run these commands inside the extracted folder:

```sh
cd ~/Downloads/gospel-atlas
git init
git add .
git commit -m "Initial Gospel Atlas release"
git branch -M main
git remote add origin https://github.com/ghergalla/gospel-atlas.git
git push -u origin main
```

Use your existing GitHub sign-in when prompted. GitHub account passwords do not authenticate HTTPS Git operations; use your configured credential manager, GitHub CLI, or an appropriate access token. Do not put tokens into these commands or project files. If this Mac already pushes to your personal site repository, its existing authentication may work here too.

If Git asks you to set a name or email for commits, configure your chosen identity and repeat the commit. GitHub offers a private `noreply` email address in your account email settings if you prefer that for public commits.

Refresh the repository page. `app/`, `public/`, `data/`, and `docs/` should be directly at the top level. There should not be an extra enclosing `gospel-atlas/` directory in the repository.

## 4. Enable GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Select branch **main** and folder **/docs**.
4. Click **Save**.
5. Wait for the Pages deployment to finish. The Pages settings will show the published URL; a failed deployment has details under **Actions**.

The expected address is:

<https://ghergalla.github.io/gospel-atlas/>

GitHub Pages serves the already-built `docs/` folder; it does not need to run npm. Keep its `.nojekyll` file. Do not select the repository root as the publishing folder.

## 5. Check the public site

- Open Column and Circle views, then click a passage to hold it and inspect the text.
- Search for **Lord's Prayer** and open the Matthew/Luke comparison.
- Switch between BSB, ASV, and Greek; check Greek word meanings.
- Open Analysis and confirm both sections use SBLGNT Greek even when BSB or ASV is selected for reading. Selecting a wording result should open its normalized Greek comparison.
- Open the site on your phone and test the full-screen explorer.

Once it is live, you can add its address to the repository's **About → Website** field and link to it from your existing personal website.

## Future updates

For code or data edits, install Node.js 24 or newer, then run:

```sh
cd ~/Downloads/gospel-atlas
npm ci
npm run verify
git add .
git commit -m "Update Gospel Atlas"
git push
```

The verification command rebuilds `docs/`. The push then triggers the branch-based Pages deployment. A README-only edit does not require rebuilding the site.

## Notes

- All source data and required attributions are included. The original application code has not yet been assigned an open-source license. Do not add a blanket license that purports to replace the data licenses.
- The existing hosted Gospel Atlas is independent of this new repository. Publishing here does not automatically update or remove that site.
- No GitHub repository has been created or uploaded by the release-preparation process.

Official instructions: [Import locally hosted code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github), [configure a Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
