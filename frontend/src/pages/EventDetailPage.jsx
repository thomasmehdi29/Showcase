import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ShowcaseMap from "../components/ShowcaseMap";
import { api } from "../lib/api";
import { colorForCategory } from "../lib/categories";

function formatDate(dateString) {
  return new Date(dateString).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventDetailPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingDiscussion, setUpdatingDiscussion] = useState(false);
  const [commentForm, setCommentForm] = useState({
    authorName: "",
    message: "",
  });

  useEffect(() => {
    let active = true;

    async function loadEventAndComments() {
      setLoading(true);
      setLoadingComments(true);
      setError("");
      setCommentError("");

      try {
        const [eventData, commentData] = await Promise.all([api.getEventById(eventId), api.getEventComments(eventId)]);
        if (active) {
          setEvent(eventData);
          setComments(commentData);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
          setLoadingComments(false);
        }
      }
    }

    loadEventAndComments();

    return () => {
      active = false;
    };
  }, [eventId]);

  async function refreshComments() {
    setLoadingComments(true);
    setCommentError("");

    try {
      const latest = await api.getEventComments(eventId);
      setComments(latest);
    } catch (loadError) {
      setCommentError(loadError.message);
    } finally {
      setLoadingComments(false);
    }
  }

  function updateCommentField(field, value) {
    setCommentForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCommentSubmit(eventInput) {
    eventInput.preventDefault();
    setCommentError("");
    setSubmittingComment(true);

    try {
      const created = await api.createEventComment(eventId, {
        authorName: commentForm.authorName,
        message: commentForm.message,
      });
      setComments((prev) => [created, ...prev]);
      setCommentForm((prev) => ({ ...prev, message: "" }));
    } catch (submitError) {
      setCommentError(submitError.message);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDiscussionToggle() {
    if (!event) {
      return;
    }

    setUpdatingDiscussion(true);
    setCommentError("");

    try {
      const updatedEvent = await api.updateEvent(event.id, {
        discussionEnabled: !event.discussionEnabled,
      });
      setEvent(updatedEvent);
      await refreshComments();
    } catch (toggleError) {
      setCommentError(toggleError.message);
    } finally {
      setUpdatingDiscussion(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        <div className="h-64 animate-pulse rounded-3xl bg-white shadow-soft" />
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Event not found"}</div>
      </main>
    );
  }

  const categoryColor = colorForCategory(event.category);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
      <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-3xl text-ink">{event.title}</h2>
          <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: categoryColor }}>
            {event.category}
          </span>
        </div>
        <p className="text-sm text-ink/75">{event.description}</p>
        <div className="mt-4 space-y-1 text-sm text-ink/70">
          <p>
            <span className="font-semibold text-ink">Hosted by:</span>{" "}
            <Link className="text-ocean underline" to={`/vendors/${event.vendorId}`}>
              {event.vendorName}
            </Link>
          </p>
          <p>
            <span className="font-semibold text-ink">Starts:</span> {formatDate(event.startDate)}
          </p>
          <p>
            <span className="font-semibold text-ink">Ends:</span> {formatDate(event.endDate)}
          </p>
          <p>
            <span className="font-semibold text-ink">Address:</span>{" "}
            {event.location
              ? `${event.location.address ?? ""}, ${event.location.city ?? ""}, ${event.location.state ?? ""}`
              : "Location TBD"}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold",
              event.discussionEnabled ? "bg-moss/15 text-moss" : "bg-ink/10 text-ink/70",
            ].join(" ")}
          >
            {event.discussionEnabled ? "Discussion enabled" : "Discussion disabled"}
          </span>
          <button
            className="rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60"
            disabled={updatingDiscussion}
            type="button"
            onClick={handleDiscussionToggle}
          >
            {updatingDiscussion
              ? "Saving..."
              : event.discussionEnabled
                ? "Disable discussion"
                : "Enable discussion"}
          </button>
          <span className="text-xs text-ink/60">Event creator setting</span>
        </div>
      </section>

      <ShowcaseMap vendors={[]} events={[event]} height="420px" />

      <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl text-ink">Event Discussion</h3>
          <span className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-ink">{comments.length} comments</span>
        </div>

        {commentError && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{commentError}</p>}

        {event.discussionEnabled ? (
          <form className="mb-4 grid gap-3 rounded-2xl border border-ink/10 bg-canvas p-4" onSubmit={handleCommentSubmit}>
            <label className="flex flex-col gap-1 text-sm text-ink">
              Your name *
              <input
                className="rounded-xl border border-ink/20 bg-white px-3 py-2 outline-none ring-moss focus:ring-2"
                required
                value={commentForm.authorName}
                onChange={(inputEvent) => updateCommentField("authorName", inputEvent.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink">
              Comment *
              <textarea
                className="min-h-20 rounded-xl border border-ink/20 bg-white px-3 py-2 outline-none ring-moss focus:ring-2"
                required
                value={commentForm.message}
                onChange={(inputEvent) => updateCommentField("message", inputEvent.target.value)}
              />
            </label>
            <div>
              <button
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submittingComment}
                type="submit"
              >
                {submittingComment ? "Posting..." : "Post comment"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-4 rounded-2xl border border-dashed border-ink/20 bg-canvas p-4 text-sm text-ink/70">
            Discussion is currently disabled for this event.
          </div>
        )}

        {loadingComments ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-canvas" />
            ))}
          </div>
        ) : comments.length > 0 ? (
          <div className="grid gap-3">
            {comments.map((comment) => (
              <article key={comment.id} className="rounded-2xl border border-ink/10 bg-canvas p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{comment.authorName}</p>
                  <p className="text-xs text-ink/60">{formatDate(comment.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm text-ink/80">{comment.message}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/70">No comments yet. Start the discussion.</p>
        )}
      </section>

      <div className="flex gap-3">
        <Link className="rounded-full border border-ink/20 bg-canvas px-5 py-2 text-sm font-semibold text-ink" to="/events">
          Back to events
        </Link>
      </div>
    </main>
  );
}
