"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ImportResultsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check if user is admin
  if (session && session.user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You must be an administrator to access this page.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setMessage({ type: "error", text: "Please select an Excel file (.xlsx or .xls)" });
        return;
      }
      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select a file first" });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/import-scores", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import scores");
      }

      setMessage({
        type: "success",
        text: `Successfully imported ${data.count} scores! Redirecting to results page...`,
      });

      // Reset form
      setFile(null);
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Redirect to results page after 2 seconds
      setTimeout(() => {
        router.push("/results");
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred while importing scores",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to delete all imported results? This action cannot be undone.")) {
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/import-scores", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clear data");
      }

      setMessage({
        type: "success",
        text: `Successfully deleted ${data.count} scores`,
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred while clearing data",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Import Tournament Results</h1>
            <p className="mt-2 text-sm text-gray-600">
              Upload an Excel file with tournament results to display on the results page.
            </p>
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <label
              htmlFor="file-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Excel File
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-indigo-500 p-2"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Messages */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-md ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`flex-1 px-4 py-2 rounded-md font-medium ${
                !file || uploading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {uploading ? "Importing..." : "Import Results"}
            </button>

            <button
              onClick={handleClearData}
              disabled={uploading}
              className="px-4 py-2 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
            >
              Clear All Data
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Excel File Format</h3>
            <p className="text-sm text-blue-800 mb-2">
              Your Excel file should have the following columns:
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li><strong>Shooter</strong>: Shooter name</li>
              <li><strong>Team</strong>: Team name</li>
              <li><strong>Gender</strong>: "Men" or "Ladies"</li>
              <li><strong>Division</strong>: "Novice", "Intermediate", "JV", "Varsity", or "Collegiate"</li>
              <li><strong>Discipline</strong>: "Trap", "Skeet", "Sporting Clays", etc.</li>
              <li><strong>Round</strong>: Round number</li>
              <li><strong>TargetsThrown</strong>: Total targets thrown</li>
              <li><strong>TargetsHit</strong>: Total targets hit</li>
              <li><strong>StationBreakdown</strong> (optional): "5,5,4,4,5"</li>
              <li><strong>Field</strong> (optional): Field identifier</li>
              <li><strong>Time</strong> (optional): Time slot</li>
              <li><strong>Notes</strong> (optional): Additional notes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
