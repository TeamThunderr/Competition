
const fetchStart = async () => {
    console.log('Node Version:', process.version);

    try {
        const nodeFetch = require('node-fetch');
        console.log('Type of require("node-fetch"):', typeof nodeFetch);
        console.log('Is nodeFetch a function?', typeof nodeFetch === 'function');
    } catch (e) {
        console.log('Error requiring node-fetch:', e.message);
    }

    console.log('Type of global.fetch:', typeof global.fetch);
};

fetchStart();
