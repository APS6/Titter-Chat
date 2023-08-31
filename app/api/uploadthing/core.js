import { createUploadthing, } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "2MB", maxFileCount: 4 } }).onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete", file.url);
  }),
  pfpUploader: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } }).onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete", file.url);
    })
};

