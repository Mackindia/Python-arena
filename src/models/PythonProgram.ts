import mongoose, { Schema, Document } from "mongoose";

export interface IPythonProgram extends Document {
  userId: string;
  title: string;
  pythonCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const PythonProgramSchema = new Schema<IPythonProgram>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: "Untitled Python Program",
    },
    pythonCode: {
      type: String,
      default: "print('Hello, Python Arena!')",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PythonProgram || mongoose.model<IPythonProgram>("PythonProgram", PythonProgramSchema);
