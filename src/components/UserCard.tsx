import React, { useState } from "react";
import { User } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, UserX, Trash2 } from "lucide-react";
import { useEventContext } from "@/context/EventContext";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const { comments, addComment, toggleLike, currentUser, isAdmin, removeUser, removeComment } = useEventContext();
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const userComments = comments.filter((comment) => comment.userId === user.id.toString());

  const handleAddComment = () => {
    if (!currentUser) {
      alert("Please sign up to leave a comment");
      return;
    }
    
    if (newComment.trim() === "") return;
    
    addComment({
      userId: user.id.toString(),
      authorId: currentUser,
      content: newComment,
    });
    
    setNewComment("");
  };

  const handleToggleLike = (commentId: string) => {
    if (!currentUser) {
      alert("Please sign up to like comments");
      return;
    }
    
    toggleLike(commentId, currentUser);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="bg-gradient-to-r from-streetmeat-primary to-streetmeat-secondary h-24"></div>
      </CardHeader>
      <CardContent className="p-6 -mt-12">
        <div className="flex flex-col items-center">
          <Avatar className="w-24 h-24 border-4 border-background">
            <AvatarImage src={user.image_url} />
            <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex items-center mt-2">
            <h3 className="text-xl font-semibold">{user.name}</h3>
            {isAdmin && user.id.toString() !== currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                    <UserX className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => removeUser(user.id.toString())}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Pickup at: <span className="font-medium">{user.pickup_location}</span>
          </p>
          {user.time_slot && (
            <p className="text-sm text-muted-foreground mt-1">
              Time: <span className="font-medium">{user.time_slot}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
          </p>
        </div>

        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {showComments ? "Hide Comments" : `Comments (${userComments.length})`}
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4">
            {userComments.length > 0 ? (
              userComments.map((comment) => (
                <div key={comment.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.authorImageUrl} />
                        <AvatarFallback className="text-xs">
                          {getInitials(comment.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{comment.authorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => removeComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-sm">{comment.content}</p>
                  <div className="mt-2 flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground"
                      onClick={() => handleToggleLike(comment.id)}
                    >
                      <Heart
                        className={`h-4 w-4 mr-1 ${
                          currentUser && comment.likedBy.includes(currentUser)
                            ? "fill-streetmeat-primary text-streetmeat-primary"
                            : ""
                        }`}
                      />
                      <span>{comment.likes}</span>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-2">
                No comments yet. Be the first to comment!
              </p>
            )}

            <Separator className="my-4" />

            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!currentUser}
              />
              <Button
                onClick={handleAddComment}
                disabled={!currentUser || newComment.trim() === ""}
                className="w-full bg-streetmeat-primary hover:bg-streetmeat-accent"
              >
                Post Comment
              </Button>
              {!currentUser && (
                <p className="text-center text-xs text-muted-foreground">
                  Please sign up to leave comments
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 p-4"></CardFooter>
    </Card>
  );
};

export default UserCard;
