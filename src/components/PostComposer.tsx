import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, LoaderCircle, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createPost, getApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Avatar } from "./Avatar";

// Zod describes valid input, and the resolver lets React Hook Form run those
// rules on submit. This keeps validation next to the form's type.
const postSchema = z.object({
  body: z.string().trim().min(1, "Write something before sharing.").max(2000, "Keep your post under 2,000 characters."),
});
type PostFormValues = z.infer<typeof postSchema>;

export function PostComposer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { body: "" },
  });

  const mutation = useMutation({
    mutationFn: (body: string) => createPost(body, image ?? undefined),
    onSuccess: async () => {
      reset();
      setImage(null);
      setFeedback("Your post is live.");
      if (fileInput.current) fileInput.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => setFeedback(getApiError(error)),
  });

  function submit(values: PostFormValues) {
    setFeedback("");
    mutation.mutate(values.body);
  }

  return (
    <section className="soft-shadow rounded-[28px] border border-emerald-950/5 bg-white p-5 sm:p-6">
      <div className="flex gap-3">
        <Avatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="mb-3 text-sm font-bold">A thought worth sharing?</p>
          <form onSubmit={handleSubmit(submit)}>
            <label className="sr-only" htmlFor="post-body">
              Write a post
            </label>
            <textarea
              id="post-body"
              rows={3}
              placeholder="What’s on your mind today?"
              className="focus-ring w-full resize-y rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-400"
              {...register("body")}
            />
            {errors.body && (
              <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                {errors.body.message}
              </p>
            )}

            {image && (
              <div className="relative mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                <ImagePlus size={15} /> {image.name}
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                  aria-label="Remove selected image"
                  className="rounded-full p-1 hover:bg-emerald-100"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-emerald-50 hover:text-leaf">
                <ImagePlus size={17} /> Add a photo
                <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
              </label>
              <button
                disabled={mutation.isPending}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-leaf px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}
                {mutation.isPending ? "Sharing…" : "Share post"}
              </button>
            </div>
          </form>
          {feedback && (
            <p role="status" className={"mt-3 text-xs font-semibold " + (mutation.isError ? "text-rose-600" : "text-emerald-700")}>
              {feedback}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
