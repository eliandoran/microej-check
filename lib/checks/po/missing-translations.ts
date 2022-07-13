import Log, { LogLevel } from "../../log";
import { PoFile } from "./po";
import { formatArrayAsBulletedList, parseTranslationDomain } from "./utils";

interface TranslationContext {
  poFiles: PoFile[];
  log: Log;
  logLevel: LogLevel
}

export default function checkForMissingTranslations(context: TranslationContext) {
  const domainMsgids = groupMsgidsByDomain(context);
  
  for (const domain of Object.keys(domainMsgids)) {
    for (const poFile of context.poFiles) {
      let missingTranslations: string[] = [];

      const poDomain = parseTranslationDomain(poFile.path);
      if (poDomain !== domain) {
        continue;
      }

      for (const msgid of domainMsgids.get(domain)) {
        const translation = poFile.messages.get(msgid);
        if (!translation || translation.msgstr.trim().length == 0) {
          missingTranslations.push(msgid);  
        }
      }

      if (missingTranslations.length > 0) {
        context.log.log(context.logLevel, `${domain}@${poFile.languageCode}: Missing translations with msgids:\n${formatArrayAsBulletedList(missingTranslations)}`, {
          file: poFile.path
        });
      }
    }
  }
}

function groupMsgidsByDomain(context: TranslationContext): Map<string, Set<string>> {
  const domainMsgids = new Map<string, Set<string>>();

  for (const poFile of context.poFiles) {
    const path = poFile.path;
    const translationDomain = parseTranslationDomain(path);
    
    if (!domainMsgids.get(translationDomain)) {
      domainMsgids.set(translationDomain, new Set());
    }

    const msgids = domainMsgids.get(translationDomain);
    for (const msgid of Object.keys(poFile.messages)) {
      msgids.add(msgid);
    }
  }

  return domainMsgids;
}
