import Observable from '@observablehq/runtime';
import notebook from '@keystroke/observablehq';
import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

runNotebook(notebook, { process, express, cors, puppeteer, fetch })
    .catch(console.error.bind(console));

async function runNotebook(notebook, context = { process }, cell = 'main') {
    return await (await new Observable.Runtime().module(notebook).value(cell))(context);
}