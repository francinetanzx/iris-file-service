const express = require('express');
const {MongoClient} = require('mongodb');
const app = express();
const port = 3000;

const fileUpload = require('express-fileupload');
app.use(fileUpload());

let Client = require('ssh2-sftp-client');
const client = new Client();

const shortid = require('shortid')

require('dotenv').config();

// app.get('/list', function (req, res) {
//     res.sendFile(__dirname + "/file-list.html")
// });

app.get('/list', async function (req, res) {
    // res.sendFile(__dirname + "/file-list.html")
    const uri = process.env.MONGODBURI
    const mongoDBClient = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    try {
        // await mongoDBClient.connect();
        console.log('Connect to database!')
        const database = mongoDBClient.db("irisFileServiceDatabase");
        // console.log("db: ", database)
        const file = database.collection("file");
        console.log("collection: ", file)
        // const query = {};
        // const options = {
        //     sort: { createdDatetime: -1 },
        //     projection: { _id: 0, title: 1, imdb: 1 },
        // };
        const result = await file.find({}).toArray()
        console.log("result: ", result)
        // console.log("result: ", result)
        // result.forEach(d => { 
        //     console.log("check this: ", d)
        // })
        // await mongoDBClient.close();
        res.json(result)
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoDBClient.close();
    }
});

// acceptable organizations: sss, ace, fmmd 
app.get('/upload', function (req, res) {
    res.sendFile(__dirname + "/file-upload.html")
});

async function uploadFile(localFile, remoteFile) {
    console.log(`Uploading ${localFile} to ${remoteFile} ...`);
    try {
       client.put(localFile, remoteFile).then((data) => {
        if (data == `Uploaded data stream to ${remoteFile}`) {
            client.end()
            console.log(`Uploaded file: ${remoteFile}`);
        }
       });
    } catch (err) {
      console.error('Uploading failed:', err);
    }
}

async function connect(options) {
    console.log(`Connecting to ${options.host}:${options.port}`);
    try {
      await client.connect(options);
    } catch (err) {
      console.log('Failed to connect:', err);
    }
}

async function downloadFile(remoteFile) {
    console.log(`Downloading ${remoteFile} to ${remoteFile} ...`);
    try {
      await client.get(remoteFile, remoteFile);
    } catch (err) {
      console.error('Downloading failed:', err);
    }
}

async function listDatabases(client){
    databasesList = await client.db().admin().listDatabases();
    console.log("Databases:");
    databasesList.databases.forEach(db => {console.log(` - ${db.name}`)});
};


app.post('/upload/:organization', async function (req, res) {
    const filename = req.params.organization + "/" + req.files.fileUpload.name
    console.log("filename: ", filename)
    if (!req.params)
        return res.send("NO PARAMS PASSED")

    if (!req.params.organization)
        return res.send("NO ORGANIZATION PASSED")

    if (req.params.organization === "") {
        res.send("ORGANIZATION EMPTY.")
    } else {
        let fileUpload;
        let uploadPath;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('NO FILES UPLOADED.');
        }

        fileUpload = req.files.fileUpload;
        uploadPath = __dirname + "/" + filename;
        console.log(uploadPath)

        fileUpload.mv(uploadPath, function (err) {
            if (err)
                return res.status(500).send(err);
        });

        const uri = process.env.MONGODBURI
        const mongoDBClient = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
        try {
            const database = mongoDBClient.db("irisFileServiceDatabase");
            const file = database.collection("file");
            const currentTimeMS = new Date()
            const currentDatetime = currentTimeMS.toISOString()
            var expiryDatetime = new Date(currentTimeMS + (5 * 60 * 1000));
            console.log("current: " , currentDatetime)
            console.log("expiry: ", expiryDatetime)
            const urlCode = shortid.generate()
            const shortUrl = __dirname + '/' + urlCode
            const doc = { 
                localFileDirectory: filename, 
                createdDatetime: currentDatetime, 
                modifiedDatetime: currentDatetime,
                links: {
                    urlCode: {
                        createdDatetime: currentDatetime, 
                        downloadableLink: urlCode,
                        expiryDatetime: expiryDatetime, 
                    }
                }
            }
            const result = await file.insertOne(doc);
            console.log(`A document was inserted with the _id: ${result.insertedId}`);

        
            // await mongoDBClient.connect();
            // await listDatabases(mongoDBClient);
        } catch (e) {
            console.error(e);
        } finally {
            await mongoDBClient.close();
            res.send('FILE UPLOADED!');
        }
    }
});


app.post('/download', async function (req, res) {
    const requestedFilePath = req.body["fileDownload"]
    if (!req.body)
        return res.send("NO PARAMS PASSED")
    if (!requestedFilePath)
        return res.send("NO filepath PASSED")
    else {
        const startIndex = requestedFilePath.indexOf("download") + 9
        const filepath = requestedFilePath.substring(startIndex)
        // const requestedFileName  = filepath.substring(filepath.indexOf('/')+1)
        // const requestedOrganization  = filepath.substring(0,filepath.indexOf('/'))
        const host = process.env.HOST
        const port = process.env.PORT
        const username = process.env.NAME
        const password = process.env.PASSWORD
        // const finalRequestedPath = requestedOrganization + "/"  + requestedFileName
        // console.log("requestedOrganization: ", requestedOrganization)
        // console.log("requestedFileName: ", requestedFileName)
        // console.log("finalRequestedPath: ", finalRequestedPath)
        await connect({ host, port, username, password });
        await downloadFile(filepath)
        res.download(`${__dirname}/${filepath}`)
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})