const config = require('../config'),
    fs = require('fs'),
    mongodb = require('../services/mongodb');

async function doImport() {
    const db = await mongodb.connect(config.mongodbUri);

    if (fs.existsSync('./data/data.json')) {
        const data = JSON.parse(fs.readFileSync('./data/data.json', 'utf8'));

        await db.collection('resources').bulkWrite(
            Object.keys(data.resources).map(id => {
                return {
                    replaceOne: {
                        filter: { _id: id },
                        replacement: data.resources[id],
                        upsert: true
                    }
                };
            })
        );

        await db.collection('subscriptions').bulkWrite(
            Object.keys(data.subscriptions).map(id => {
                return {
                    replaceOne: {
                        filter: { _id: id },
                        replacement: data.subscriptions[id],
                        upsert: true
                    }
                };
            })
        );

        await mongodb.close();
    } else {
        await mongodb.close();

        throw new Error('Cannot find ./data/data.json');
    }
}

doImport()
    .then(() => {
        console.log('Imported ./data/data.json');
    })
    .catch(err => {
        console.error(err);
    });
