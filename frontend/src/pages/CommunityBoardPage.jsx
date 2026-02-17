import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const initialForm = {
  authorName: "",
  title: "",
  message: "",
  category: "",
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CommunityBoardPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api.getCommunityPosts();
      setPosts(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const created = await api.createCommunityPost({
        authorName: form.authorName,
        title: form.title,
        message: form.message,
        category: form.category || null,
      });

      setPosts((prev) => [created, ...prev]);
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(postId) {
    try {
      await api.deleteCommunityPost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
      <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.24em] text-ink/70">Community Board</p>
        <h2 className="font-display text-3xl text-ink">Share local updates, opportunities, and requests</h2>
        <p className="mt-2 text-sm text-ink/70">
          Post announcements for the community and keep everyone informed about what is happening nearby.
        </p>
      </section>

      <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
        <h3 className="font-display text-2xl text-ink">Create a post</h3>
        {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm text-ink">
            Your name *
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              required
              value={form.authorName}
              onChange={(event) => updateField("authorName", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Category
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              placeholder="Volunteer, Market, Community, etc."
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            />
          </label>

          <label className="md:col-span-2 flex flex-col gap-1 text-sm text-ink">
            Title *
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </label>

          <label className="md:col-span-2 flex flex-col gap-1 text-sm text-ink">
            Message *
            <textarea
              className="min-h-24 rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              required
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
            />
          </label>

          <div className="md:col-span-2">
            <button
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-canvas disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Posting..." : "Post to board"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl text-ink">Latest posts</h3>
          <button className="text-sm font-semibold text-moss hover:text-ink" onClick={loadPosts} type="button">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-canvas" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid gap-3">
            {posts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-ink/10 bg-canvas p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-ink">{post.title}</h4>
                  <button className="text-xs font-semibold text-ink/60 hover:text-red-700" onClick={() => handleDelete(post.id)} type="button">
                    Delete
                  </button>
                </div>
                <p className="mt-1 text-sm text-ink/80">{post.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/65">
                  <span className="rounded-full border border-ink/15 bg-white px-2 py-0.5">{post.authorName}</span>
                  {post.category && <span className="rounded-full bg-ember/15 px-2 py-0.5">{post.category}</span>}
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/70">No community posts yet. Create the first one above.</p>
        )}
      </section>
    </main>
  );
}
