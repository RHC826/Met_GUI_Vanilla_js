//@ts-check

// WARNING: グローバル変数
const setting = {
    tags: false,
    hasImages: true,
    counter: 0,
    /** @type {{objectIDs: number[]; total: number}} */
    res_object: { objectIDs: [], total: 0 },
};

/**
 * id の作品への画像つきリンクを作成する
 * @param {string | null} id
 */
async function append_anchor(id) {
    if (!id) {
        console.error("NO DATA!");
        return;
    }
    const obj = await fetch_content(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
    );
    if ("total" in obj) {
        console.error("想定しないオブジェクトが発見されました");
        return;
    }
    const Element = createAnchorTag(obj);
    document.querySelector("section#display")?.appendChild(Element);
    return obj;
}
/**
 * ドロップダウンリストの要素を作る関数
 * @param {string} id
 * @returns {void}
 */
function append_option(id) {
    const opt = document.createElement("option");
    opt.textContent = id;
    opt.className = "drop_box_item";
    document.querySelector("#drop_select")?.appendChild(opt);
}

/**
 * API を叩く関数。
 * @param {string} path
 * @returns {Promise<{ objectIDs: number[]; total: number; } | { primaryImageSmall: string; objectID: number; title: string; }>} - APIから取得したオブジェクト
 */
async function fetch_content(path) {
    const content = await fetch(path).then((response) => response.json());
    console.log("fetch_content:", content);
    return content;
}

/**
 * 指定されたURLから画像埋め込み要素を生成します。
 * URLが指定されていない場合、代わりにエラーメッセージが含まれたパラグラフ要素が生成されます。
 * @param {string} url - 画像のURL
 * @returns {HTMLImageElement|HTMLParagraphElement} - 画像埋め込み要素またはパラグラフ要素
 */
function createImgTag(url) {
    if (!url) {
        const paragraph = document.createElement("p");
        paragraph.textContent = "❌";
        return paragraph;
    }
    const imgTag = document.createElement("img");
    imgTag.src = url;
    return imgTag;
}

/**
 * 指定されたオブジェクトから画像埋め込み要素を生成します。
 * URLが設定されていない場合、代わりにエラーメッセージが含まれたパラグラフ要素が生成されます。
 * @param {{primaryImageSmall: string, objectID: number, title: string}} Met_obj - JSON
 * @returns {HTMLAnchorElement|HTMLParagraphElement} - 画像埋め込み要素またはパラグラフ要素
 */
function createAnchorTag(Met_obj) {
    if (!Met_obj.primaryImageSmall) {
        // Click すると消える Error パラグラフ
        const paragraph = document.createElement("p");
        paragraph.textContent = "❌";
        paragraph.className = "Error";
        paragraph.addEventListener("click", () => {
            paragraph.remove();
        });
        return paragraph;
    }
    const imgTag = document.createElement("img");
    const anchorTag = document.createElement("a");
    anchorTag.appendChild(imgTag);
    anchorTag.href = `https://www.metmuseum.org/art/collection/search/${Met_obj.objectID}`;
    imgTag.src = Met_obj.primaryImageSmall;
    imgTag.alt = Met_obj.title;
    return anchorTag;
}

/**
 * ❌ を一度に消す関数
 */
function remove_peke() {
    document.querySelectorAll("p.Error").forEach((res) => res.remove());
}

// ID検索のボタン
document
    .querySelector("button#run_fetch")
    ?.addEventListener("click", async () => {
        /** @type {HTMLSelectElement | null} */
        const word = document.querySelector("#drop_select");
        if (!word) {
            return;
        }
        await append_anchor(word.value);
    });

// ワード検索のボタン
document
    .querySelector("button#run_drop")
    ?.addEventListener("click", async () => {
        // このイベントでやること
        // - objectIDs を得る
        // - ドロップダウンリストの中身を詰める
        // - リンクを表示する
        /** @type {HTMLInputElement | null} */
        const word = document.querySelector("input#input_label");
        if (!word?.value) {
            console.error("NO DATA!");
            return;
        }

        const path =
            setting.tags && setting.hasImages
                ? `https://collectionapi.metmuseum.org/public/collection/v1/search?tags=true&hasImages=true&q=${word?.value}`
                : !setting.tags && setting.hasImages
                ? `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${word?.value}`
                : setting.tags && !setting.hasImages
                ? `https://collectionapi.metmuseum.org/public/collection/v1/search?tags=true&q=${word?.value}`
                : `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${word?.value}`;
        console.log("path:", path);
        const obj = await fetch_content(path);

        // ここからドロップダウンリストの中身を詰める
        if ("title" in obj || obj.objectIDs === null) {
            return;
        }
        setting.res_object = obj;
        setting.res_object.objectIDs = setting.res_object.objectIDs
            .slice()
            .sort(() => 0.5 - Math.random());

        obj.objectIDs.forEach((id) => {
            append_option(String(id));
        });

        // ここからリンクを張る作業
        // 負荷をかけないために API を叩く回数と間隔を制限する
        const max = obj.objectIDs.length > 10 ? 10 : obj.objectIDs.length;
        const delay = 1000;
        const start = 0;
        await set_anchor(obj, start, max, delay);
    });

// ワード検索のボタン
document
    .querySelector("button#run_go_on")
    ?.addEventListener("click", async () => {
        await set_anchor(setting.res_object, setting.counter);
        // let ans = await go_on;
        // return ans();
    });

// WARNING: グローバル変数
// let setting.counter = 0;
/** @type {{ objectIDs: number[]; total: number; }} */
// let setting.res_object;
/**
 *
 * @param {{objectIDs: number[]; total: number;}} obj
 * @param {number} start - 最初の数
 * @param {number} max - 回数
 * @param {number} delay - ミリ秒
 */
async function set_anchor(
    obj = setting.res_object,
    start = setting.counter,
    max = setting.counter + 10,
    delay = 100
) {
    for (let index = start; index < max; index++) {
        /* NOTE:JavaScript の配列・オブジェクトは存在しない名前でアクセスしようした場合 undefined を返す
         * ```javascript
         * const call = {cat:"mew",dog:"bow"};
         * call.goose; // undefined
         * ```
         */
        // index > obj.objectIDs.length のとき undefined を返してエラーを吐かないことに注意
        if (index >= obj.objectIDs.length) {
            console.log("index > objectIDs.length");
            break;
        }
        const objectID = obj.objectIDs[index];

        await append_anchor(String(objectID));
        await new Promise((s) => setTimeout(s, delay));
        setting.counter += 1;
    }
}

async function all_display() {
    while (setting.res_object.total > setting.counter) {
        console.log("count:", setting.counter);
        await set_anchor();
        remove_peke();
    }
}

// TODO: set_anchor を少ない引数で書き直せないかという試み
async function go_on(
    // WARNING: setting.res_object が存在する前提の引数
    obj = setting.res_object,
    delay = 1000
) {
    let count = 10;
    return async function () {
        console.log("count:", count);
        for (let index = count; index < count + 10; index++) {
            // index > obj.objectIDs.length のとき undefined を返してエラーを吐かないことに注意
            if (index >= obj.objectIDs.length) {
                console.log("index > objectIDs.length");

                break;
            }
            const objectID = obj.objectIDs[index];

            await append_anchor(String(objectID));
            await new Promise((s) => setTimeout(s, delay));
        }
        count += 10;
    };
}
