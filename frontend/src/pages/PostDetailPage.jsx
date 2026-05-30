import React, { useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPostById } from "../services/communityService";
import CommunityFeed from "../components/CommunityFeed";

// Helper to get query param
function useQueryParam(key) {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search).get(key), [search, key]);
}

export default function PostDetailPage() {
  const { postId } = useParams();
  const commentId = useQueryParam("comment");
  const commentRef = useRef(null);

  // Fetch the single post by ID
  const { data, isLoading } = useQuery({
    queryKey: ["community", "post", postId],
    queryFn: async () => {
      const res = await getPostById(postId);
      return res.post || null;
    },
    enabled: !!postId,
  });

  useEffect(() => {
    // Scroll to comment if present
    if (commentId && commentRef.current) {
      commentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      commentRef.current.classList.add("ring-2", "ring-[#f4873e]");
      setTimeout(() => {
        commentRef.current && commentRef.current.classList.remove("ring-2", "ring-[#f4873e]");
      }, 2000);
    }
  }, [commentId, data]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!data) return <div className="p-8 text-center">Post not found.</div>;

  // Patch CommunityFeed to highlight/scroll comment
  const posts = [data];
  const getCategoryColor = () => "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";

  // Patch CommunityFeed to pass commentId and ref
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <CommunityFeed
        posts={posts}
        getCategoryColor={getCategoryColor}
        highlightCommentId={commentId}
        commentRef={commentRef}
        singlePostMode
      />
    </div>
  );
}
