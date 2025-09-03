import multer from "multer";

// This will return complete filePath
// Here the file has been uploaded to the local server
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },

  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage })