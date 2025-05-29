import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Post, Comment } from "@/lib/api";
import CommentCard from "./CommentCard";

interface PostCardProps {
  post: Post;
  currentUserId?: number;
  isAdmin?: boolean;
  onLike: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
  onEdit?: (postId: number, content: string) => void;
  onDelete?: (postId: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  isAdmin,
  onLike,
  onComment,
  onEdit,
  onDelete,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const canEdit = currentUserId && (post.author_id === currentUserId || isAdmin);
  const canDelete = currentUserId && (post.author_id === currentUserId || isAdmin);

  const handleLike = () => {
    if (currentUserId) {
      onLike(post.id);
    }
  };

  const handleComment = () => {
    if (currentUserId && commentText.trim()) {
      onComment(post.id, commentText.trim());
      setCommentText("");
    }
  };

  const handleEdit = () => {
    if (onEdit && editContent.trim() !== post.content) {
      onEdit(post.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm("Are you sure you want to delete this post?")) {
      onDelete(post.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.image_url} />
              <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                {post.location_filter && (
                  <span className="ml-2 px-2 py-1 bg-muted rounded-full text-xs">
                    {post.location_filter}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(post.content);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleEdit}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap mb-4">{post.content}</p>
        )}

        {/* Action buttons */}
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!currentUserId}
            className={`flex items-center space-x-1 ${
              post.is_liked_by_user ? 'text-red-500' : 'text-muted-foreground'
            }`}
          >
            <Heart 
              className={`h-4 w-4 ${post.is_liked_by_user ? 'fill-red-500' : ''}`} 
            />
            <span>{post.likes_count}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-muted-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count}</span>
          </Button>
        </div>

        {/* Comment input */}
        {currentUserId && (
          <div className="space-y-3 mb-4">
            <Textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleComment}
                disabled={!commentText.trim()}
              >
                Comment
              </Button>
            </div>
          </div>
        )}

        {/* Comments */}
        {showComments && post.comments && post.comments.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            {post.comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onLike={(commentId) => {
                  // Handle comment like
                }}
                onReply={(commentId, content) => {
                  // Handle comment reply
                }}
                onEdit={(commentId, content) => {
                  // Handle comment edit
                }}
                onDelete={(commentId) => {
                  // Handle comment delete
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard; 