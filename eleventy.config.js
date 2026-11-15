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
const FLATTEN_PREFIX = "--flatten-";

const isWhitespace = (token) => token.type === "token" && token.value.type === "white-space";

function trimTokens(tokens) {
    let start = 0;
    let end = tokens.length;

    while (start < end && isWhitespace(tokens[start])) {
        start++;
    }

    while (end > start && isWhitespace(tokens[end - 1])) {
        end--;
    }

    return tokens.slice(start, end);
}
function collectFlattened(code, filename) {
    const definitions = new Map();

    transform({
        filename,
        code,
        visitor: {
            Declaration: {
                custom(property) {
                    if (!property.name.startsWith(FLATTEN_PREFIX)) {
                        return;
                    }

                    const value = trimTokens(property.value);
                    const previous = definitions.get(property.name);

                    if (previous && JSON.stringify(previous) !== JSON.stringify(value)) {
                        console.warn(`inlineCss: ${property.name} is defined more than once in ${filename}, the last definition is used`);
                    }

                    definitions.set(property.name, value);
                },
            },
        },
    });

    return definitions;
}

function expandTokens(tokens, definitions, filename, trail = []) {
    return tokens.flatMap((token) => {
        if (token.type !== "var") {
            return [token];
        }

        const name = token.value.name.ident;

        if (!name.startsWith(FLATTEN_PREFIX)) {
            return [token];
        }

        if (trail.includes(name)) {
            throw new Error(`inlineCss: circular reference through ${name} in ${filename}`);
        }

        if (definitions.has(name)) {
            return expandTokens(definitions.get(name), definitions, filename, [...trail, name]);
        }

        if (token.value.fallback) {
            return expandTokens(token.value.fallback, definitions, filename, [...trail, name]);
        }

        console.warn(`inlineCss: ${name} is used in ${filename} but never defined, left unchanged`);
        return [token];
    });
}


module.exports = async function(eleventyConfig) {

	// {{inlineCss}}
	    const written = new Set();
    let inputDir = null;
    let includesDir = null;
    let outputDir = null;
	function resolveCssFile(file) {
    const candidates = [
        path.resolve(includesDir, file),
        path.resolve(inputDir, file),
    ];

    const found = candidates.find((candidate) => fs.existsSync(candidate));

    if (!found) {
        throw new Error(`inlineCss: "${file}" not found. Looked in:\n${candidates.join("\n")}`);
    }

    return found;
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

	 eleventyConfig.addShortcode("inlineCss", function (file) {
        const filename = resolveCssFile(file);
        const sourceName = path.relative(inputDir, filename).split(path.sep).join("/");
        const code = fs.readFileSync(filename);
        const definitions = collectFlattened(code, sourceName);

        const result = transform({
            filename: sourceName,
            code,
            minify: true,
            sourceMap: true,
            visitor: {
                Url(url) {
                    return {
                        ...url,
                        url: absolutizeUrl(url.url, path.dirname(filename), inputDir),
                    };
                },
                Variable(variable) {
                    if (!variable.name.ident.startsWith(FLATTEN_PREFIX)) {
                        return;
                    }

                    return expandTokens([{ type: "var", value: variable }], definitions, sourceName);
                },
                Declaration: {
                    custom(property) {
                        if (property.name.startsWith(FLATTEN_PREFIX)) {
                            return [];
                        }
                    },
                },
            },
        });

        const hash = crypto
            .createHash("sha256")
            .update(result.map)
            .digest("hex")
            .slice(0, 12);
        const mapName = `${MAP_DIR}/${path.basename(file, ".css")}.${hash}.css.map`;

        if (!written.has(mapName)) {
            const mapPath = path.join(outputDir, mapName);
            fs.mkdirSync(path.dirname(mapPath), { recursive: true });
            fs.writeFileSync(mapPath, result.map);
            written.add(mapName);
        }

        const css = result.code.toString().trim();

        return `${css}\n/*# sourceMappingURL=/${mapName} */`;
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
