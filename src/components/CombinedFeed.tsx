import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { socialAPI, Post, User } from "@/lib/api";
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import FeedRow from "./FeedRow";

interface CombinedFeedProps {
  location: string; // pickup location name, "all" not supported here
  currentUserId?: number;
}

type OrderItem = {
  type: "order";
  id: string;
  ts: string;
  user: User;
  summary: string;
  post: Post;
};

type MessageItem = {
  type: "message";
  id: string;
  ts: string;
  user: User;
  text: string;
  post: Post;
};

type FeedItem = OrderItem | MessageItem;

const CombinedFeed: React.FC<CombinedFeedProps> = ({ location, currentUserId }) => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [input, setInput] = useState("");
  const { toast } = useToast();

  const buildFeed = useCallback(async () => {
    // users with orders
    const users: User[] = await socialAPI.getUsersByLocation(location);
    const orderItems: OrderItem[] = [];
    for (const u of users) {
      const profilePost = await socialAPI.createUserProfilePost(u.id, location);
      const ord = u.orders?.find((o) => o.pickup_location === location);
      const liked = currentUserId ? profilePost.liked_by?.some((lu: any) => lu.id === currentUserId) : false;

      orderItems.push({
        type: "order",
        id: `order-${profilePost.id}`,
        ts: profilePost.created_at,
        user: u,
        summary: ord ? `${ord.menu_item.name}` : "Placed an order",
        post: { ...profilePost, is_liked_by_user: liked },
      });
    }

    // location posts
    const posts: Post[] = await socialAPI.getPosts(location, currentUserId);
    const messageItems: MessageItem[] = posts
      .filter((p) => !p.content.startsWith("USER_PROFILE:"))
      .map((p) => ({
        type: "message" as const,
        id: `msg-${p.id}`,
        ts: p.created_at,
        user: p.author,
        text: p.content,
        post: p,
      }));

    const merged = [...orderItems, ...messageItems].sort((a, b) =>
      new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
    setFeed(merged);
  }, [location, currentUserId]);

  useEffect(() => {
    buildFeed();
  }, [buildFeed]);

  const canPost = useMemo(() => {
    const userLoc = localStorage.getItem("user_pickup_location");
    return userLoc === location;
  }, [location]);

  const handlePost = async () => {
    if (!input.trim()) return;
    if (!currentUserId || !canPost) {
      toast({ title: "Login required", variant: "destructive", description: "Please login first." });
      return;
    }
    try {
      await socialAPI.createPost(input.trim(), location);
      setInput("");
      await buildFeed();
    } catch (e) {
      toast({ title: "Error", description: "Failed to post" });
    }
  };

  const handleAddComment = async (postId: number, content: string) => {
    if (!currentUserId || !content.trim()) return;
    try {
      await socialAPI.createComment(postId, content.trim());
      await buildFeed();
    } catch (e) {
      toast({ title: "Error", description: "Failed to comment" });
    }
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase();

  const relTime = (iso: string) => {
    const d = parseISO(iso);
    const now = Date.now();
    return formatDistanceToNowStrict(
      new Date(Math.min(d.getTime(), now)), // avoid "in ..."
      { addSuffix: true }
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* input bar (only when user can interact) */}
      {canPost && (
        <div className="sticky top-0 z-10 backdrop-blur-md bg-white/10 rounded-2xl p-3 shadow-lg flex items-start space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share an update or say hi…"
            className="flex-1 resize-none bg-transparent focus-visible:ring-0 border-muted"
            disabled={!canPost}
            rows={2}
          />
          <Button onClick={handlePost} disabled={!input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      <Card className="bg-white/10 backdrop-blur-md shadow-xl rounded-3xl p-4">
        <ScrollArea className="h-[70vh] pr-2">
          {feed.map((itm) => (
            <FeedRow
              key={itm.id}
              {...(itm.type === "order"
                ? {
                    type: "order" as const,
                    post: itm.post,
                    name: itm.user.name,
                    avatar: itm.user.image_url,
                    summary: itm.summary,
                    ts: itm.ts,
                    isLiked: itm.post.is_liked_by_user ?? false,
                    likesCount: itm.post.likes_count,
                  }
                : {
                    type: "message" as const,
                    post: itm.post,
                    name: itm.user.name,
                    avatar: itm.user.image_url,
                    text: itm.text,
                    ts: itm.ts,
                    isLiked: itm.post.is_liked_by_user ?? false,
                    likesCount: itm.post.likes_count,
                  })}
              canInteractActions={!!currentUserId}
              onRefresh={buildFeed}
            />
          ))}
        </ScrollArea>
      </Card>
    </div>
  );
};

export default CombinedFeed; 