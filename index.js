'use strict';

let shell = require('electron').shell,
    request = require('request'),
    // Keep track of requests. There should only ever be one.
    requests = [];

exports.init = (config) => {};

exports.setConfig = () => {};

exports.process = ({keyword, term, stream}) => {
    // Abort previous requests.
    while (requests.length) {
        requests.pop().abort();
    }

    let req;

    // If the term is empty, return no results.
    if (/^\s*$/.test(term)) {
        stream.end(undefined);
        return;
    }

    req = request('https://en.wikipedia.org/w/api.php?action=query&generator=search&format=json&prop=info&inprop=url&gsrsearch=' + encodeURIComponent(term),
        (error, response, body) => {
            if (!error && response.statusCode === 200) {
                let json = JSON.parse(body),
                    results,
                    keys;

                if (json.query && json.query.pages) {
                    results = json.query.pages;

                    keys = Object.keys(results);
                    keys.forEach((v) => {
                        let item = results[v];

                        stream.write({
                            key: item.fullurl,
                            title: item.title,
                            description: undefined,
                            icon: 'https://upload.wikimedia.org/wikipedia/en/8/80/Wikipedia-logo-v2.svg'
                        });
                    });
                }

                stream.end();
            }
            else {
                stream.end();
                console.log(error);
            }
        }
    );

    requests.push(req);
};
exports.execute = ({key}) => {
    return new Promise((resolve, reject) => {
        if (/^https?\:\/\//.test(key)) {
            shell.openExternal(key);
            resolve();
        }
        else {
            reject();
        }
    });
};

exports.keyword = 'w';
