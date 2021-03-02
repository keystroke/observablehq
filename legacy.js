const express = require('express');
const cors = require('cors');
const puppeteer = require("puppeteer");

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8080;

// POST https://observable.run/@keystroke/example?food=fish
// { "something": "test" }

const notebookRequest = {
    route() {
        const x = '([\-0-9@A-Z_a-z]+)';
        return `/:user${x}/:notebook${x}/:cell${x}?`;
    },
    params(req) {
        const p = Object.assign({}, req.params);
        p.id = `${p.user}/${p.notebook}`;
        return p;
    }
};

const app = express();

app.listen(port, host, () => console.log(`Listening at ${host}:${port}`));


// observable.run/@keystroke/nodejs

herokuChromeOptions = {
    args: [
        '--incognito',
        '--no-sandbox',
        '--single-process',
        '--no-zygote',
    ],
};

app.get(notebookRequest.route(), cors(), async (req, res) => {
    try {
        const { id, cell, data } = notebookRequest.params(req);
        const page = await loadNotebook({ id, cell });
        const { json, html, error } = await runNotebook({ page, cell, req: { body, search } });
        if (json) return res.json(json);
        if (html) return res.send(html);
        if (error) return res.status(status || 500).json({ error });
    } catch (error) {
        console.error(error);
    }
})







async function loadNotebook({ id, cell } = {}) {
    // todo - reuse instances of browsers / pages between requests
    const browser = await puppeteer.launch(herokuChromeOptions);
    const page = await browser.newPage();
    await page.addScriptTag({
        content: getNotebookAsModule({ id, cell }),
        type: 'module'
    });
    return page;
}

function getNotebookAsModule({ user, notebook, cell } = {}) {
    return `
import { Runtime } from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js";
import define from "https://api.observablehq.com/${user}/${notebook}.js?v=3";
new Runtime().module(define, name => {
    if (name === '${cell}' || ${!cell}) return !name ? true : {
        fulfilled(value) {  window[name] = value; },
        rejected(error) { window[name] = () => { throw error; }; }
    };
});`
}

async function runNotebook({ user, notebook, cell } = {}) {


}




app.get('/', cors(), async (req, res) => {
    res.send(new Date());
    return;

    const start = new Date();
    const { method, url, params: { user, notebook, cell = 'main' } } = req;
    try {
        // const content = getRunNoteBookScript({ user, notebook, cell });
        // const page = await (await browser).newPage();
        // await page.addScriptTag({ type: 'module', content });
        const page = await pagePromise;
        // console.log({ user, notebook, cell });

        const handle = await page.waitForFunction(
            async (req, cell) => {
                const func = window[cell];
                if (!func) return false;
                let result;
                try { result = await func(req); }
                catch (error) { return { error: error.message }; }
                if (!result) return {};
                if (typeof result === 'string') return { html: result };
                if (result.outerHTML) return { html: result.outerHTML };
                return { json: result };
            },
            { timeout: 3000 },
            { url, method },
            cell);

        const result = await handle.jsonValue();
        //page.close();

        if (result.error) {
            log('error', result.error);
            res.status(500).json({ error: result.error });
        } else if (result.html) {
            log('html');
            res.send(result.html);
        } else if (result.json) {
            log('json');
            res.json(result.json);
        } else {
            log('empty');
            res.status(204).end();
        }
    } catch (error) {
        log('error', error.message);
        //console.log(error);
        res.status(500).json({ error: error.message });
    }
    function log(resultType, resultData) {
        const end = new Date();
        const duration = ((new Date() - start) / 1000).toPrecision(3);
        const message = `(+${duration}s) ${method} [${resultType}] ${url}\n${resultData || ''}`.trim();
        console.log(message.length > 500 ? `${message.substr(0, 500)}...(${message.length - 500} chars truncated)` : message);
    }
});
