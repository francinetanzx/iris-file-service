const express = require('express');
const app = express();
const port = 3000;

const fileUpload = require('express-fileupload');
app.use(fileUpload());

let Client = require('ssh2-sftp-client');
const client = new Client();

require('dotenv').config();

app.get('/download/CSVtoJSON', function (req, res) {
    res.sendFile(__dirname + "/file-download.html")
});

// acceptable organizations: sss, ace, fmmd 
app.get('/upload/CSVtoJSON', function (req, res) {
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
        const host = process.env.HOST
        const port = process.env.PORT
        const username = process.env.NAME
        const password = process.env.PASSWORD
        console.log(host)
        console.log(port)
        console.log(username)
        console.log(password)
        await connect({ host, port, username, password })
        await uploadFile(req.files.fileUpload.data, filename)
        res.send(`<p>http://172.20.10.11:3000/download/${filename}</p>`)
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

app.listen(port, "172.20.10.11", () => {
    console.log(`Example app listening on port ${port}`)
})