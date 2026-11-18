const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { IdAttributePlugin } = require("@11ty/eleventy");
const { feedPlugin } = require("@11ty/eleventy-plugin-rss");
const { HtmlBasePlugin } = require("@11ty/eleventy");
const MarkdownItGitHubAlertsModule = require("markdown-it-github-alerts");
const MarkdownItGitHubAlerts = MarkdownItGitHubAlertsModule.default ?? MarkdownItGitHubAlertsModule;
const htmlmin = require("html-minifier-terser");
const pluginTOCModule = require('@uncenter/eleventy-plugin-toc');
const pluginTOC = pluginTOCModule.default ?? pluginTOCModule;
const markdownItAnchor = require("markdown-it-anchor");
const eleventyAutoCacheBuster = require("eleventy-auto-cache-buster");
const fs = require("node:fs");
const path = require("node:path");
const { transform } = require("lightningcss");
const CleanCSS = require("clean-css");
const { minify: minifyJs } = require("terser");
const { minify } = require("html-minifier-terser");
const crypto = require("node:crypto");
const MAP_DIR = "sourcemaps";

const metadata = {
  language: "en",
  title: "Blog-Ifyer",
  subtitle: "Velocifyer's Blog.",
  base: "https://blog.velocifyer.com",
  author: { name: "Velocifyer" },
};
const collection = { name: "post", limit: 50 };

