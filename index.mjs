// Notebook
import notebook from '@keystroke/nodejs'
import Observable from '@observablehq/runtime'

// Modules
import express from 'express';
const imports = { express };

// Runtime
const module = new Observable.Runtime().module(notebook);
module.value('main')
    .then(main => main({ process, imports }))
    .catch(error => console.error(error));