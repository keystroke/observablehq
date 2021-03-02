import Observable from '@observablehq/runtime'
import notebook from '@keystroke/nodejs'
import express from 'express';

runNotebook(notebook, { process, express });

function runNotebook(notebook, context = {}, cell = 'main') {
    new Observable.Runtime().module(notebook).value(cell)
        .then(main => main(context))
        .catch(console.error.bind(console));
}