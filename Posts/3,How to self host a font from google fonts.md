---
title: How to self-host a web font from Google Fonts
dates:
  - "2025-09-14"
  - "2025-09-15"
  - "2026-02-27"
  - "2026-10-08"
tags: post
layout: post
description: "Here's how to self-host a web font from Google Fonts"
width: 53em
has-dates: true
---

A common place to get a web font is <a href="https://fonts.google.com/" referrerpolicy="no-referrer">Google Fonts</a>.
If you want to use a font from Google Fonts, you should not just paste the code they give you because that would leak the IP addresses of visitors to Google.

Instead, you should download the font files and put them on your webserver.

Do not use the download button on Google Fonts becasue the download button in Google Fonts gives TTF files and not WOFF2 files.
WOFF2 files are better because they are compressed and because Google Fonts subsets them.

        <!--If you want a font used on this website(like Noto Sans(the best font) and Fira Code), follow the instructions in the README from <a href="https://codeberg.org/Velocifyer/Blog-ifyer/src/branch/main/Assets/Fonts/" referrerpolicy="no-referrer-when-downgrade" ping="https://blog.velocifyer.com/clicked+link+to+codeberg+fonts">
        here
    </a> and skip steps 0 and 1.<br/> -->
<strong>THIS IS NOT LEGAL ADVICE</strong><br/>
<strong>I AM NOT YOUR LAWYER</strong>
<strong>ENSURE THAT YOUR USE OF THE FONT WILL COMPLY WITH THE LICENSE</strong>
## Download the font
<ol start="0">
	<li>
		Go to <a href="https://fonts.google.com/" referrerpolicy="no-referrer">Google Fonts</a> and search for the font you want.
	</li>
	<li>
		Select "Get font".
	</li>
	<li>
		Select "Get embed code" (don't paste the code it gives you).
	</li>
	<li>
		Select which options you want included.
	</li>
	<li>
		In the HTML code it gives you, it should have something like:

```html
<link href="https://fonts.googleapis.com/css2?family=Fira+Code&display=swap" rel="stylesheet">
```
		Download the file using the URL after the href in that element (
```url
https://fonts.googleapis.com/css2?family=Fira+Code&display=swap
```

in this case)

Download each font referenced in the CSS file you just downloaded.<br/>
Put all of the font you just downloaded in a folder, ideally with a something that will change each update and a long cache time (like /Assets/Fira/Code/2025-8-13/).

Copy the CSS file into that folder.

Change the CSS to use relative links.<br/>
(eg change 
```css
src: url(https://fonts.gstatic.com/s/firacode/v26/uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_D1sJVD7Ng.woff2) format('woff2');
```
into 
```css
src: url(uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_D1sJVD7Ng.woff2) format('woff2');
```

)
	</li>
</ol>

## Use the font
Paste the license of the font into a file. To find the license of a google font do,
<ol start="0">
	<li>Search for the font on <a href="https://fonts.google.com/" referrerpolicy="no-referrer">Google Fonts</a>;</li>
	<li>Select the font;</li>
	<li>Select "License"</li>
</ol>

Add html to use the CSS like:
```html
<link href="/Assets/Fonts/Fira/Code/2025-8-13/fira-code.css" rel="preload"/>
<link href="/Assets/Fonts/Fira/Code/2025-8-13/fira-code.css" rel="stylesheet"/>
```
				
Add css to use the font like:
```css
code {
font-family: "Fira Code", monospace;
font-optical-sizing: auto;
font-weight: 400;
font-style: normal;
}
```

Add a link to the font LICENSE and **ensure that your usage of the font follows the license of the font**.
    <!-- If you can't understand these steps, <a href="https://codeberg.org/Velocifyer/Blog-ifyer/src/branch/main/Assets/Fonts/Noto/Sans" referrerpolicy="no-referrer-when-downgrade" ping="https://blog.velocifyer.com/clicked+other+link+to+codeberg+fonts">
        see how it was done here.
    </a> -->
