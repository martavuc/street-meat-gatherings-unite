
export interface User {
  id: string;
  name: string;
  imageUrl: string;
  pickupLocation: string;
  createdAt: string;
  timeSlot?: string;
  isAdmin?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  authorId: string;
  authorName: string;
  authorImageUrl: string;
  content: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
}

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
}

export interface TimeSlot {
  id: string;
  time: string;
}
