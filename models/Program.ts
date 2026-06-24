import mongoose, { Schema, Document } from "mongoose";

export interface IProgram extends Document {
  userId: string;
  title: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: "Untitled Program",
    },
    htmlCode: {
      type: String,
      default: "<h1>Hello World!</h1>\n<p>Start typing your HTML here...</p>",
    },
    cssCode: {
      type: String,
      default: "h1 {\n  color: #0ea5e9;\n}",
    },
    jsCode: {
      type: String,
      default: "console.log('Welcome to Python Arena Editor!');",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Program || mongoose.model<IProgram>("Program", ProgramSchema);
