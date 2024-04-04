//@ts-check

/**
 * @param {string | null} word
 */
async function hoge(word) {
    /**  @type {number | null} */
    if (!word) {
        console.error("NO DATA!");
        return;
    }
    const obj = await fetch_content(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${word}`
    );
    const Element = createAnchorTag(obj);
    document.querySelector("div#image")?.appendChild(Element);
    return obj;
}

// ワード検索のボタン
document.querySelector("button#run")?.addEventListener("click", () => {
    /** @type {HTMLInputElement | null} */
    const word = document.querySelector("input#input_label");
    console.log(word?.value ?? "No Data");
    if (word?.value === null) {
        console.error("NO DATA!");
        return;
    }

    return fetch_content(
        `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${word?.value}`
    );
});

// ID検索のボタン
document
    .querySelector("button#run_fetch")
    ?.addEventListener("click", async () => {
        /** @type {HTMLSelectElement | null} */
        const word = document.querySelector("#drop_select");
        if (!word) {
            return;
        }
        await hoge(word.value);
    });

// ワード検索のボタン
document
    .querySelector("button#run_drop")
    ?.addEventListener("click", async () => {
        /** @type {HTMLInputElement | null} */
        const word = document.querySelector("input#input_label");
        console.log(word?.value ?? "No Data");
        if (word?.value === null) {
            console.error("NO DATA!");
            return;
        }

        /** @type {{objectIDs: number[], total: number}} */
        const obj = await fetch_content(
            `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${word?.value}`
        );
        console.dir(obj);

        const opts = (/** @type {string} */ id) => {
            const opt = document.createElement("option");
            opt.textContent = id;
            document.querySelector("#drop_select")?.appendChild(opt);
        };

        obj.objectIDs.forEach((id) => {
            opts(String(id));
        });

        console.dir(obj.objectIDs);
        // 最大数
        // const max = obj.objectIDs.length;
        for (let index = 0; index < 100; index++) {
            const element = obj.objectIDs[index];
            console.log(element);
            await hoge(String(element));
            await new Promise((s) => setTimeout(s, 3000));
        }

        return obj;
    });

/**
 * API を叩く関数。
 * @param {string} path
 * @returns {Promise<any>}
 */
async function fetch_content(path) {
    if (path === "") {
        return;
    }
    const content = await fetch(path).then((response) => response.json());
    console.log(content);
    return content;
}

/**
 * 指定されたURLから<img>要素を生成します。
 * URLが指定されていない場合、代わりにエラーメッセージが含まれた<p>要素が生成されます。
 * @param {string} url - 画像のURL
 * @returns {HTMLImageElement|HTMLParagraphElement} - <img>要素または<p>要素
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
 * 指定されたURLから<img>要素を生成します。
 * URLが指定されていない場合、代わりにエラーメッセージが含まれた<p>要素が生成されます。
 * @param {{primaryImageSmall: string, objectID: number, title: string}} Met_obj - JSON
 * @returns {HTMLAnchorElement|HTMLParagraphElement} - <img>要素または<p>要素
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
    console.dir(Met_obj);
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
