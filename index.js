const fs = require("fs");
const request = require("request");
const express = require('express');
const FormData = require('form-data');
const axios = require('axios')
const { Readable } = require('stream');
const streamifier = require('streamifier');

const fileUpload = require('express-fileupload');
const app = express();
const port = 3000;

app.use(fileUpload());

// acceptable organizations: sss, ace, fmmd 
app.get('/upload/CSVtoJSON', function (req, res) {
    res.sendFile(__dirname + "/file-upload.html")
});

// app.post('/upload/:organization', async function (req, res) {
//     const propertiesPath = "properties.json";
//     let residingFilePath = "";
//     if (fs.existsSync(propertiesPath)){
//         const jsonString = fs.readFileSync(propertiesPath);
//         residingFilePath = JSON.parse(jsonString).final_path + "/";
//     }
//     const filename = req.files.fileUpload.name
//     if (!req.params)
//         return res.send("NO PARAMS PASSED")

//     if (!req.params.organization)
//         return res.send("NO organization PASSED")

//     if (req.params.organization === "") {
//         res.send("organization EMPTY.")
//     } else {
//         const formData  = new FormData();
//         const uploadDirectory = "./" + req.params.organization + "/" + residingFilePath
//         if (!fs.existsSync(uploadDirectory)){
//             fs.mkdir(residingFilePath, { recursive: true }, (err) => {
//                 if (err) throw err;
//             });
//         }
//         filePath = uploadDirectory + filename
//         console.log(filePath)
//         formData.append('organization', req.params.organization);
//         formData.append(filename, fs.createReadStream(filePath));
//         const res = await axios.post("http://172.20.10.5:3000/upload", formData, {
//             headers: formData.getHeaders()
//         });
//     }
// });

function bufferToStream(binary) {

    const readableInstanceStream = new Readable({
      read() {
        this.push(binary);
        this.push(null);
      }
    });

    return readableInstanceStream;
}

app.post('/upload/:organization', async function (req, res) {
    console.log(req.files)
    const filename = req.files.fileUpload.name
    if (!req.params)
        return res.send("NO PARAMS PASSED")

    if (!req.params.organization)
        return res.send("NO organization PASSED")

    if (req.params.organization === "") {
        res.send("Organization EMPTY.")
    } else {
        const formData  = new FormData();
        console.log(req.files.fileUpload.data)
        formData.append('organization', req.params.organization);
        // const stream = bufferToStream(req.files.fileUpload.data)
        // const stream = Readable.from(req.files.fileUpload.data);
        // console.log(stream)     
        // var buffer = Buffer.from( new Uint8Array(req.files.fileUpload.data) );

        formData.append(filename, streamifier.createReadStream(new Buffer (req.files.fileUpload.data)).pipe(process.stdout));
        const res = await axios.post("http://172.20.10.5:3000/upload", formData, {
            headers: formData.getHeaders()
        });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})