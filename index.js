//@ts-check

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
    document.querySelector("section#image")?.appendChild(Element);
    return obj;
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
        /** @type {HTMLInputElement | null} */
        const word = document.querySelector("input#input_label");
        if (!word?.value) {
            console.error("NO DATA!");
            return;
        }

        const obj = await fetch_content(
            `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${word?.value}`
        );
        if ("title" in obj) {
            return;
        }

        const opts = (/** @type {string} */ id) => {
            const opt = document.createElement("option");
            opt.textContent = id;
            opt.className = "drop_box_item";
            document.querySelector("#drop_select")?.appendChild(opt);
        };

        obj.objectIDs.forEach((id) => {
            opts(String(id));
        });

        console.log("loop:", obj.objectIDs);
        // API を叩く回数を制限する
        const max = obj.objectIDs.length > 10 ? 10 : obj.objectIDs.length;
        const delay = 1000;
        for (let index = 0; index < max; index++) {
            const element = obj.objectIDs[index];

            // 不要な通信を避けるためにヌリッシュな値を break
            if (!element) {
                break;
            }
            await append_anchor(String(element));
            await new Promise((s) => setTimeout(s, delay));
        }
    });
