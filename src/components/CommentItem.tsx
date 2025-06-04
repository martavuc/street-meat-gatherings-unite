import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Comment } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Heart } from "lucide-react";
import { useEventContext } from "@/context/EventContext";
import logoPng from "/logo.png";

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const { currentUser, toggleLike, isAdmin, removeComment } = useEventContext();
  const isLiked = currentUser && comment.likedBy.includes(currentUser);
  
  return (
    <div className="flex gap-4 p-4 border-b">
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.authorImageUrl} alt={comment.authorName} />
        <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex justify-between">
          <div>
            <span className="font-semibold">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {formatDistanceToNow(
                (() => {
                  const iso = comment.createdAt as unknown as string;
                  // append Z if missing timezone to treat as UTC
                  return new Date(/([+-]\d\d:?\d\d|Z)$/i.test(iso) ? iso : `${iso}Z`);
                })(),
                { addSuffix: true }
              )}
            </span>
          </div>
          {isAdmin && (
            <button 
              onClick={() => removeComment(comment.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          )}
        </div>
        <p className="mt-1 text-sm">{comment.content}</p>
        <div className="flex items-center mt-2">
          <button 
            onClick={() => currentUser && toggleLike(comment.id, currentUser)}
            disabled={!currentUser}
            className={`flex items-center gap-1 text-xs ${isLiked ? 'text-red-500' : 'text-muted-foreground'} ${!currentUser ? 'opacity-60 cursor-not-allowed' : 'hover:text-red-500'}`}
          >
            <Heart size={14} className={isLiked ? 'fill-red-500' : ''} />
            <span>{comment.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