//	{{inlineCss}}
const isRelative = (url) => !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(url);
function absolutizeUrl(url, cssDir, inputDir) {
    if (!isRelative(url)) {
        return url;
    }

    const match = url.match(/^([^?#]*)(.*)$/);
    const target = path.resolve(cssDir, match[1]);
    const relative = path.relative(inputDir, target);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        console.warn(`inlineCss: ${url} resolves outside the input directory, left unchanged`);
        return url;
    }

    return "/" + relative.split(path.sep).join("/") + match[2];
}


module.exports = async function(eleventyConfig) {

	// {{inlineCss}}
	    const written = new Set();
    let inputDir = null;
    let includesDir = null;
    let outputDir = null;

    function resolveAssetFile(file) {
        const relativeFile = file.replace(/^\/+/, "");
        const candidates = [
            path.resolve(includesDir, relativeFile),
            path.resolve(inputDir, relativeFile),
        ];

        const found = candidates.find((candidate) => fs.existsSync(candidate));

        if (!found) {
            throw new Error(`inline asset: "${file}" not found. Looked in:\n${candidates.join("\n")}`);
        }

        return found;
    }

    function writeMap(map, file, extension) {
        const hash = crypto.createHash("sha256").update(map).digest("hex").slice(0, 12);
        const mapName = `${MAP_DIR}/${path.basename(file, extension)}.${hash}${extension}.map`;

        if (!written.has(mapName)) {
            const mapPath = path.join(outputDir, mapName);
            fs.mkdirSync(path.dirname(mapPath), { recursive: true });
            fs.writeFileSync(mapPath, map);
            written.add(mapName);
        }

        return mapName;
    }

    eleventyConfig.on("eleventy.before", ({ dir }) => {
        inputDir = path.resolve(dir.input);
        outputDir = path.resolve(dir.output);

        // dir.includes may be relative to the input directory or to the
        // working directory, depending on the Eleventy version.
        const direct = path.resolve(dir.includes);
        const inInput = path.relative(inputDir, direct);
        includesDir = inInput.startsWith("..") || path.isAbsolute(inInput)
            ? path.resolve(inputDir, dir.includes)
            : direct;

        written.clear();
    });

    const cleaner = new CleanCSS({
        level: 0,
        rebase: false,
        inline: false,
        sourceMap: true,
        sourceMapInlineSources: true,
    });

    eleventyConfig.addShortcode("inlineCss", function (file) {
        const filename = resolveAssetFile(file);
        const sourceName = path.relative(inputDir, filename).split(path.sep).join("/");

        const rewritten = transform({
            filename: sourceName,
            code: fs.readFileSync(filename),
            minify: false,
            sourceMap: true,
            visitor: {
                Url(url) {
                    return {
                        ...url,
                        url: absolutizeUrl(url.url, path.dirname(filename), inputDir),
                    };
                },
            },
        });

        const output = cleaner.minify({
            [sourceName]: {
                styles: rewritten.code.toString(),
                sourceMap: rewritten.map.toString(),
            },
        });

        if (output.errors.length > 0) {
            throw new Error(`inlineCss: ${sourceName}\n${output.errors.join("\n")}`);
        }

        const mapName = writeMap(output.sourceMap.toString(), file, ".css");

        return `${output.styles.trim()}\n/*# sourceMappingURL=/${mapName} */`;
    });

    eleventyConfig.addAsyncShortcode("inlineJs", async function (file) {
        const filename = resolveAssetFile(file);
        const sourceName = path.relative(inputDir, filename).split(path.sep).join("/");

        const result = await minifyJs(
            { [sourceName]: fs.readFileSync(filename, "utf8") },
            {
                compress: false,
                mangle: false,
                sourceMap: { includeSources: true },
            },
        );

        const mapName = writeMap(result.map, file, ".js");

        return `${result.code}\n//# sourceMappingURL=/${mapName}`;
    });

	eleventyConfig.addPlugin(HtmlBasePlugin);

  	eleventyConfig.setDynamicPermalinks(false); 

  	eleventyConfig.addPassthroughCopy("Assets/**");
   	eleventyConfig.addPassthroughCopy("cursorlag/*");
    eleventyConfig.addPassthroughCopy("Posts/Archives/**");
    eleventyConfig.addPassthroughCopy("_redirects");
    eleventyConfig.addPassthroughCopy("LICENSE");
    eleventyConfig.addFilter("dateTimes", function (dates) {
        return dates.map(date => {
            return `<time datetime="${date}">${date}</time>`;
        }).join(", ");
    });
	eleventyConfig.addPassthroughCopy("node_modules/@fontsource-variable/**");
	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 }   // makes scrollable code blocks keyboard-accessible
	});
	eleventyConfig.addPassthroughCopy("node_modules/@zachleat/heading-anchors/*");

	eleventyConfig.addPassthroughCopy("node_modules/@fontsource/**");
	eleventyConfig.addPassthroughCopy("robots.txt");
	eleventyConfig.addPassthroughCopy("*.asc");
	eleventyConfig.addPassthroughCopy("node_modules/html5shiv/**");
	eleventyConfig.addPassthroughCopy("_headers");

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom",
		outputPath: "/Posts/feed.atom",
		collection,
		metadata,
	});

	eleventyConfig.addPlugin(feedPlugin, {
		type: "rss",
		outputPath: "/Posts/Feeds/rss.xml",
		collection,
		metadata,
	});

	eleventyConfig.addPlugin(feedPlugin, {
		type: "json",
		outputPath: "/Posts/Feeds/feed.json",
		collection,
		metadata,
	});

	eleventyConfig.amendLibrary("md", (mdLib) => {
		mdLib.use(MarkdownItGitHubAlerts);
		mdLib.use(markdownItAnchor);
	});
	eleventyConfig.addPlugin(IdAttributePlugin, {
		// slugify: eleventyConfig.getFilter("slugify"), // default
		// selector: "h1,h2,h3,h4,h5,h6",                // default
	});
	
	// Minify
	eleventyConfig.addTransform("htmlmin", async function (content) {
		if (process.env.ELEVENTY_ENV !== "production") {
			return content;
		}

		if ((this.page.outputPath || "").endsWith(".html")) {
			return await htmlmin.minify(content, {
				collapseWhitespace: true,
				removeComments: false,
				minifyCSS: false,
				minifyJS: true,
			});
		}

		return content;
	});

	
	eleventyConfig.addPlugin(pluginTOC);
    eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
        hashTruncate: 0,  // Desired substring length of the hash. Set to 0 or lower to disable truncating
        hashAlgorithm: "sha256",  // What hash method to pass to the hash function. See Node.js' crypto.createHash documentation.
    });

	return {

	};
};