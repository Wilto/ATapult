import chalk from 'chalk';

const getDocuments = async (agent, publicationUri) => {
  const docs = await agent.com.atproto.repo.listRecords({
    repo: agent.did,
    collection: "site.standard.document",
    limit: 100,
  });
  return docs.data.records
    .filter((r) => r.value.site === publicationUri)
    .map((r) => ({ ...r.value, rkey: r.uri.split( "/" ).pop() }));
};

const pushDocument = async ( agent, publicationUri, action, doc ) => {
  const res = await agent.com.atproto.repo[ action ]({
    repo: agent.did,
    collection: "site.standard.document",
    rkey: doc.rkey,
    record: {
      $type: "site.standard.document",
      site: publicationUri,
      title: doc.title,
      publishedAt: new Date( doc.publishedAt ).toISOString(),
      path: doc.path,
      description: doc.description,
      textContent: doc.textContent,
    },
  });

  console.log( `${ chalk.blue( doc.rkey ) } ${ doc.path } ${ chalk.green( action === "createRecord" ? "created" : "updated" ) }.` );
  return res;
};

export const createOrUpdateDocuments = async ( agent, publicationUri, docs ) => {
  const existingDocs = {};
  for( const oldDoc of await getDocuments( agent, publicationUri ) ) {
    existingDocs[ oldDoc.rkey ] = oldDoc;
  }
  console.log( chalk.bold( `Documents` ) );
  for( const newDoc of docs ) {
    const oldDoc = existingDocs[ newDoc.rkey ];
    if( !oldDoc ) {
      await pushDocument(agent, publicationUri, "createRecord", newDoc);
    } else if (
      [ "title", "description", "textContent" ].some((field) =>
        oldDoc[ field ] !== newDoc[ field ] || oldDoc.publishedAt !== newDoc.publishedAt.toISOString()
      )
    ) {
      await pushDocument(agent, publicationUri, "putRecord", newDoc);
    } else {
      console.log( `${ chalk.blue( oldDoc.rkey ) } ${ oldDoc.path } ${ chalk.dim( `already exists` ) }.` );
    }
  }
};
