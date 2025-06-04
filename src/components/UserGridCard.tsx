import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { User, Post, Comment, socialAPI } from "@/lib/api";
import { useToast } from '@/hooks/use-toast';

interface UserGridCardProps {
  user: User;
  currentUserId?: number;
  location: string;
}

const UserGridCard: React.FC<UserGridCardProps> = ({ user, currentUserId, location }) => {
  const [userPost, setUserPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCommenting, setIsCommenting] = useState(false);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getUserOrder = () => {
    if (!user.orders || user.orders.length === 0) return null;
    return user.orders.find(order => order.pickup_location === location) || user.orders[0];
  };

  // Load or create user profile post
  useEffect(() => {
    const loadUserPost = async () => {
      try {
        const post = await socialAPI.createUserProfilePost(user.id, location);
        setUserPost(post);
      } catch (error) {
        console.error('Failed to load user post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPost();
  }, [user.id, location]);

  const handleAddComment = async () => {
    if (!currentUserId || !userPost || !newComment.trim()) return;

    try {
      setIsCommenting(true);
      await socialAPI.createComment(userPost.id, newComment.trim());
      
      // Refresh the post to get updated comments
      const updatedPost = await socialAPI.createUserProfilePost(user.id, location);
      setUserPost(updatedPost);
      setNewComment("");
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted!",
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCommenting(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!currentUserId || !userPost) return;

    try {
      await socialAPI.likeComment(userPost.id, commentId);
      
      // Refresh the post to get updated likes
      const updatedPost = await socialAPI.createUserProfilePost(user.id, location);
      setUserPost(updatedPost);
    } catch (error) {
      console.error('Failed to like comment:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const userOrder = getUserOrder();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-muted rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.image_url} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user.name}</p>
            {userOrder && (
              <p className="text-xs text-muted-foreground truncate">
                Ordered: {userOrder.menu_item.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Comments Section */}
        <div className="space-y-3">
          {userPost?.comments && userPost.comments.length > 0 ? (
            userPost.comments.map((comment) => (
              <div key={comment.id} className="border-l-2 border-muted pl-3 py-2">
                <div className="flex items-start space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.author.image_url} />
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-xs font-medium">{comment.author.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                    <div className="flex items-center mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeComment(comment.id)}
                        disabled={!currentUserId}
                        className={`h-1 px-2 text-xs ${
                          comment.is_liked_by_user ? 'text-red-500' : 'text-muted-foreground'
                        }`}
                      >
                        <Heart 
                          className={`h-1 w-1 mr-1 ${comment.is_liked_by_user ? 'fill-red-500' : ''}`} 
                        />
                        {comment.likes_count}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              No comments yet. Be the first to say hi!
            </p>
          )}
        </div>

        {/* Add Comment */}
        {currentUserId && (
          <div className="mt-4 pt-3 border-t">
            <div className="space-y-2">
              <Textarea
                placeholder="Say hi or ask a question..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isCommenting}
                  className="h-8"
                >
                  <Send className="h-3 w-3 mr-2" />
                  {isCommenting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserGridCard; 