import React from "react";
import { formatDistanceToNow, formatDistanceToNowStrict, parseISO } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle } from "lucide-react";
import ReplyDialog from "./ReplyDialog";
import { socialAPI, Post } from "@/lib/api";

interface BaseProps {
  canInteractActions: boolean;
  onRefresh: () => void;
  likesCount: number;
}

interface OrderRow extends BaseProps {
  type: "order";
  post: Post;
  name: string;
  avatar?: string;
  summary: string;
  ts: string;
  isLiked: boolean;
  likesCount: number;
}
interface MessageRow extends BaseProps {
  type: "message";
  post: Post;
  name: string;
  avatar?: string;
  text: string;
  ts: string;
  isLiked: boolean;
  likesCount: number;
}

type FeedRowProps = OrderRow | MessageRow;

// Some API timestamps come back without an explicit timezone (e.g. "2023-10-08T18:32:11.123")
// which the browser interprets as *local time* instead of UTC.  This can make the date appear
// to be in the future, resulting in "0 seconds ago" even after waiting minutes.  To fix this we
// assume a naive timestamp is UTC and append a "Z" when no offset is present.
const toDate = (iso: string) => {
  // Already has a timezone (+/-HH:MM or Z)
  if (/([+-]\d\d:?\d\d|Z)$/i.test(iso)) {
    return parseISO(iso);
  }
  // Treat as UTC by appending "Z"
  return parseISO(`${iso}Z`);
};

const relTime = (iso: string) => {
  const d = toDate(iso);
  const now = Date.now();
  // Guard against future timestamps that can still slip through
  return formatDistanceToNowStrict(new Date(Math.min(d.getTime(), now)), {
    addSuffix: true,
  });
};

const FeedRow: React.FC<FeedRowProps> = (props) => {
  const initials = props.name.split(" ").map((n) => n[0]).join("").toUpperCase();

  const handleLike = async () => {
    await socialAPI.likePost(props.post.id);
    props.onRefresh();
  };

  const handleReply = async (txt: string) => {
    await socialAPI.createComment(props.post.id, txt);
    props.onRefresh();
  };

  return (
    <div className="flex flex-col space-y-2 mb-5">
      <div className="flex items-start space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={props.avatar} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {props.type === "order" ? (
            <p><span className="font-semibold">{props.name}</span> ordered {props.summary}</p>
          ) : (
            <p><span className="font-semibold">{props.name}</span> {props.text}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {relTime(props.ts)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {props.canInteractActions && (
            <Button size="icon" variant="ghost" onClick={handleLike} className="relative">
              <Heart className={`h-4 w-4 ${props.isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
              {props.likesCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] leading-none font-medium bg-red-500 text-white rounded-full px-2 py-0.5">
                  {props.likesCount}
                </span>
              )}
            </Button>
          )}
          <ReplyDialog
            disabled={!props.canInteractActions}
            onSubmit={handleReply}
            trigger={
              <Button size="icon" variant="ghost" disabled={!props.canInteractActions}>
                <MessageCircle className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>

      {/* existing one-level comments */}
      {props.post.comments && props.post.comments.length > 0 && (
        <div className="pl-12 space-y-2">
          {props.post.comments.map((c) => (
            <div key={c.id} className="flex space-x-1 text-sm items-start">
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.author.image_url} />
                <AvatarFallback className="text-xs">
                  {c.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-white/10 rounded-xl px-1">
                  <span className="font-medium mr-1">{c.author.name}</span>
                  {c.content}
                </div>
                <p className="text-xs text-muted-foreground pl-1 mt-0.5">
                  {relTime(c.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedRow; 