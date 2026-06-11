import fs from "fs";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { stdin, stdout, process } from "node:process";
import { createInterface } from "node:readline/promises";
import { Agent, CredentialSession } from "@atproto/api";
import { create as CreateTID, now as GenerateTID } from "@atcute/tid";

import { createOrUpdatePublication } from "./publication.js";
import { createOrUpdateDocuments } from "./documents.js";

import chalk from 'chalk';

function pubUriFromFile( wellKnownFilePath ) {
  return readFile( wellKnownFilePath, { encoding: "utf8" })
    .then( pubUri => {
      if (!pubUri.startsWith( "at://" )) {
        throw Error(`publicationUri must be an at:// protocol URI; this one is ${ pubUri }`);
      }
      return pubUri;
    })
    .catch(e => {
      if (e.code !== "ENOENT") {
        throw e;
      }
    });
}

export const rkeyFromDateString = ( timestamp ) => CreateTID( new Date( timestamp ).getTime(), 512 ); 

export const createOrUpdateStandardSite = async (
  session,
  pub,
  docs,
  opts
) => {
  const agent = new Agent( session );
  const { pathname } = pub.url;
  const wellKnown = `${ opts?.baseFolder || `` }/.well-known/site.standard.publication${ pathname === "/" ? `` : `${ pathname }/index.html` }`;
  const publicationUri = await pubUriFromFile( wellKnown );

  const validateAndAddDocumentRkeys = ( docs ) => {
    for (const doc of docs) {
      if( !doc.publishedAt ) {
        throw Error(`publishedAt not found for doc ${ doc.path }`);
      }
      if( !doc.path ) {
        throw Error(`path not found for doc ${ doc.title || JSON.stringify(doc)}`);
      }
      if( !doc.title ) {
        throw Error(`title not found for doc ${ doc.path }`);
      }

      doc.rkey = rkeyFromDateString( doc.publishedAt );
    }
    return docs;
  };

  docs.sort( (a, b) => a.publishedAt < b.publishedAt ? 1 : -1 );

  const newDocs = validateAndAddDocumentRkeys( docs );
  const addLinkText = `Add the following link tags to your publication landing page and document pages:

<link 
  rel="site.standard.publication"
  href="at://${ agent.did }/site.standard.publication/${ pub.rkey }">

And add the following to each of your document pages using the corresponding TID values:

<link 
  rel="site.standard.document"
  href="at://${ agent.did }/site.standard.document/[TID]">
`;

  if( !publicationUri ) {
    if( !stdout.isTTY || process.env.CI ) {
      console.error( `No publication URI found in ${ wellKnown }. Run this script locally to set things up.` );
      process.exit( 1 );
    }
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(`
${ chalk.bold( `Publication` ) }
${ chalk.blue( pub.rkey ) } ${ pub.url }
${ pub.publishedAt === undefined && console.log( `Without a \`publishedAt\`, the TID of your publication will change on every update.` ) }

${ chalk.bold( `Documents` ) }
${ newDocs.map( ( d ) => {
  return `${ chalk.blue( rkeyFromDateString( d.publishedAt ).toString() ) } ${ chalk.dim( pub.url ) }${ d.path }`;
}).join( "\n" ) }

Are all the above paths correct? (y/n)
`);
    rl.close();
    stdin.destroy();
    if( answer.toLowerCase() === "y" || answer.toLowerCase() === "yes" ) {
      await fs.mkdir( dirname( wellKnown ), { recursive: true });
      await fs.writeFile(wellKnown, `at://${agent.did}/site.standard.publication/${ pub.rkey }`);
      console.log( `Successfully wrote ${ chalk.green( wellKnown ) }.` );
      console.log( `
Next time you run this script, your publication and documents will be published to the Atmosphere, 
and those records will be added or updated (if changed) on all subsequent runs.
${ addLinkText }
`);
    }
  } else {
    console.log( `.well-known file found at ${ wellKnown }` );
    const tid = pub.rkey || ( pub.publishedAt ? CreateTID( pub.publishedAt.getTime(), 512 ) : GenerateTID() );

    await createOrUpdatePublication( agent, { ...pub, rkey: tid } );
    if( !pub.rkey && ! pub.publishedAt ) {
      console.log( `Without specifying an explicit \`rkey\` or \`publishedAt\` value, this generated \`rkey\` will change on republish.\n`);
    }
    await createOrUpdateDocuments( agent, publicationUri, newDocs );
    console.log( chalk.green( `
Published successfully.` ) );
  }
};

export const ATapult = async ( config, publicationRecord, documentRecords ) => {
  if( !config.credentials.password ) {
    console.error( 'Not gonna get far without a password.' );
    process.exit( 1 );
  }

  try {
    const session = new CredentialSession( config.url );

    await session.login( config.credentials );
    await createOrUpdateStandardSite( session, publicationRecord, documentRecords, {
      'baseFolder' : './src'
    });
  } catch (error) {
    console.error( `ATProto sync failed.
  Error ${ error.status }` );

    if( process.env.CI ) {
      console.warn( 'Skipping ATProto sync during build' );
      process.exit( 0 );
    }
    throw error;
  }
};