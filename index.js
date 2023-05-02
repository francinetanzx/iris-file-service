const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const port = 3000;

app.use(fileUpload());

// acceptable organizations: sss, ace, fmmd 
app.post('/upload/:organization', function (req, res) {
    if (!req.params)
        return res.send("NO PARAMS PASSED")

    if (!req.params.organization)
        return res.send("NO organization PASSED")

    if (req.params.organization === "") {
        res.send("organization EMPTY.")
    } else {
        let fileUpload;
        let uploadPath;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('NO FILES UPLOADED.');
        }

        fileUpload = req.files.fileUpload;
        uploadPath = __dirname + "/" + req.params.organization + "/" + fileUpload.name;
        console.log(uploadPath)

        fileUpload.mv(uploadPath, function (err) {
            if (err)
                return res.status(500).send(err);

            res.send('FILE UPLOADED!');
        });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})