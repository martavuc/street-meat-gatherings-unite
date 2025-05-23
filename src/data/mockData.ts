
import { Comment, PickupLocation, User } from "../types";

export const pickupLocations: PickupLocation[] = [
  {
    id: "loc1",
    name: "Mars",
    address: "Stanford Campus"
  },
  {
    id: "loc2",
    name: "Kappa Sigma",
    address: "Stanford Campus"
  },
  {
    id: "loc3",
    name: "EVGR",
    address: "Stanford Campus"
  }
];

export const users: User[] = [
  {
    id: "user1",
    name: "Jamie Smith",
    imageUrl: "https://source.unsplash.com/random/300x300/?portrait",
    pickupLocation: "Mars",
    createdAt: "2025-05-01T12:00:00Z"
  },
  {
    id: "user2",
    name: "Alex Johnson",
    imageUrl: "https://source.unsplash.com/random/300x300/?person",
    pickupLocation: "Kappa Sigma",
    createdAt: "2025-05-01T14:30:00Z"
  },
  {
    id: "user3",
    name: "Jordan Lee",
    imageUrl: "https://source.unsplash.com/random/300x300/?face",
    pickupLocation: "EVGR",
    createdAt: "2025-05-01T15:45:00Z"
  }
];

export const comments: Comment[] = [
  {
    id: "comment1",
    userId: "user2",
    authorId: "user1",
    authorName: "Jamie Smith",
    authorImageUrl: "https://source.unsplash.com/random/300x300/?portrait",
    content: "Looking forward to seeing you there!",
    createdAt: "2025-05-01T16:20:00Z",
    likes: 2,
    likedBy: ["user2", "user3"]
  },
  {
    id: "comment2",
    userId: "user1",
    authorId: "user3",
    authorName: "Jordan Lee",
    authorImageUrl: "https://source.unsplash.com/random/300x300/?face",
    content: "I'm excited to try the food!",
    createdAt: "2025-05-01T17:15:00Z",
    likes: 1,
    likedBy: ["user1"]
  },
  {
    id: "comment3",
    userId: "user3",
    authorId: "user2",
    authorName: "Alex Johnson",
    authorImageUrl: "https://source.unsplash.com/random/300x300/?person",
    content: "Anyone want to meet up beforehand?",
    createdAt: "2025-05-01T18:05:00Z",
    likes: 0,
    likedBy: []
  },
  {
    id: "comment4",
    userId: "user1",
    authorId: "user1",
    authorName: "Jamie Smith",
    authorImageUrl: "https://source.unsplash.com/random/300x300/?portrait",
    content: "Mars squad, what time are people planning to arrive?",
    createdAt: "2025-05-01T19:10:00Z",
    likes: 1,
    likedBy: ["user3"]
  },
  {
    id: "comment5",
    userId: "user2",
    authorId: "user2",
    authorName: "Alex Johnson",
    authorImageUrl: "https://source.unsplash.com/random/300x300/?person",
    content: "Kappa Sig party before the pickup?",
    createdAt: "2025-05-01T20:25:00Z",
    likes: 0,
    likedBy: []
  },
  {
    id: "comment6",
    userId: "user3",
    authorId: "user3",
    authorName: "Jordan Lee",
    authorImageUrl: "https://source.unsplash.com/random/300x300/?face",
    content: "EVGR people - anyone wants to walk together?",
    createdAt: "2025-05-01T21:40:00Z",
    likes: 1,
    likedBy: ["user1"]
  }
];

// Utility to generate unique IDs
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15);
};
