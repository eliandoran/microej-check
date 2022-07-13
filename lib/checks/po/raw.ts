import Log, { LogLevel } from "../../log";
import { formatArrayAsBulletedList, parseTranslationDomain } from "./utils";

const languageRegex = /^\"Language:\s*(\w*_\w*)/gm;

interface PoRawContext {
    poFilePath: string;
    poFileContents: string;
    log: Log;
    logLevel: LogLevel;
}

export default function checkForStructuralIssues(context: PoRawContext) {
    const msgids = new Set<string>();
    const msgidRegex = /^msgid\s*\"(.*)\"\s*$/gm;
    const poFile = context.poFileContents;
    const poPath = context.poFilePath;
    const poDomain = parseTranslationDomain(poPath);
    const languageMatch = languageRegex.exec(poFile);

    if (!languageMatch || languageMatch.length < 2) {
        context.log.error("The .po file has no language code defined.", {
            file: poPath
        });
        return;
    }

    const languageCode = languageMatch[1];

    const duplicateMsgids: string[] = [];
    let msgidMatch;

    do {
        msgidMatch = msgidRegex.exec(poFile);

        if (msgidMatch) {
            const msgid = msgidMatch[1];

            if (!msgids.has(msgid)) {
                msgids.add(msgid);
            } else {
                // Found duplicate key, raise an error.
                duplicateMsgids.push(msgid);
            }
        }
    } while (msgidMatch);

    if (duplicateMsgids.length > 0) {
        context.log.log(context.logLevel, `${poDomain}@${languageCode}: Duplicate msgids:\n${formatArrayAsBulletedList(duplicateMsgids)}`, {
            file: poPath
        });
    }

}
