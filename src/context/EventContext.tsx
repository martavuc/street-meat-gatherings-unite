import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { authAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

// Define interfaces for real API data
interface User {
  id: number;
  name: string;
  email?: string;
  image_url?: string;
  pickup_location: string;
  time_slot?: string;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}

interface PickupLocation {
  id: number;
  name: string;
  address: string;
  created_at: string;
}

interface TimeSlot {
  id: number;
  time: string;
  created_at: string;
}

interface Comment {
  id: string;
  userId: string;
  authorId: string;
  authorName: string;
  authorImageUrl?: string;
  content: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
}

interface EventContextType {
  users: User[];
  comments: Comment[];
  pickupLocations: PickupLocation[];
  timeSlots: TimeSlot[];
  currentUser: string | null;
  isAdmin: boolean;
  addUser: (user: Omit<User, "id" | "created_at">) => Promise<void>;
  addComment: (comment: { userId: string; authorId: string; content: string }) => void;
  toggleLike: (commentId: string, userId: string) => void;
  setCurrentUser: (userId: string | null) => void;
  removeUser: (userId: string) => void;
  removeComment: (commentId: string) => void;
  isLoading: boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAdmin = !!currentUser && users.find(u => u.id.toString() === currentUser)?.is_admin === true;

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, locationsData, timeSlotsData] = await Promise.all([
          authAPI.getUsers(),
          authAPI.getPickupLocations(),
          authAPI.getTimeSlots(),
        ]);
        
        setUsers(usersData);
        setPickupLocations(locationsData);
        setTimeSlots(timeSlotsData);
      } catch (error) {
        console.error('Failed to load data from API:', error);
        toast({
          title: "Error",
          description: "Failed to load data from server. Using offline mode.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const addUser = async (user: Omit<User, "id" | "created_at">) => {
    try {
      const newUser = await authAPI.register({
        name: user.name,
        email: user.email,
        image_url: user.image_url,
        pickup_location: user.pickup_location,
        time_slot: user.time_slot,
      });
    
    setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser.id.toString());
    toast({
      title: "Success!",
      description: "You've signed up for the Street Meat Event!",
    });
    } catch (error) {
      console.error('Failed to register user:', error);
      toast({
        title: "Error",
        description: "Failed to sign up. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addComment = (comment: { userId: string; authorId: string; content: string }) => {
    const author = users.find(u => u.id.toString() === comment.authorId);
    if (!author) return;

    const newComment: Comment = {
      id: Date.now().toString(), // Simple ID generation
      userId: comment.userId,
      authorId: comment.authorId,
      authorName: author.name,
      authorImageUrl: author.image_url,
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
    
    setUsers((prev) => prev.filter(user => user.id.toString() !== userId));
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
        isLoading,
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
