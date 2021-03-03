import Observable from '@observablehq/runtime';
import notebook from '@keystroke/nodejs';
import express from 'express';

runNotebook(notebook, { process, express });

async function runNotebook(notebook, context = { process }, cell = 'main') {
    return (await new Observable.Runtime().module(notebook).value(cell))(context);
}