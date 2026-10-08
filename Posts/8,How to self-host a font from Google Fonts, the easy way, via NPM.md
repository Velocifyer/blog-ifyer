---
title: How to self host a font from Google Fonts, the easy way, via NPM
dates:
  - "2026-10-08"
tags: post
layout: post
has-dates: true
description: "Self hosting a font with NPM is way easier than doing it the normal way."
---
In one of my previous posts (<a href="/Posts/3,How to self host a font from google fonts/">How to self host a web font from google fonts</a>) ,
 I taught you how to do it manually.


The advantage to doing it this way instead of hot linking is speed and privacy.

It turns out that there is an easier way to do it, with NPM.

Here's how to do it.

## Setup NPM

> [!NOTE]
> **Only do this if you haven't set up NPM for this already**

1. Run `npm init`.
2. Add node_modules to .gitignore (or equivelent).
3. Other developers (or CI) should run `npm ci` before using your code.

## Get the font package name and install the font
> [!NOTE]
> This guide is designed for variable fonts. The steps should be simaler for non variable fonts.

1. Go to [fontsource.org](https://fontsource.org/), and search for the font you want(eg `Google Sans Flex`).
2. Click on "Get Font".
3. Click on "Developer Setup".
4. It should give you a command like `npm install @fontsource-variable/google-sans-flex`; run that command.
5. Copy the part after `npm install` (eg copy `@fontsource-variable/google-sans-flex`); this will now be refered to as $FONT_PACKAGE.
6. There should be a folder `./node_modules/$PACKAGE_NAME`. If you have a SSG or something, set that folder (and the files subdirectory) to passthrough

## Start using the font.

1. Decide which axis to use. For this example, we will only use wght.
2. For each axis, import the CSS from `./node_modules/PACKAGE_NAME`.

For this blog, we do:
```html
<link rel="stylesheet" href="/node_modules/@fontsource-variable/google-sans-flex/wght.css">
```

3. Ensure that your use of the font is license compliant. (the license is in `./node_modules/PACKAGE_NAME/LICENSE`; you may have to link to it)
4. Find the name used for the font-family from from the font-family rule in the CSS you are importing.
5. Using [the font-family CSS rule](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-family), use the font.

