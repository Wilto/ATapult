import chalk from "chalk";
import { Buffer } from "node:buffer";
const themeKeys = [
  "background",
  "foreground",
  "accent",
  "accentForeground"
];
const getPublication = async (agent, rkey) => {
  try {
    const pub = await agent.com.atproto.repo.getRecord({
      repo: agent.did,
      collection: "site.standard.publication",
      rkey
    });
    return pub.data.value;
  } catch (e) {
    if (e.error === "RecordNotFound") {
      return;
    } else {
      throw e;
    }
  }
};
const pushPublication = async (agent, action, pub) => {
  const theme = pub.basicTheme;
  const basicTheme = theme ? {
    "$type": "site.standard.theme.basic",
    ...Object.fromEntries(
      themeKeys.map((key) => [key, { ...theme[key], $type: "site.standard.theme.color#rgb" }])
    )
  } : void 0;
  let icon;
  if (pub.icon && "blob" in pub.icon) {
    const res2 = await agent.com.atproto.repo.uploadBlob(
      new Uint8Array(pub.icon.blob),
      { encoding: pub.icon.mimeType }
    );
    console.log("Uploaded new icon");
    const { mimeType, ref, size } = res2.data.blob;
    icon = {
      $type: "blob",
      ref: { $link: ref.toString() },
      mimeType,
      size
    };
  } else {
    icon = pub.icon;
  }
  const res = await agent.com.atproto.repo[action]({
    repo: agent.did,
    collection: "site.standard.publication",
    rkey: pub.rkey,
    record: {
      $type: "site.standard.publication",
      url: pub.url.toString(),
      name: pub.name,
      description: pub.description,
      icon,
      basicTheme,
      preferences: { showInDiscover: true }
    }
  });
  console.log(chalk.bold(`
Publication`));
  console.log(`${chalk.blue(pub.rkey)} ${pub.url.toString()} ${chalk.green(action === "createRecord" ? "created" : "updated")}.
`);
  return res;
};
export const comparePublicationRecords = (oldPub, pub) => {
  const { icon: oldIcon, basicTheme: oldTheme } = oldPub;
  const iconChanged = oldIcon?.size !== (pub.icon ? Buffer.byteLength(pub.icon.blob) : void 0);
  const newTheme = pub.basicTheme;
  const themeChanged = themeKeys.some(
    (key) => oldTheme?.[key].r !== newTheme?.[key].r || oldTheme?.[key].g !== newTheme?.[key].g || oldTheme?.[key].b !== newTheme?.[key].b
  );
  const stringFieldChanged = oldPub.name !== pub.name || oldPub.description !== pub.description;
  return iconChanged || themeChanged || stringFieldChanged ? iconChanged ? pub : { ...pub, icon: oldIcon } : void 0;
};
export const createOrUpdatePublication = async (agent, pub) => {
  const oldPub = await getPublication(agent, pub.rkey);
  if (!oldPub) {
    await pushPublication(agent, "createRecord", pub);
  } else {
    const changedPub = comparePublicationRecords(oldPub, pub);
    if (changedPub) {
      await pushPublication(agent, "putRecord", changedPub);
    } else {
      console.log(`
${chalk.bold(`Publication`)}`);
      console.log(`${chalk.blue(pub.rkey)} ${pub.url.toString()} ${chalk.dim(`already exists`)}.
`);
    }
  }
};
