---
title: "Things you need to do for npm trusted publishing to work"
tags:
  - javascript
  - npm
image: ../../assets/posts/npm-trusted-publisher.png
imageAlt: "The npm logo with a big question mark behind it."
imageWidth: 1920
imageHeight: 600
pubDate: "2026-01-31"
---

After the recent supply chain attacks on the npm ecosystem, notaby the [Shai-Hulud 2.0 worm](https://securitylabs.datadoghq.com/articles/shai-hulud-2.0-npm-worm/), [GitHub took a number of actions](https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/) to shore up the security of publishing packages to hopefully avoid further attacks. One of the outcomes was that long-lived npm tokens were revoked in favour of short-lived tokens or using trusted publishing.

I have GitHub Actions set up to publish new versions of npm packages that I maintain when a new tag is pushed to the repository. This workflow used long-lived npm tokens to authenticate, so when it came to updating a package recently I needed to update the publishing method too. The [npm documentation on trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers) was useful to a point, but there were some things I needed to do that the docs either didn't cover explicitly or weren't obvious enough, to get my package published successfully. I also came across [this thread on GitHub where other people had similar issues](https://github.com/npm/cli/issues/8730). I wanted to share those things here.

## TL;DR

Briefly, the changes that worked for me were to add the following to my GitHub Action publishing workflow:

```yaml
# Permission to generate an OIDC token
permissions:
  id-token: write

jobs:
  publish:
    steps:
      ...
      # Ensure the latest npm is installed
      - run: npm install -g npm@latest
      ...
      # Add the --provenance flag to the publish command
      - run: npm publish --provenance
```

And ensure that the _package.json_ refers to the correct repository:

```json
{
  ...
  "repository": {
    "type": "git",
    "url": "git+https://github.com/${username}/${packageName}.git",
  },
  ...
}
```

For a bit more detail and alternative ways to set some of these settings, read on.

## Package settings

Ok, so this is embarrassing, but initially I couldn't find the settings I needed to enable trusted publishing. The npm docs say:

> Navigate to your package settings on npmjs.com and find the "Trusted Publisher" section.

I spent far too long looking around the `https://www.npmjs.com/settings/${username}/packages` page for the "Trusted Publisher" section. What I needed was the specific package settings, available here: `https://www.npmjs.com/package/${packageName}/access`.

You need to set up trusted publishing for each of your packages individually. That might be fine if you only maintain a few, it's going to be a huge hassle if you have a lot.

Once you have filled in the trusted publisher settings, then its on to updating your project so that it can be published successfully.

## Permissions

This is in the npm docs, so I'm just including it for completeness. You need to [give the workflow permission to generate an OIDC token](https://docs.npmjs.com/trusted-publishers#github-actions-configuration) that it can then use to publish the package. To do this requires one permission being set in your workflow file.

```yaml
permissions:
  id-token: write
```

## npm version

The docs clearly call out that:

> Note: Trusted publishing requires [npm CLI](https://docs.npmjs.com/cli/v11) version 11.5.1 or later.

I needed to upgrade the version of npm used by my GitHub Actions workflow, so I added a simple step to install the latest version of npm as part of the run before publishing:

```yaml
- run: npm install -g npm@latest
```

## Automatic provenance

The docs also say:

> When you publish using trusted publishing, npm automatically generates and publishes [provenance attestations](https://docs.npmjs.com/generating-provenance-statements) for your package. This happens by default—you don't need to add the --provenance flag to your publish command.

I did not find this to be the case. I needed to add the `--provenance` flag so that my package would publish successfully.

```yaml
run: npm publish --provenance
```

This was something that [seemed to help others](https://github.com/npm/cli/issues/8730#issuecomment-3538909998) too. You may only need to pass `--provenance` the first time, with it continuing to work automatically beyond that, but it can't hurt to keep it in your publish script (for when you need to update another package and you copy things over).

You can also set your package to generate provenance attestations on publishing by setting the [`provenance` option in `publishConfig`](https://docs.npmjs.com/cli/v11/using-npm/config#provenance) in your _package.json_ file.

```json
{
  ...
  "publishConfig": {
    "provenance": true
  }
  ...
}
```

Or you can set the `NPM_CONFIG_PROVENANCE` environment variable.

```yaml
env:
  NPM_CONFIG_PROVENANCE: true
run: npm publish
```

## Repository details

Finally, I don't know if this last part helped as I did already have it set, but [others in this GitHub thread](https://github.com/npm/cli/issues/8730#issuecomment-3544738786) found that setting the [`repository` field in the package's _package.json_](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#repository) to specifically point to the GitHub repository also helped.

```json
{
  ...
  "repository": {
    "type": "git",
    "url": "git+https://github.com/${username}/${packageName}.git",
  },
  ...
}
```

When you set up your trusted publisher in npm you do have to provide the repository details, so it makes sense to me that the package should agree with those details too.

## Keep the ecosystem safe

Short-lived tokens, trusted publishing, and provenance all help keep the entire ecosystem safe. If you've read this far, it is because you are also updating your packages to publish with this method

I know there are people out there with many more packages, and packages that are much more popular than any of mine, but I hope this helps. It does amuse me that I went through this for [a package that I'm pretty sure I'm the only user of](https://www.npmjs.com/package/@philnash/resend), but at least I now know how to do it for the future.

I hope to see trusted publishing continue to expand to more providers, it is limited to GitHub and GitLab at the time of writing, and to be used by more packages. And I hope to see fewer worms charging through the package ecosystem and threatening all of our applications in the future.
