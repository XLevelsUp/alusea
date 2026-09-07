"use client";

import { useState } from "react";
import { submitComment } from "./actions";

export default function CommentForm({ postId, postSlug }: { postId: string; postSlug: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    // Capture the form element before the await — by the time an async
    // handler resumes, React may have already nulled e.currentTarget.
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("post_id", postId);
    formData.set("post_slug", postSlug);

    try {
      await submitComment(formData);
      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage((error as Error).message || "Something went wrong.");
    }
  };

  return (
    <div className="border-t border-gray-100 pt-10">
      <h3 className="text-xl font-bold text-matte-black mb-2">Leave a comment</h3>
      <p className="text-sm text-steel-gray mb-6">All comments are moderated before being published.</p>

      {status === "success" ? (
        <div className="rounded-lg bg-green-50 border border-green-200 p-5">
          <p className="text-green-700 font-medium">
            Thanks — your comment has been submitted.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-3 text-sm font-semibold text-[#7A5418] hover:underline"
          >
            Leave another comment
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              type="text"
              name="name"
              placeholder="Name"
              className="w-full px-4 py-3 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5418]/40"
            />
            <input
              required
              type="email"
              name="email"
              placeholder="E-mail"
              className="w-full px-4 py-3 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5418]/40"
            />
          </div>
          <textarea
            required
            name="message"
            placeholder="Message"
            rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5418]/40 resize-none"
          />

          {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center gap-2 bg-[#7A5418] hover:bg-[#5C3D0E] text-white px-8 py-3 text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
}
