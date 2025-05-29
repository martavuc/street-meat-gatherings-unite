export interface User {
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

export interface Comment {
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

export interface PickupLocation {
  id: number;
  name: string;
  address: string;
  created_at: string;
}

export interface TimeSlot {
  id: number;
  time: string;
  created_at: string;
}
