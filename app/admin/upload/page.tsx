import { Metadata } from "next";
import AdminLessonUploadForm from "@/components/admin/AdminLessonUploadForm";

export const metadata: Metadata = {
  title: "Upload Lesson | Admin",
  description: "Upload a new lesson to the LMS platform",
};

export default function AdminUploadPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Lesson</h1>
        <p className="text-gray-600">
          Create and publish a new lesson for the LMS platform. Upload the lesson PDF and
          thumbnail image, and fill in the lesson details below.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <AdminLessonUploadForm />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Tips for uploading</h2>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li>• Use clear, descriptive titles for your lessons</li>
          <li>• Ensure the lesson PDF is properly formatted and optimized</li>
          <li>• Use a relevant thumbnail image (PNG or JPG recommended)</li>
          <li>• Keep descriptions concise but informative</li>
          <li>• Select the correct subject and class level</li>
        </ul>
      </div>
    </div>
  );
}
