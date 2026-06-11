## ATapult
_With credit to [@eaton](https://github.com/eaton) for the name._

A script that generates (or updates) [Standard.Site](https://standard.site/) records, allowing you to syndicate your website across the ATmosphere. Be sure to check out [Implementing Standard.Site](https://wil.to/posts/standard-site/) for the general idea, use cases, and manual record-creation process, just to get your bearings, and eep [PDSIs](https://pdsls.dev/) and the [Standard.Site Validator](https://site-validator.fly.dev/) handy to validate your results.

Provide it with your [PDS credentials](https://atproto.com/guides/self-hosting#pds), a [Publication record](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L24), and your [Document records](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L44), like so:

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

This script creates new Document records with `rkey` based on the date provided in [`publishedAt` field](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L52), and a Publication record with an [explicit `rkey`](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L27) or one based on a [`publishedAt` value](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L26) on the [PDS you specify](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L67). It also generates a [`.well-known` file](https://standard.site/docs/quick-start/#3-verify-the-publication) that corresponds with your specified [Publication URL](https://github.com/Wilto/ATapult/blob/main/example/update-records.js#L25).

The terminal output includes the paths and [record keys](https://atproto.com/specs/record-key) for your [Publication](https://standard.site/docs/lexicons/publication/) and its [Documents](https://standard.site/docs/lexicons/document/), the `link` tags you'll need in the `head` of the Publication/Document pages.
