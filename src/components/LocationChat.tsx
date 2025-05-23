
import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEventContext } from "@/context/EventContext";
import CommentItem from "./CommentItem";

interface LocationChatProps {
  locationName: string;
}

const LocationChat: React.FC<LocationChatProps> = ({ locationName }) => {
  const [commentText, setCommentText] = useState("");
  const { comments, currentUser, addComment, users } = useEventContext();
  
  const filteredComments = locationName === "all" 
    ? comments 
    : comments.filter(comment => {
        const user = users.find(u => u.id === comment.userId);
        return user?.pickupLocation === locationName;
      });

  const currentUserInfo = users.find(user => user.id === currentUser);
  const canComment = currentUser && (locationName === "all" || currentUserInfo?.pickupLocation === locationName);
  
  const handleSubmitComment = () => {
    if (!currentUser || !commentText.trim()) return;
    
    addComment({
      userId: locationName === "all" ? "all" : currentUser,
      authorId: currentUser,
      content: commentText
    });
    
    setCommentText("");
  };

  return (
    <div className="mt-6 border rounded-md">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="text-lg font-semibold">
          {locationName === "all" ? "Community Chat" : `${locationName} Chat`}
        </h3>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="divide-y">
          {filteredComments.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">
              No comments yet. Be the first to start the conversation!
            </p>
          ) : (
            filteredComments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </div>
      </ScrollArea>
      
      {currentUser ? (
        <div className="p-4 border-t">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={canComment 
              ? "Write a comment..." 
              : `You can only comment in ${currentUserInfo?.pickupLocation || 'your'} chat after signing up`}
            disabled={!canComment}
            className="mb-2"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitComment} 
              disabled={!canComment || !commentText.trim()}
              className="bg-streetmeat-primary hover:bg-streetmeat-accent"
              size="sm"
            >
              Post Comment
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t text-center">
          <p className="mb-2 text-muted-foreground">Sign up to join the conversation</p>
          <Button 
            onClick={() => window.location.href = "/signup"}
            className="bg-streetmeat-primary hover:bg-streetmeat-accent"
            size="sm"
          >
            Sign Up
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationChat;
