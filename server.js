const express = require('express');
const cors = require('cors');
const puppeteer = require("puppeteer");

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8080;

herokuChromeOptions = {
    args: [
        '--incognito',
        '--no-sandbox',
        '--single-process',
        '--no-zygote',
    ],
};

const app = express();

const browser = puppeteer.launch(herokuChromeOptions);

const x = '([\-0-9@A-Z_a-z]+)';
app.get(`/api/:user${x}/:notebook${x}/:cell${x}?`, cors(), async (req, res) => {
    const start = new Date();
    const { method, url, params: { user, notebook, cell = 'app' } } = req;
    try {
        const content = getRunNoteBookScript({ user, notebook, cell });
        const page = await (await browser).newPage();
        await page.addScriptTag({ type: 'module', content });
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
        page.close();

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
        log('crash', error.message);
        console.log(error);
        res.status(500).json({ error: error.message });
    }
    function log(resultType, resultData) {
        const end = new Date();
        const duration = ((new Date() - start) / 1000).toPrecision(3);
        const message = `(+${duration}s) ${method} [${resultType}] ${url}\n${resultData || ''}`.trim();
        console.log(message.length > 500 ? `${message.substr(0, 500)}...(${message.length - 500} chars truncated)` : message);
    }
});

function getRunNoteBookScript({ user, notebook, cell } = {}) {
    return `
import { Runtime } from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js";
import define from "https://api.observablehq.com/${user}/${notebook}.js?v=3";
new Runtime().module(define, name => {
    if (name === '${cell}') return {
        fulfilled(value) { 
            window['${cell}'] = value;
        },
        rejected(error) {
            window['${cell}'] = () => { throw error; };
        }
    };
});`
}

app.listen(port, host);