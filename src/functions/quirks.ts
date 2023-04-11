import { getDatabaseNames, hasDatabasesNative } from "../helpers/database-enumerator";
import { maxString } from '../globals/constants';
import { _global } from "../globals/global";
import Promise from "../helpers/promise";

export function safariMultiStoreFix(storeNames: string[]) {
  return storeNames.length === 1 ? storeNames[0] : storeNames;
}

export let getMaxKey = (IdbKeyRange: typeof IDBKeyRange) => {
  try {
    IdbKeyRange.only([[]]);
    getMaxKey = () => [[]];
    return [[]];
  } catch (e) {
    getMaxKey = () => maxString;
    return maxString;
  }
}

/**
 * Work around Safari 14 IndexedDB open bug.
 * https://bugs.webkit.org/show_bug.cgi?id=226547
 *
 * Safari has a horrible bug where IDB requests can hang while the browser is starting up.
 * The only solution is to keep nudging it until it's awake.
 * @package safari-14-idb-fix
 */
export let safari14Workaround = (indexedDB) => {

  if (!(safari14Workaround as any).pending) {
    let timer;

    (safari14Workaround as any).pending = new Promise((resolve) => {
      if (hasDatabasesNative(indexedDB)) {
        const isSafari = _global.safari
            || (
                typeof navigator !== 'undefined'
                // @ts-ignore
                && !navigator.userAgentData
                && /Safari\//.test(navigator.userAgent)
                && !/Chrom(e|ium)\//.test(navigator.userAgent)
            );

        // No point putting other browsers or older versions of Safari through this mess.
        if (isSafari) {
          const tryIdb = () => getDatabaseNames({ indexedDB, IDBKeyRange: null }).finally(resolve);
          timer = setInterval(tryIdb, 100);
          return tryIdb();
        }
      }
      resolve();
    }).finally(() => {
      clearInterval(timer);
      safari14Workaround = () => Promise.resolve();
    });
  }

  return (safari14Workaround as any).pending;
}
