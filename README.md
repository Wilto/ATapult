## ATapult
_With credit to [@eaton](https://github.com/eaton) for the name._

A script that generates (or updates) [Standard.Site](https://standard.site/) records, allowing you to syndicate your website across the ATmosphere. 

<img src="./screenshot.jpg" alt="wilto@blues: ~/Sites/w-new on main
$ npm run --silent atproto
.well-known file found at ./src/.well-known/site.standard.publication/posts/index.html

Publication
223nhvhpe22k2 https://wil.to/posts already exists.

Documents
223numciw22k2 /automating-standard-site/ already exists.
223nu7gjd22k2 /standard-site/ already exists.
223nt3exb22k2 /llemdashes/ already exists.
223nsyskk22k2 /megamanathon-2/ already exists.
223nrxdf722k2 /googles-prompt-api/ already exists.
223nh6c4v22k2 /interesting-times/ already exists.
223my7e7722k2 /the-cloffice/ already exists.
223mdwi2322k2 /switching-to-a-framework-and-ubuntu/ already exists.

Published successfully.">

Be sure to check out [Implementing Standard.Site](https://wil.to/posts/standard-site/) for the general idea, use cases, and manual record-creation process, just to get your bearings, and eep [PDSIs](https://pdsls.dev/) and the [Standard.Site Validator](https://site-validator.fly.dev/) handy to validate your results. Provide it with your [PDS credentials](https://atproto.com/guides/self-hosting#pds), a [Publication record](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L24), and your [Document records](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L44), like so:

```jsx
await ATapult({
  credentials: {
    identifier: "wil.to",
    password: process.env.ATPROTO_PASSWORD
  },
  url: new URL( "https://bsky.social" )
}, publicationRecord, documentRecords );
```

Have a look at [the example](/Wilto/ATapult/blob/main/example/update-records.js) to see how I'm using it on my website, which is: grab all the Markdown files from a directory, parse out their frontmatter, filter out any marked as a draft or a post that just links to an external article, and publish ’em.

On the first run, this script 

This script creates new Document records with `rkey` based on the date provided in [`publishedAt` field](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L52), and a Publication record with an [explicit `rkey`](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L27) or one based on a [`publishedAt` value](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L26) on the [PDS you specify](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L67). It also generates a [`.well-known` file](https://standard.site/docs/quick-start/#3-verify-the-publication) that corresponds with your specified [Publication URL](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L25).

The terminal output includes the paths and [record keys](https://atproto.com/specs/record-key) for your [Publication](https://standard.site/docs/lexicons/publication/) and its [Documents](https://standard.site/docs/lexicons/document/), the `link` tags you'll need in the `head` of the Publication/Document pages.
