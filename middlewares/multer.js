import multer from "multer";
 const multerUpload = multer({
    limits : {
        fileSize: 1024 * 1024 * 5
    },
})

const SingleAvatarr = multerUpload.single("avatar")

const MultipleAttachments = multerUpload.array("files" , 5)

export {SingleAvatarr , MultipleAttachments}
