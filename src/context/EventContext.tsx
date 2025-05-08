
import React, { createContext, useState, useContext, ReactNode } from "react";
import { Comment, PickupLocation, User } from "../types";
import { comments as initialComments, generateId, pickupLocations as initialLocations, users as initialUsers } from "../data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { timeSlots } from "@/data/timeSlots";

interface EventContextType {
  users: User[];
  comments: Comment[];
  pickupLocations: PickupLocation[];
  timeSlots: any[];
  currentUser: string | null;
  isAdmin: boolean;
  addUser: (user: Omit<User, "id" | "createdAt">) => void;
  addComment: (comment: { userId: string; authorId: string; content: string }) => void;
  toggleLike: (commentId: string, userId: string) => void;
  setCurrentUser: (userId: string | null) => void;
  removeUser: (userId: string) => void;
  removeComment: (commentId: string) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([
    ...initialUsers,
    {
      id: "admin1",
      name: "Admin User",
      imageUrl: "https://source.unsplash.com/random/300x300/?admin",
      pickupLocation: "Mars",
      createdAt: new Date().toISOString(),
      isAdmin: true
    }
  ]);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [pickupLocations] = useState<PickupLocation[]>(initialLocations);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { toast } = useToast();

  const isAdmin = !!currentUser && users.find(u => u.id === currentUser)?.isAdmin === true;

  const addUser = (user: Omit<User, "id" | "createdAt">) => {
    const newUser = {
      ...user,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser.id);
    toast({
      title: "Success!",
      description: "You've signed up for the Street Meat Event!",
    });
  };

  const addComment = (comment: { userId: string; authorId: string; content: string }) => {
    const author = users.find(u => u.id === comment.authorId);
    if (!author) return;

    const newComment: Comment = {
      id: generateId(),
      userId: comment.userId,
      authorId: comment.authorId,
      authorName: author.name,
      authorImageUrl: author.imageUrl,
      content: comment.content,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
    };
    
    setComments((prev) => [...prev, newComment]);
    toast({
      title: "Comment added",
      description: "Your comment has been posted!",
    });
  };

  const toggleLike = (commentId: string, userId: string) => {
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.id === commentId) {
          const isLiked = comment.likedBy.includes(userId);
          
          if (isLiked) {
            return {
              ...comment,
              likes: comment.likes - 1,
              likedBy: comment.likedBy.filter((id) => id !== userId),
            };
          } else {
            return {
              ...comment,
              likes: comment.likes + 1,
              likedBy: [...comment.likedBy, userId],
            };
          }
        }
        return comment;
      })
    );
  };

  const removeUser = (userId: string) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only admins can remove users",
        variant: "destructive"
      });
      return;
    }
    
    setUsers((prev) => prev.filter(user => user.id !== userId));
    setComments((prev) => prev.filter(comment => comment.authorId !== userId));
    
    toast({
      title: "User Removed",
      description: "The user and their comments have been removed",
    });
  };

  const removeComment = (commentId: string) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied", 
        description: "Only admins can remove comments",
        variant: "destructive"
      });
      return;
    }
    
    setComments((prev) => prev.filter(comment => comment.id !== commentId));
    
    toast({
      title: "Comment Removed",
      description: "The comment has been removed",
    });
  };

  return (
    <EventContext.Provider
      value={{
        users,
        comments,
        pickupLocations,
        timeSlots,
        currentUser,
        isAdmin,
        addUser,
        addComment,
        toggleLike,
        setCurrentUser,
        removeUser,
        removeComment,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEventContext must be used within an EventProvider");
  }
  return context;
};
